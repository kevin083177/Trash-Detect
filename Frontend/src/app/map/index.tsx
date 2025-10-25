import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, PermissionsAndroid, Platform, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { LocationPanel } from '@/components/map/LocationPanel';
import { Station, UserLocation } from '@/interface/Station';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { asyncGet } from '@/utils/fetch';
import { station_api } from '@/api/api';
import { RECYCLE_TYPE_LABELS } from '@/interface/Recycle';

interface GeolocationEvent {
  nativeEvent: {
    coordinate?: {
      latitude: number;
      longitude: number;
    };
  };
}

const { width } = Dimensions.get('window');

export default function MapPage() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [displayStations, setDisplayStations] = useState<Station[]>([]);
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const mapRef = useRef<MapView>(null);
  const markerRefs = useRef<{ [key: string]: any }>({});
  
  const stationsFetchedRef = useRef(false);
  const locationFetchedRef = useRef(false);

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const fetchStations = useCallback(async (): Promise<void> => {
    if (stationsFetchedRef.current) {
      return;
    }

    try {
      const response = await asyncGet(station_api.get_stations);
      
      if (response.status === 200 && response.body) {
        const stationsData: Station[] = response.body.map((item: any) => ({
          id: item._id,
          name: item.name,
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
          type: item.station_type,
          categories: item.category || [],
        }));
        
        setStations(stationsData);
        setDisplayStations(stationsData);
        setAllStations(stationsData);
        
        stationsFetchedRef.current = true;
      } else {
        console.error(response);
        Alert.alert('錯誤', '無法獲取站點資料');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('錯誤', '取得站點資料時發生錯誤');
    }
  }, []);

  const calculateNearestStations = useCallback((
    latitude: number, 
    longitude: number, 
    stationsToCalculate?: Station[]
  ): void => {
    const targetStations = stationsToCalculate || stations;
    
    if (targetStations.length === 0) {
      return;
    }
    
    try {
      const stationsWithDistance: Station[] = targetStations.map((station) => ({
        ...station,
        distance: calculateDistance(latitude, longitude, station.latitude, station.longitude),
      }));

      const sorted = stationsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      setAllStations(sorted);
      
      const nearbyStations = sorted.filter(station => (station.distance || 0) <= 30);
      
      const stationsToDisplay = nearbyStations.length > 0 ? nearbyStations : sorted.slice(0, 10);
      setDisplayStations(stationsToDisplay);
      
    } catch (error) {
      console.error(error);
    }
  }, [stations, calculateDistance]);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '位置權限',
            message: '應用需要訪問您的位置來顯示附近的站點',
            buttonNeutral: '稍後詢問',
            buttonNegative: '取消',
            buttonPositive: '確認',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const getCurrentLocation = useCallback(async (): Promise<void> => {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      Alert.alert('權限被拒絕', '需要位置權限才能顯示附近的站點');
      setLoading(false);
      locationFetchedRef.current = true;
      return;
    }

    setLocationPermission(true);
    
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation: UserLocation = { latitude, longitude };
        
        setUserLocation(newLocation);
        locationFetchedRef.current = true;
        
        if (stationsFetchedRef.current) {
          setTimeout(() => {
            const currentStations = stations.length > 0 ? stations : [];
            if (currentStations.length > 0) {
              calculateNearestStations(latitude, longitude, currentStations);
            }
          }, 100);
        }
        
        setLoading(false);

        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      },
      (error) => {
        console.log(error);
        locationFetchedRef.current = true;
        setLoading(false);
      },
      { 
        enableHighAccuracy: false,
        timeout: 10000, 
        maximumAge: 60000
      }
    );
  }, [stations, calculateNearestStations]);

  const onUserLocationChange = useCallback((event: GeolocationEvent): void => {
    if (event.nativeEvent && event.nativeEvent.coordinate) {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      const newLocation: UserLocation = { latitude, longitude };
      
      if (!userLocation || 
          Math.abs(userLocation.latitude - latitude) > 0.001 || 
          Math.abs(userLocation.longitude - longitude) > 0.001) {
        setUserLocation(newLocation);
        
        if (stationsFetchedRef.current) {
          calculateNearestStations(latitude, longitude);
        }
      }
    }
  }, [userLocation, calculateNearestStations]);

  const handleStationPress = useCallback((station: Station): void => {
    setSelectedStation(station);
    
    if (userLocation && station.distance === undefined) {
      const distance = calculateDistance(
        userLocation.latitude, 
        userLocation.longitude, 
        station.latitude, 
        station.longitude
      );
      
      const updatedStation = { ...station, distance };
      
      setDisplayStations(prev => prev.map(s => 
        s.id === station.id ? updatedStation : s
      ));
      
      setAllStations(prev => prev.map(s => 
        s.id === station.id ? updatedStation : s
      ));
      
      setSelectedStation(updatedStation);
    }
    
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: station.latitude,
        longitude: station.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
    
    setTimeout(() => {
      const marker = markerRefs.current[station.id];
      if (marker) {
        marker.showCallout();
      }
    }, 500);
  }, [userLocation, calculateDistance]);

  const handleMarkerPress = useCallback((station: Station): void => {
    setSelectedStation(station);
    setTimeout(() => {
      const marker = markerRefs.current[station.id];
      if (marker) {
        marker.showCallout();
      }
    }, 0);
  }, []);

  const handlePanelScroll = useCallback((station: Station): void => {
    setSelectedStation(station);
    
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: station.latitude,
        longitude: station.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }

    setTimeout(() => {
      const marker = markerRefs.current[station.id];
      if (marker) {
        marker.showCallout();
      }
    }, 300); 
  }, []);

  const findNearestStation = useCallback((): Station | null => {
    if (!userLocation || displayStations.length === 0) return null;
    
    return displayStations.reduce((nearest, current) => {
      if (!nearest.distance || !current.distance) return nearest;
      return current.distance < nearest.distance ? current : nearest;
    });
  }, [userLocation, displayStations]);

  useEffect(() => {
    const initialize = async () => {
      const stationsPromise = fetchStations();
      const locationPromise = getCurrentLocation();
      
      await Promise.all([stationsPromise, locationPromise]);
    };

    initialize();
  }, []);

  useEffect(() => {
    if (stationsFetchedRef.current && locationFetchedRef.current && userLocation && stations.length > 0) {
      const hasDistance = stations.some(s => s.distance !== undefined);
      if (!hasDistance) {
        calculateNearestStations(userLocation.latitude, userLocation.longitude, stations);
      }
    }
  }, [stations, userLocation, calculateNearestStations]);

  const nearestStation = findNearestStation();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={32} color="#fff" />
      </TouchableOpacity>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 25.047924,
          longitude: 121.517081,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onUserLocationChange={onUserLocationChange}
      >
        {stations.map((station) => {
          const isSelected = selectedStation?.id === station.id;
          return (
            <Marker
              key={station.id}
              ref={(ref) => {
                if (ref) {
                  markerRefs.current[station.id] = ref;
                }
              }}
              coordinate={{
                latitude: station.latitude,
                longitude: station.longitude,
              }}
              title={station.name}
              description={station.categories.map(c => RECYCLE_TYPE_LABELS[c]).join('、')}
              onPress={() => handleMarkerPress(station)}
            > 
              <View style={[
                styles.markerContainer,
                isSelected && styles.markerContainerSelected
              ]}>
                <View style={[
                  styles.markerInner,
                  isSelected && styles.markerInnerSelected
                ]}>
                  <Ionicons 
                    name="location"
                    size={isSelected ? 48 : 36} 
                    color={isSelected ? '#2196F3': "#FF5252" }
                  />
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      <LocationPanel
        stations={displayStations}
        allStations={allStations}
        userLocation={userLocation}
        title={"附近的回收站"}
        onStationPress={handleStationPress}
        onStationScroll={handlePanelScroll}
        selectedStation={selectedStation}
        nearestStation={nearestStation}
        visible={true}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>正在初始化地圖...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 8,
    borderRadius: 24,
    backgroundColor: '#000'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  markerContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContainerSelected: {
    width: 48,
    height: 48,
  },
  markerInner: {
    width: 36,
    height: 36,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInnerSelected: {
    width: 48,
    height: 48,
  },
});