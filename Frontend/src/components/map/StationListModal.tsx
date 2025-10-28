import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { Station } from '@/interface/Station';
import { Ionicons } from '@expo/vector-icons';

interface StationListModalProps {
  visible: boolean;
  stations: Station[];
  onClose: () => void;
  onStationPress: (station: Station) => void;
}

const stationItemPropsAreEqual = (
  prevProps: { station: Station; index: number },
  nextProps: { station: Station; index: number }
) => {
  return (
    prevProps.station.id === nextProps.station.id &&
    prevProps.index === nextProps.index &&
    prevProps.station.distance === nextProps.station.distance &&
    prevProps.station.name === nextProps.station.name &&
    prevProps.station.type.name === nextProps.station.type.name
  );
};

const StationListItem = memo<{
  station: Station;
  index: number;
  onStationPress: (station: Station) => void;
}>(({ station, index, onStationPress }) => {
  
  const handlePress = useCallback(() => {
    onStationPress(station);
  }, [station.id, onStationPress]);

  const typeLabelStyle = useMemo(() => [
    styles.typeLabel,
    station.type.name === '碳竹雞' ? styles.carbonLabel : styles.recycleLabel
  ], [station.type.name]);

  const distanceText = useMemo(() => {
    if (station.distance === undefined) {
      return '計算中...';
    }
    return `${station.distance.toFixed(2)} km`;
  }, [station.distance]);

  return (
    <TouchableOpacity
      style={styles.stationItem}
      onPress={handlePress}
      activeOpacity={0.6}
    >
      <View style={styles.stationContent}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={24} color="#2196F3" />
          </View>
          <View style={styles.stationInfo}>
            <Text style={styles.stationName} numberOfLines={1}>
              {station.name}
            </Text>
            <Text style={styles.stationAddress} numberOfLines={2}>
              {station.address}
            </Text>
          </View>
        </View>
        
        <View style={styles.rightSection}>
          <Text style={typeLabelStyle}>
            {station.type.name}
          </Text>
          <View style={styles.distanceContainer}>
            <Ionicons 
              name="navigate" 
              size={14} 
              color={station.distance !== undefined ? '#2196F3' : '#999'} 
            />
            <Text style={
              station.distance !== undefined 
                ? styles.distanceText 
                : styles.noDistanceText
            }>
              {distanceText}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}, stationItemPropsAreEqual);

StationListItem.displayName = 'StationListItem';

export const StationListModal: React.FC<StationListModalProps> = ({
  visible,
  stations,
  onClose,
  onStationPress,
}) => {
  const sortedStations = useMemo(() => {
    return [...stations].sort((a, b) => {
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });
  }, [stations]);

  const renderItem = useCallback(({ item: station, index }: { item: Station; index: number }) => {
    return (
      <StationListItem
        station={station}
        index={index}
        onStationPress={onStationPress}
      />
    );
  }, [onStationPress]);

  const keyExtractor = useCallback((item: Station) => item.id, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 100,
    offset: 100 * index,
    index,
  }), []);

  const renderSeparator = useCallback(() => <View style={styles.separator} />, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close-outline" size={24} color="#333"></Ionicons>
          </TouchableOpacity>
          <Text style={styles.title}>所有回收站點</Text>
          <View style={styles.headerSpacer} />
        </View>

        <FlatList
          data={sortedStations}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          style={styles.list}
          showsVerticalScrollIndicator={true}
          getItemLayout={getItemLayout}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={11}
          initialNumToRender={15}
          updateCellsBatchingPeriod={50}
          ItemSeparatorComponent={renderSeparator}
          contentContainerStyle={styles.listContent}
          disableVirtualization={false}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.5,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  headerSpacer: {
    width: 28,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  stationItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  stationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  stationAddress: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 90,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
  carbonLabel: {
    color: '#F57C00',
    backgroundColor: '#FFF3E0',
  },
  recycleLabel: {
    color: '#388E3C',
    backgroundColor: '#E8F5E9',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    letterSpacing: 0.3,
  },
  noDistanceText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  separator: {
    height: 0,
  },
});