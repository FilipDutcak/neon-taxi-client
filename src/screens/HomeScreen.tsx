import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  StatusBar, 
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, Car, Bell, MapPin, ChevronRight, Navigation, Timer, UserCheck, PlayCircle, MapPinned } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

import OrderModal from '../components/OrderModal';

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeRides, setActiveRides] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const [clientInfo, setClientInfo] = useState({ name: '', id: '', address: '' });

  // Statusi usklađeni s bazom podataka (lowercase)
  const statusMap: Record<string, { label: string, color: string, icon: any, bg: string }> = {
    pending: { label: 'Traženje vozača', color: '#FF9500', icon: Timer, bg: '#FFF9F0' },
    accepted: { label: 'Vozač prihvatio', color: '#5856D6', icon: UserCheck, bg: '#F5F5FF' },
    arriving: { label: 'Na putu', color: '#007AFF', icon: Navigation, bg: '#F0F7FF' },
    arrived: { label: 'Na lokaciji', color: '#32ADE6', icon: MapPinned, bg: '#F0FBFF' },
    in_progress: { label: 'U tijeku', color: '#AF52DE', icon: PlayCircle, bg: '#FAF5FF' },
    scheduled: { label: 'Zakazana', color: '#FF2D55', icon: Plus, bg: '#FFF0F3' },
  };

  useFocusEffect(
    useCallback(() => {
      if (clientInfo.id) {
        fetchUnreadCount();
        fetchActiveRides();
      }
    }, [clientInfo.id])
  );

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!clientInfo.id) return;

    const ridesSubscription = supabase
      .channel('client-home-rides')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rides',
        filter: `client_id=eq.${clientInfo.id}`
      }, () => {
        fetchActiveRides();
      })
      .subscribe();

    return () => { supabase.removeChannel(ridesSubscription); };
  }, [clientInfo.id]);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: client } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (client) {
          setClientInfo({ id: client.id, name: client.name, address: client.address });
          fetchActiveRides(client.id);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchActiveRides(clientId = clientInfo.id) {
    if (!clientId) return;
    try {
      const { data } = await supabase
        .from('rides')
        .select(`
          *,
          driver:driver_id (
            full_name
          )
        `)
        .eq('client_id', clientId)
        .in('status', ['pending', 'accepted', 'arriving', 'arrived', 'in_progress', 'scheduled'])
        .order('created_at', { ascending: false });

      setActiveRides(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchUnreadCount(clientId = clientInfo.id) {
    if (!clientId) return;
    // Ovdje možete dodati query za broj nepročitanih notifikacija
  }

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.background,
        // Popravak: Koristimo insets.top za oba sustava, uz minimalni fallback
        paddingTop: insets.top > 0 ? insets.top : (Platform.OS === 'android' ? 25 : 0)
      }
    ]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent" 
        translucent 
      />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>Dobrodošli,</Text>
            <Text style={[styles.name, { color: theme.text }]}>{clientInfo.name || 'Učitavanje...'}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.notifBtn, { backgroundColor: isDarkMode ? '#222' : '#F0F0F0' }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Bell size={22} color={theme.text} />
            {unreadCount > 0 && <View style={[styles.badge, { backgroundColor: theme.accent }]} />}
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
          <TouchableOpacity 
            style={[styles.mainActionCard, { backgroundColor: theme.accent }]}
            onPress={() => setIsModalVisible(true)}
          >
            <View style={styles.mainActionTextContainer}>
              <Text style={styles.mainActionTitle}>Trebate prijevoz?</Text>
              <Text style={styles.mainActionSub}>Naručite vozilo odmah ili zakažite termin</Text>
            </View>
            <View style={styles.mainActionIcon}>
              <Plus size={32} color={theme.accent} />
            </View>
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Aktivne narudžbe</Text>
            {activeRides.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: theme.accent }]}>
                <Text style={styles.countText}>{activeRides.length}</Text>
              </View>
            )}
          </View>

          {activeRides.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F9F9F9' }]}>
              <Car size={40} color={isDarkMode ? '#333' : '#DDD'} />
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>Trenutno nema aktivnih narudžbi</Text>
            </View>
          ) : (
            activeRides.map((ride) => {
              const status = statusMap[ride.status] || { label: ride.status, color: '#888', icon: Car, bg: '#F5F5F5' };
              const StatusIcon = status.icon;

              return (
                <TouchableOpacity 
                  key={ride.id}
                  style={[styles.rideCard, { backgroundColor: isDarkMode ? '#1A1A1A' : '#FFF', borderColor: isDarkMode ? '#333' : '#EEE' }]}
                  onPress={() => navigation.navigate('RideDetails', { rideId: ride.id })}
                >
                  <View style={styles.rideCardTop}>
                    <View style={[styles.statusBadge, { backgroundColor: isDarkMode ? '#222' : status.bg }]}>
                      <StatusIcon size={12} color={status.color} style={{ marginRight: 6 }} />
                      <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                    <Text style={[styles.rideTime, { color: theme.textSecondary }]}>
                      {new Date(ride.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>

                  <View style={styles.locationContainer}>
                    <View style={styles.locationTexts}>
                      <View style={styles.locRow}>
                        <View style={[styles.dot, { backgroundColor: theme.accent }]} />
                        <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>
                           {ride.pickup_address || 'Moja lokacija'}
                        </Text>
                      </View>
                      <View style={[styles.line, { backgroundColor: isDarkMode ? '#333' : '#EEE' }]} />
                      <View style={styles.locRow}>
                        <MapPin size={14} color="#FF3B30" />
                        <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>
                          {ride.destination_address || 'Nema odredišta'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {ride.driver && (
                    <View style={[styles.driverMinicard, { borderTopColor: isDarkMode ? '#222' : '#EEE', borderTopWidth: 1 }]}>
                      <Text style={[styles.driverInfo, { color: theme.textSecondary }]}>
                        Vozač: <Text style={{ color: theme.text, fontWeight: '700' }}>{ride.driver.full_name}</Text>
                      </Text>
                      <ChevronRight size={16} color={theme.textSecondary} style={{ marginLeft: 'auto' }} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <OrderModal 
          onClose={() => setIsModalVisible(false)} 
          clientInfo={clientInfo} 
          onSuccess={(newRideId?: string) => { 
            setIsModalVisible(false); 
            fetchActiveRides();
            if (newRideId) navigation.navigate('RideDetails', { rideId: newRideId });
          }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 10, 
    marginBottom: 25 
  },
  greeting: { fontSize: 13, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  notifBtn: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: '#FFF' },
  mainActionCard: { 
    flexDirection: 'row', 
    padding: 22, 
    borderRadius: 28, 
    alignItems: 'center', 
    marginBottom: 30, 
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 12 
  },
  mainActionTextContainer: { flex: 1 },
  mainActionTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  mainActionSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  mainActionIcon: { 
    width: 54, 
    height: 54, 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  countText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  rideCard: { 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16, 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.08, 
    shadowRadius: 10,
    borderWidth: 1
  },
  rideCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  rideTime: { fontSize: 12, fontWeight: '700' },
  locationContainer: { marginBottom: 16 },
  locationTexts: { gap: 4 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: '#FFF', elevation: 2 },
  line: { width: 2, height: 15, marginLeft: 6, borderRadius: 1 },
  locationText: { fontSize: 15, fontWeight: '700', flex: 1 },
  driverMinicard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: 15, 
    marginTop: 5
  },
  driverInfo: { fontSize: 13, fontWeight: '600' },
  emptyState: { 
    padding: 40, 
    borderRadius: 30, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderStyle: 'dashed', 
    borderWidth: 2, 
    borderColor: '#EEE' 
  },
  emptyStateText: { marginTop: 15, fontSize: 14, fontWeight: '600' }
});