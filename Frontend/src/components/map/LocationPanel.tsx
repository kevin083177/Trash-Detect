import React, { useRef, useCallback, useEffect, useMemo, memo } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Linking, Platform } from 'react-native';
import { Station, UserLocation } from '@/interface/Station';
import { StationListModal } from './StationListModal';
import { RECYCLE_TYPE_LABELS } from '@/interface/Recycle';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface LocationPanelProps {
  stations: Station[];
  allStations?: Station[];
  userLocation?: UserLocation | null;
  title?: string;
  onStationPress?: (station: Station) => void;
  onStationScroll?: (station: Station) => void;
  selectedStation?: Station | null;
  nearestStation?: Station | null;
  visible?: boolean;
}

const stationPropsAreEqual = (
  prevProps: { station: Station; isSelected: boolean; isNearest: boolean },
  nextProps: { station: Station; isSelected: boolean; isNearest: boolean }
) => {
  return (
    prevProps.station.id === nextProps.station.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isNearest === nextProps.isNearest &&
    prevProps.station.distance === nextProps.station.distance
  );
};

const StationCard = memo<{ 
  station: Station; 
  index: number; 
  isSelected: boolean; 
  isNearest: boolean; 
  onStationPress?: (station: Station) => void;
  onNavigate: (station: Station) => void;
}>(({ station, index, isSelected, isNearest, onStationPress, onNavigate }) => {
  const maxCategoryLabels = 3;
  
  const { displayCategories, hasMoreCategories, extraCount } = useMemo(() => {
    const categories = station.categories || [];
    return {
      displayCategories: categories.slice(0, maxCategoryLabels),
      hasMoreCategories: categories.length > maxCategoryLabels,
      extraCount: categories.length - maxCategoryLabels
    };
  }, [station.categories]);

  const handlePress = useCallback(() => {
    onStationPress?.(station);
  }, [station.id, onStationPress]);

  const handleNavigate = useCallback(() => {
    onNavigate(station);
  }, [station.id, onNavigate]);

  const typeLabelStyle = useMemo(() => [
    styles.typeLabel,
    station.type.name === '碳竹雞' ? styles.carbonLabel : styles.recycleLabel
  ], [station.type.name]);

  return (
    <TouchableOpacity
      style={[
        styles.stationCard,
        isSelected && styles.selectedStationCard
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.stationHeader}>
        <Text style={styles.stationName} numberOfLines={1}>
          {station.name}
        </Text>
        <View style={styles.distanceContainer}>
          {station.distance !== undefined && (
            <Text style={styles.distance}>
              {station.distance.toFixed(2)} km
            </Text>
          )}
        </View>
      </View>

      <View style={styles.horizontalLabelsContainer}>
        <View style={styles.leftLabelsGroup}>
          <Text style={typeLabelStyle}>
            {station.type.name}
          </Text>
          
          {displayCategories.map((category) => (
            <Text key={category} style={styles.categoryLabel}>
              {RECYCLE_TYPE_LABELS[category]}
            </Text>
          ))}
          
          {hasMoreCategories && (
            <Text style={styles.moreLabel}>
              +{extraCount}
            </Text>
          )}
        </View>
        
        {isNearest && station.distance !== undefined && (
          <Text style={styles.nearestLabel}>最近</Text>
        )}
        {station.distance !== undefined && station.distance > 30 && (
          <Text style={styles.farStationLabel}>距離過遠</Text>
        )}
      </View>
    
      <Text style={[
        styles.address, 
        isSelected && styles.selectedText
      ]} numberOfLines={1}>
        {station.address}
      </Text>

      <TouchableOpacity
        style={styles.navigationButton}
        onPress={handleNavigate}
        activeOpacity={0.8}
      >
        <Ionicons 
          name="navigate" 
          size={14} 
          color='#fff'
          style={styles.navigationIcon}
        />
        <Text style={styles.navigationButtonText}>
          帶我去
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}, stationPropsAreEqual);

StationCard.displayName = 'StationCard';

export const LocationPanel: React.FC<LocationPanelProps> = ({ 
  stations = [], 
  allStations = [],
  userLocation,
  title, 
  onStationPress,
  onStationScroll,
  selectedStation,
  nearestStation,
  visible = true 
}) => {
  
  const flatListRef = useRef<FlatList>(null);
  const [showAllStationsModal, setShowAllStationsModal] = React.useState(false);
  const [modalSelectedStation, setModalSelectedStation] = React.useState<Station | null>(null);
  const scrollingRef = useRef(false);
  
  if (!visible) {
    return null;
  }

  const filteredStations = useMemo(() => {
    if (stations.length === 0) {
      return [];
    }

    const stationsWithDistance = stations.filter(s => s.distance !== undefined);
    const stationsWithoutDistance = stations.filter(s => s.distance === undefined);
    
    let displayList: Station[] = [];
    
    if (stationsWithDistance.length > 0) {
      const nearbyStations = stationsWithDistance.filter(station => station.distance! <= 30);
      
      if (nearbyStations.length > 0) {
        displayList = nearbyStations;
      } else {
        displayList = stationsWithDistance
          .sort((a, b) => (a.distance || 0) - (b.distance || 0))
          .slice(0, 10);
      }
    } else {
      displayList = stations.slice(0, 10);
    }
    
    if (modalSelectedStation) {
      const isAlreadyInList = displayList.some(station => station.id === modalSelectedStation.id);
      
      if (isAlreadyInList) {
        const otherStations = displayList.filter(station => station.id !== modalSelectedStation.id);
        return [modalSelectedStation, ...otherStations];
      } else {
        return [modalSelectedStation, ...displayList];
      }
    }
    
    return displayList;
  }, [stations, modalSelectedStation]);

  const scrollToStation = useCallback((station: Station) => {
    if (scrollingRef.current || !flatListRef.current || filteredStations.length === 0) return;
    
    let targetIndex = filteredStations.findIndex(s => s.id === station.id);
    
    if (targetIndex >= 0) {
      scrollingRef.current = true;
      
      try {
        flatListRef.current.scrollToIndex({
          index: targetIndex,
          animated: true,
          viewPosition: 0.5,
        });
      } catch (error) {
        console.warn('滾動失敗:', error);
        const itemWidth = width * 0.7 + 10;
        const offset = targetIndex * itemWidth;
        flatListRef.current.scrollToOffset({
          offset,
          animated: true,
        });
      }
      
      setTimeout(() => {
        scrollingRef.current = false;
      }, 1000);
    }
  }, [filteredStations]);

  useEffect(() => {
    if (modalSelectedStation && !scrollingRef.current) {
      setTimeout(() => {
        if (flatListRef.current) {
          try {
            flatListRef.current.scrollToIndex({
              index: 0,
              animated: true,
              viewPosition: 0.5,
            });
          } catch (error) {
            flatListRef.current.scrollToOffset({
              offset: 0,
              animated: true,
            });
          }
        }
      }, 200);
    }
  }, [modalSelectedStation]);

  useEffect(() => {
    if (selectedStation && !scrollingRef.current) {
      scrollToStation(selectedStation);
    }
  }, [selectedStation, scrollToStation]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
    minimumViewTime: 200,
  }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ item: Station }> }) => {
      if (scrollingRef.current || viewableItems.length === 0 || !onStationScroll) return;

      const centerIndex = Math.floor(viewableItems.length / 2);
      const currentStation = viewableItems[centerIndex]?.item;

      if (currentStation && selectedStation?.id !== currentStation.id) {
        onStationScroll(currentStation);
      }
    },
    [onStationScroll, selectedStation]
  );

  const openNavigation = useCallback((station: Station) => {
    const { latitude, longitude } = station;
    const startPoint = userLocation 
    ? `${userLocation.latitude},${userLocation.longitude}`
    : 'My+Location';

    const url = Platform.select({
      ios: `maps:?saddr=${startPoint}&daddr=${latitude},${longitude}`,
      android: `https://www.google.com/maps/dir/?api=1&origin=${startPoint}&destination=${latitude},${longitude}`,
    });

    if (url) {
        Linking.canOpenURL(url).then(supported => {
        if (supported) {
            Linking.openURL(url);
        } else {
            const googleMapsUrl = userLocation
              ? `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${latitude},${longitude}`
              : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
            Linking.openURL(googleMapsUrl);
          }
        });
    }
  }, [userLocation]);

  const renderItem = useCallback(({ item: station, index }: { item: Station; index: number }) => {
    const isSelected = selectedStation?.id === station.id;
    const isNearest = nearestStation?.id === station.id;
    
    return (
      <StationCard
        station={station}
        index={index}
        isSelected={isSelected}
        isNearest={isNearest}
        onStationPress={onStationPress}
        onNavigate={openNavigation}
      />
    );
  }, [selectedStation?.id, nearestStation?.id, onStationPress, openNavigation]);

  const keyExtractor = useCallback((item: Station) => item.id, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: width * 0.7 + 10,
    offset: (width * 0.7 + 10) * index,
    index,
  }), []);

  const handleModalStationPress = useCallback((station: Station) => {
    setShowAllStationsModal(false);
    setModalSelectedStation(station);
    
    setTimeout(() => {
      if (flatListRef.current) {
        try {
          flatListRef.current.scrollToIndex({
            index: 0,
            animated: true,
            viewPosition: 0.5,
          });
        } catch (error) {
          flatListRef.current.scrollToOffset({
            offset: 0,
            animated: true,
          });
        }
      }
      
      onStationPress?.(station);
    }, 100);
  }, [onStationPress]);

  const handleShowAllStations = useCallback(() => {
    setShowAllStationsModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowAllStationsModal(false);
  }, []);

  if (filteredStations.length === 0) {
    const hasStations = stations.length > 0;
    const hasDistanceCalculated = stations.some(s => s.distance !== undefined);
    
    let emptyMessage = "正在加載站點信息...";
    if (hasStations && hasDistanceCalculated) {
      emptyMessage = "附近30公里內沒有站點";
    } else if (hasStations && !hasDistanceCalculated) {
      emptyMessage = "正在計算距離...";
    }

    return (
      <View style={styles.floatingCarouselContainer}>
        <View style={styles.carouselHeader}>
          <Text style={styles.carouselTitle}>碳竹雞站點</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
          {hasStations && (
            <TouchableOpacity 
              style={styles.stationCountButton}
              onPress={handleShowAllStations}
            >
              <Text style={styles.stationCountText}>
                查看全部站點 ({allStations.length || stations.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.floatingCarouselContainer}>
        <View style={styles.carouselHeader}>
          <Text style={styles.carouselTitle}>{title}</Text>
          <TouchableOpacity 
            style={styles.stationCountButton}
            onPress={handleShowAllStations}
          >
            <Text style={styles.stationCountText}>
              所有回收站
            </Text>
          </TouchableOpacity>
        </View>
        <FlatList
          ref={flatListRef}
          data={filteredStations}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          snapToInterval={width * 0.7 + 10}
          snapToAlignment="center"
          decelerationRate="fast"
          pagingEnabled={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={getItemLayout}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={11}
          initialNumToRender={3}
          updateCellsBatchingPeriod={50}
          onScrollToIndexFailed={(error) => {
            const { index } = error;
            const itemWidth = width * 0.7 + 10;
            const offset = index * itemWidth;
            setTimeout(() => {
              flatListRef.current?.scrollToOffset({
                offset,
                animated: true,
              });
            }, 100);
          }}
        />
      </View>
      
      <StationListModal
        visible={showAllStationsModal}
        stations={allStations.length > 0 ? allStations : stations}
        onClose={handleCloseModal}
        onStationPress={handleModalStationPress}
      />
    </>
  );
};

const styles = StyleSheet.create({
  floatingCarouselContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 15,
    paddingBottom: 12,
    backdropFilter: 'blur(10px)',
  },
  carouselHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stationCountButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
  },
  stationCountText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  carouselContent: {
    paddingHorizontal: 15,
  },
  stationCard: {
    width: width * 0.7,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  distanceContainer: {
    alignItems: 'flex-end',
  },
  distance: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  horizontalLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leftLabelsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  carbonLabel: {
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  recycleLabel: {
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  categoryLabel: {
    fontSize: 8,
    color: '#2196F3',
    backgroundColor: '#E3F2FD',
    fontWeight: '600',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  moreLabel: {
    fontSize: 8,
    color: '#666',
    backgroundColor: '#F5F5F5',
    fontWeight: '600',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nearestLabel: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: 'bold',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  address: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  navigationButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  navigationIcon: {
    marginRight: 6,
  },
  selectedStationCard: {
    borderColor: '#2196F3',
    borderWidth: 2,
    backgroundColor: '#F3F8FF',
  },
  selectedText: {
    color: '#2196F3',
  },
  farStationLabel: {
    fontSize: 9,
    color: '#ff0000ff',
    fontWeight: 'bold',
    backgroundColor: '#ffe1e0ff',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: 2,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
});