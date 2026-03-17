import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Linking, Dimensions, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { ChevronLeft, Phone, MapPin, Clock, Users, Info, Car as CarIcon, XCircle, CreditCard, Banknote, TrendingUp, Navigation, UserCheck, MapPinned, PlayCircle, CheckCircle2, AlertCircle, Timer, LocateFixed } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_MAPS_API_KEY as string;

const DEFAULT_LOCATION = {
  latitude: 44.8666,
  longitude: 13.8496
};

interface Vehicle {
  make: string;
  model: string;
  variant: string;
  plate: string;
  display_name: string;
}

interface Ride {
  id: string;
  status: string;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  destination_address: string;
  destination_lat: number | null;
  destination_lng: number | null;
  scheduled_at: string;
  passengers: number;
  notes?: string;
  driver_id?: string;
  eta_minutes?: number;
  payment_method: string;
  amount?: number | null;
  client_percentage?: number; 
  vehicle?: Vehicle | null;
}

interface Driver {
  id: string;
  full_name: string;
  phone: string;
  last_lat: number | null;
  last_lng: number | null;
}

export default function RideDetailsScreen({ route, navigation }: any) {
  const { rideId } = route.params;
  const { theme, isDarkMode } = useTheme();
  const mapRef = useRef<MapView>(null);
  
  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState<Ride | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);

  const statusMap: Record<string, { label: string, color: string, icon: any, showLoader: boolean }> = {
    pending: { label: 'Traženje vozača', color: '#FF9500', icon: Timer, showLoader: true },
    scheduled: { label: 'Zakazana', color: theme.accent, icon: Clock, showLoader: false },
    accepted: { label: 'Vozač prihvatio', color: '#5856D6', icon: UserCheck, showLoader: false },
    arriving: { label: 'Na putu', color: '#007AFF', icon: Navigation, showLoader: false },
    arrived: { label: 'Na lokaciji', color: '#32ADE6', icon: MapPinned, showLoader: false },
    in_progress: { label: 'U tijeku', color: '#AF52DE', icon: PlayCircle, showLoader: false },
    completed: { label: 'Završena', color: '#34C759', icon: CheckCircle2, showLoader: false },
    cancelled: { label: 'Otkazana', color: '#FF3B30', icon: XCircle, showLoader: false },
    ignored: { label: 'Neodgovorena', color: '#8E8E93', icon: AlertCircle, showLoader: false },
  };

  useEffect(() => {
    if (!rideId) {
      Alert.alert('Greška', 'ID narudžbe nije pronađen.');
      navigation.goBack();
      return;
    }

    loadData();

    const subscription = supabase
      .channel(`ride-details-${rideId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` }, 
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [rideId]);

  async function loadData() {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:driver_id (
            id,
            full_name,
            phone,
            last_lat,
            last_lng
          ),
          vehicle:vehicle_id (
            make,
            model,
            variant,
            plate,
            display_name
          ),
          shifts:shift_id (
            vehicle:vehicle (
              make,
              model,
              variant,
              plate,
              display_name
            )
          ),
          clients!client_id (
            percentage
          )
        `)
        .eq('id', rideId)
        .single();

      if (error) throw error;

      if (data) {
        const percentage = data.clients?.percentage || 0;
        
        // Logika za vozilo: prvo gledaj direktno na rides.vehicle_id, 
        // ako je null, povuci iz smjene (shift_id)
        const vehicleInfo = data.vehicle || (data.shifts?.vehicle) || null;

        setRide({ 
          ...data, 
          client_percentage: percentage,
          vehicle: vehicleInfo 
        });
        setDriver(data.driver || null);
      }
    } catch (error: any) {
      console.error("Supabase Error:", error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleCall = (number: string) => {
    if (number) Linking.openURL(`tel:${number}`);
  };

  const handleCancelRide = async () => {
    Alert.alert(
      "Otkaži narudžbu",
      "Jeste li sigurni da želite otkazati ovu narudžbu?",
      [
        { text: "Odustani", style: "cancel" },
        { 
          text: "Da, otkaži", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true); // Pokreni loader dok se baza ažurira
              const { error } = await supabase
                .from('rides')
                .update({ status: 'cancelled' })
                .eq('id', rideId);

              if (error) {
                Alert.alert("Greška", "Nije moguće otkazati narudžbu.");
                setLoading(false);
              } else {
                // Ovdje biraš: 
                // Opcija A: navigation.goBack() - ako želiš zatvoriti ekran
                // Opcija B: Ništa - subscription će sam osvježiti UI jer loadData() postavlja setLoading(false)
                navigation.goBack(); 
              }
            } catch (err) {
              console.error(err);
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading || !ride) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const currentStatus = statusMap[ride.status] || { label: ride.status, color: '#8E8E93', icon: AlertCircle, showLoader: false };
  const StatusIcon = currentStatus.icon;
  
  const hotelOrigin = {
    latitude: ride.pickup_lat || DEFAULT_LOCATION.latitude,
    longitude: ride.pickup_lng || DEFAULT_LOCATION.longitude,
  };

  const destination = {
    latitude: ride.destination_lat || DEFAULT_LOCATION.latitude,
    longitude: ride.destination_lng || DEFAULT_LOCATION.longitude,
  };

  const routeOrigin = (ride.status === 'in_progress' && driver?.last_lat && driver?.last_lng)
    ? { latitude: driver.last_lat, longitude: driver.last_lng }
    : hotelOrigin;

  const hideETA = ["arrived", "in_progress", "completed", "ignored", "cancelled", "scheduled"].includes(ride.status);
  const totalAmount = ride.amount || 0;
  const clientEarned = (totalAmount * (ride.client_percentage || 0)) / 100;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          userInterfaceStyle={isDarkMode ? 'dark' : 'light'}
          initialRegion={{
            ...hotelOrigin,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker coordinate={hotelOrigin} title="Polazište">
            <View style={[styles.locationMarker, { backgroundColor: '#34C759' }]}>
               <LocateFixed size={16} color="#FFF" />
            </View>
          </Marker>

          <Marker coordinate={destination} title="Odredište">
            <View style={[styles.locationMarker, { backgroundColor: theme.accent }]}>
               <MapPin size={16} color="#FFF" />
            </View>
          </Marker>

          <MapViewDirections
            origin={routeOrigin}
            destination={destination}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor={theme.accent}
            optimizeWaypoints={true}
            onReady={(result) => {
              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
              });
            }}
          />

          {driver && driver.last_lat && driver.last_lng && ['accepted', 'arriving', 'arrived', 'in_progress'].includes(ride.status) && (
            <Marker coordinate={{ latitude: driver.last_lat, longitude: driver.last_lng }} title="Vozač">
                <View style={[styles.driverMarker, { backgroundColor: '#5856D6' }]}>
                    <CarIcon size={18} color="#FFF" />
                </View>
            </Marker>
          )}
        </MapView>

        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: theme.card }]} 
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft color={theme.text} size={28} />
        </TouchableOpacity>
      </View>

      <View style={[styles.detailsSheet, { backgroundColor: theme.card }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: currentStatus.color + '15' }]}>
               <StatusIcon size={14} color={currentStatus.color} style={{ marginRight: 6 }} />
               <Text style={[styles.statusText, { color: currentStatus.color }]}>
                 {currentStatus.label.toUpperCase()}
               </Text>
            </View>
            {currentStatus.showLoader && <ActivityIndicator size="small" color={currentStatus.color} style={{ marginLeft: 10 }} />}
            <View style={styles.flex} />
            <Text style={[styles.timeText, { color: theme.textSecondary }]}>
              {new Date(ride.scheduled_at).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          {ride.status === 'completed' && (
            <View style={[styles.amountFocusCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.amountHalf}>
                <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>UKUPNA CIJENA</Text>
                <Text style={[styles.amountValue, { color: theme.text }]}>{totalAmount.toFixed(2)} €</Text>
              </View>
              <View style={[styles.amountDivider, { backgroundColor: theme.border }]} />
              <View style={styles.amountHalf}>
                <View style={styles.row}>
                  <TrendingUp size={12} color={theme.accent} style={{marginRight: 4}} />
                  <Text style={[styles.amountLabel, { color: theme.accent }]}>VAŠA ZARADA ({ride.client_percentage}%)</Text>
                </View>
                <Text style={[styles.earnedValue, { color: theme.accent }]}>{clientEarned.toFixed(2)} €</Text>
              </View>
            </View>
          )}

          <View style={styles.addressBox}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>RUTA PUTOVANJA</Text>
            
            <View style={styles.locationItem}>
              <View style={[styles.iconCircle, { backgroundColor: '#34C75915' }]}>
                <LocateFixed size={18} color="#34C759" />
              </View>
              <Text style={[styles.addressText, { color: theme.text, fontSize: 14 }]} numberOfLines={1}>
                {ride.pickup_address}
              </Text>
            </View>

            <View style={[styles.addressConnector, { backgroundColor: theme.border }]} />

            <View style={styles.locationItem}>
              <View style={[styles.iconCircle, { backgroundColor: theme.accent + '15' }]}>
                <MapPin size={18} color={theme.accent} />
              </View>
              <Text style={[styles.addressText, { color: theme.text }]} numberOfLines={2}>
                {ride.destination_address}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* DRIVER & VEHICLE SECTION */}
          {driver ? (
            <View style={styles.driverSection}>
              <View style={[styles.driverAvatar, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]}>
                <CarIcon size={28} color={theme.accent} />
              </View>
              <View style={styles.driverInfo}>
                <Text style={[styles.driverName, { color: theme.text }]}>{driver.full_name}</Text>
                {ride.vehicle ? (
                  <View style={styles.vehicleInfoRow}>
                    <Text style={[styles.carInfo, { color: theme.accent, fontWeight: '700' }]}>
                      {ride.vehicle.plate}
                    </Text>
                    <Text style={[styles.carInfo, { color: theme.textSecondary }]}>
                      {' • '}{ride.vehicle.make} {ride.vehicle.model} {ride.vehicle.variant || ''}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.carInfo, { color: theme.textSecondary }]}>Podaci o vozilu nisu dostupni</Text>
                )}
              </View>
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: '#34C759' }]}
                onPress={() => handleCall(driver.phone)}
              >
                <Phone size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            !['cancelled', 'ignored', 'completed'].includes(ride.status) && (
              <View style={styles.noDriverBox}>
                <Info size={18} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, marginLeft: 10, fontWeight: '600' }}>
                  Vozač će biti dodijeljen uskoro
                </Text>
              </View>
            )
          )}

          <View style={[styles.detailsGrid, { borderTopColor: theme.border }]}>
            <View style={styles.gridItem}>
              <View style={styles.gridIconCircle}>
                <Users size={18} color={theme.textSecondary} />
              </View>
              <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>Putnici</Text>
              <Text style={[styles.gridValue, { color: theme.text }]}>{ride.passengers}</Text>
            </View>
            
            <View style={styles.gridItem}>
              <View style={styles.gridIconCircle}>
                {ride.payment_method === 'cash' ? <Banknote size={18} color={theme.textSecondary} /> : <CreditCard size={18} color={theme.textSecondary} />}
              </View>
              <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>Plaćanje</Text>
              <Text style={[styles.gridValue, { color: theme.text }]}>
                {ride.payment_method === 'cash' ? 'Gotovina' : 'Kartica'}
              </Text>
            </View>

            <View style={styles.gridItem}>
              <View style={styles.gridIconCircle}>
                <Clock size={18} color={theme.textSecondary} />
              </View>
              <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>ETA</Text>
              <Text style={[styles.gridValue, { color: theme.text }]}>
                {hideETA ? '--' : (ride.eta_minutes ? `${ride.eta_minutes} min` : '--')}
              </Text>
            </View>
          </View>

          {ride.notes && (
            <View style={[styles.noteContainer, { backgroundColor: theme.background }]}>
              <View style={{ marginTop: 2 }}>
                <Info size={16} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.noteLabel, { color: theme.textSecondary }]}>NAPOMENA</Text>
                <Text style={[styles.noteText, { color: theme.text }]}>{ride.notes}</Text>
              </View>
            </View>
          )}

          {['pending', 'accepted', 'arriving', 'arrived', 'scheduled'].includes(ride.status) && (
            <TouchableOpacity 
              style={[styles.cancelBtn, { borderColor: theme.border }]}
              onPress={handleCancelRide}
            >
              <XCircle size={20} color="#FF3B30" />
              <Text style={styles.cancelBtnText}>Otkaži narudžbu</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapContainer: { height: Dimensions.get('window').height * 0.40 },
  map: { ...StyleSheet.absoluteFillObject },
  backBtn: { position: 'absolute', top: 50, left: 20, width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  driverMarker: { padding: 8, borderRadius: 20, borderWidth: 3, borderColor: '#FFF', elevation: 5 },
  locationMarker: { padding: 6, borderRadius: 12, borderWidth: 2, borderColor: '#FFF', elevation: 4 },
  detailsSheet: { flex: 1, borderTopLeftRadius: 35, borderTopRightRadius: 35, marginTop: -35, paddingHorizontal: 25, paddingTop: 25, elevation: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  flex: { flex: 1 },
  timeText: { fontSize: 16, fontWeight: '800' },
  amountFocusCard: { flexDirection: 'row', padding: 20, borderRadius: 24, marginBottom: 25, borderWidth: 1, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  amountHalf: { flex: 1 },
  amountDivider: { width: 1, height: 35, marginHorizontal: 15, opacity: 0.5 },
  amountLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, marginBottom: 4, textTransform: 'uppercase' },
  amountValue: { fontSize: 20, fontWeight: '900' },
  earnedValue: { fontSize: 20, fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center' },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 15 },
  addressBox: { marginBottom: 20, paddingLeft: 5 },
  addressConnector: { width: 2, height: 20, marginLeft: 19, marginVertical: 4, opacity: 0.3 },
  locationItem: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconCircle: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  addressText: { fontSize: 17, fontWeight: '700', flex: 1, lineHeight: 22 },
  divider: { height: 1, marginBottom: 25, opacity: 0.5 },
  driverSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  driverAvatar: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  driverInfo: { flex: 1, marginLeft: 15 },
  driverName: { fontSize: 18, fontWeight: '800' },
  vehicleInfoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  carInfo: { fontSize: 13, fontWeight: '600', opacity: 0.8 },
  noDriverBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)', padding: 15, borderRadius: 15, marginBottom: 25 },
  actionBtn: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  detailsGrid: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 25, gap: 10, marginBottom: 20 },
  gridItem: { flex: 1, alignItems: 'center' },
  gridIconCircle: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.03)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  gridLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
  gridValue: { fontSize: 14, fontWeight: '800' },
  noteContainer: { flexDirection: 'row', gap: 12, padding: 15, borderRadius: 18, marginTop: 5, alignItems: 'flex-start' },
  noteLabel: { fontSize: 9, fontWeight: '900', marginBottom: 3, letterSpacing: 0.5 },
  noteText: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, padding: 16, borderRadius: 18, borderWidth: 1.5 },
  cancelBtnText: { color: '#FF3B30', fontWeight: '800', fontSize: 15 }
});