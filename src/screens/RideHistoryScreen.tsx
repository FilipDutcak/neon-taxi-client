import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, MapPin, CreditCard, Banknote, CheckCircle2, XCircle, Timer, Navigation, UserCheck, MapPinned, PlayCircle, AlertCircle, Wallet, Info, Ban, User, Car } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

type FilterType = 'active' | 'scheduled' | 'completed' | 'cancelled';

export default function RideHistoryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [rides, setRides] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>('active');
  const [clientId, setClientId] = useState<string | null>(null);

  const statusMap: Record<string, { label: string, color: string, icon: any }> = {
    pending: { label: 'Traženje vozača', color: '#FF9500', icon: Timer },
    accepted: { label: 'Vozač prihvatio', color: '#5856D6', icon: UserCheck },
    arriving: { label: 'Na putu', color: '#007AFF', icon: Navigation },
    arrived: { label: 'Na lokaciji', color: '#32ADE6', icon: MapPinned },
    in_progress: { label: 'U tijeku', color: '#AF52DE', icon: PlayCircle },
    completed: { label: 'Završena', color: '#34C759', icon: CheckCircle2 },
    cancelled: { label: 'Otkazana', color: '#FF3B30', icon: XCircle },
    ignored: { label: 'Neodgovorena', color: '#8E8E93', icon: AlertCircle },
    scheduled: { label: 'Zakazana', color: theme.accent, icon: Calendar },
  };

  useEffect(() => {
    async function getClient() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (client) setClientId(client.id);
      }
    }
    getClient();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (clientId) {
        fetchHistory();
      }
    }, [clientId, filter])
  );

  useEffect(() => {
    if (!clientId) return;

    const subscription = supabase
      .channel('ride-history-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rides',
        filter: `client_id=eq.${clientId}` 
      }, () => {
        fetchHistory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [clientId, filter]);

  async function fetchHistory() {
    if (!clientId) return;
    try {
      setLoading(true);
      let statusFilter: string[];
      
      if (filter === 'active') {
        statusFilter = ['pending', 'accepted', 'arriving', 'arrived', 'in_progress'];
      } else if (filter === 'scheduled') {
        statusFilter = ['scheduled'];
      } else if (filter === 'completed') {
        statusFilter = ['completed'];
      } else {
        statusFilter = ['cancelled', 'ignored'];
      }

      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:driver_id (
            full_name
          )
        `)
        .eq('client_id', clientId)
        .in('status', statusFilter)
        .order('scheduled_at', { ascending: filter !== 'active' });

      if (!error && data) {
        setRides(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const renderRideItem = ({ item }: { item: any }) => {
    const statusInfo = statusMap[item.status] || { label: item.status, color: '#8E8E93', icon: AlertCircle };
    const StatusIcon = statusInfo.icon;
    
    // Provjera: Putnik nije platio vozaču
    const isUnpaid = item.payment_method === 'unpaid';

    return (
      <TouchableOpacity 
        style={[
          styles.rideCard, 
          { backgroundColor: theme.card, borderColor: isUnpaid ? '#FF3B30' : theme.border }
        ]}
        onPress={() => navigation.navigate('RideDetails', { rideId: item.id })}
      >
        {isUnpaid && (
          <View style={styles.unpaidBadge}>
            <Ban size={12} color="#FFF" />
            <Text style={styles.unpaidBadgeText}>PUTNIK NIJE PLATIO</Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.dateRow}>
            <Calendar size={14} color={theme.textSecondary} />
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
              {formatDate(item.scheduled_at)} u {new Date(item.scheduled_at).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: isUnpaid ? '#FF3B3015' : statusInfo.color + '15' }]}>
            <StatusIcon size={10} color={isUnpaid ? '#FF3B30' : statusInfo.color} style={{ marginRight: 4 }} />
            <Text style={[styles.statusBadgeText, { color: isUnpaid ? '#FF3B30' : statusInfo.color }]}>
              {isUnpaid ? 'SPORNA VOŽNJA' : statusInfo.label.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.addressRow}>
          <MapPin size={16} color={theme.accent} />
          <Text style={[styles.addressText, { color: theme.text }]} numberOfLines={1}>
            {item.destination_address || 'Nema adrese'}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Car size={14} color={theme.textSecondary} />
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              {item.driver?.full_name || 'Nema vozača'}
            </Text>
          </View>
          
          <View style={styles.amountContainer}>
             <Text style={[styles.amountText, { color: isUnpaid ? '#FF3B30' : theme.text }]}>
                {item.amount ? `${item.amount} €` : '-- €'}
             </Text>
             {isUnpaid && <Text style={styles.noCommissionText}>0.00 € provizije</Text>}
          </View>

          <View style={styles.footerItem}>
            {isUnpaid ? (
              <AlertCircle size={14} color="#FF3B30" />
            ) : item.payment_method === 'cash' ? (
              <Banknote size={14} color="#34C759" />
            ) : (
              <CreditCard size={14} color="#007AFF" />
            )}
            <Text style={[styles.footerText, { color: isUnpaid ? '#FF3B30' : theme.textSecondary }]}>
              {isUnpaid ? 'Neplaćeno' : item.payment_method === 'cash' ? 'Gotovina' : 'Kartica'}
            </Text>
          </View>
        </View>
        
        {isUnpaid && (
          <View style={styles.unpaidWarning}>
            <Info size={14} color="#FF3B30" />
            <Text style={styles.unpaidWarningText}>
              Putnik je odbio platiti. Provizija za ovu vožnju nije obračunata.
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Narudžbe</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.earningsBtn, { backgroundColor: theme.accent + '15' }]}
          onPress={() => navigation.navigate('Earnings')}
        >
          <Wallet size={20} color={theme.accent} />
          <Text style={[styles.earningsBtnText, { color: theme.accent }]}>Izvještaj</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => setFilter('active')} style={[styles.tab, filter === 'active' && { borderBottomColor: theme.accent, borderBottomWidth: 3 }]}>
          <Navigation size={16} color={filter === 'active' ? theme.accent : theme.textSecondary} />
          <Text style={[styles.tabText, { color: filter === 'active' ? theme.accent : theme.textSecondary }]}>U tijeku</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('scheduled')} style={[styles.tab, filter === 'scheduled' && { borderBottomColor: theme.accent, borderBottomWidth: 3 }]}>
          <Calendar size={16} color={filter === 'scheduled' ? theme.accent : theme.textSecondary} />
          <Text style={[styles.tabText, { color: filter === 'scheduled' ? theme.accent : theme.textSecondary }]}>Planirane</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('completed')} style={[styles.tab, filter === 'completed' && { borderBottomColor: '#34C759', borderBottomWidth: 3 }]}>
          <CheckCircle2 size={16} color={filter === 'completed' ? '#34C759' : theme.textSecondary} />
          <Text style={[styles.tabText, { color: filter === 'completed' ? '#34C759' : theme.textSecondary }]}>Završene</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('cancelled')} style={[styles.tab, filter === 'cancelled' && { borderBottomColor: '#FF3B30', borderBottomWidth: 3 }]}>
          <XCircle size={16} color={filter === 'cancelled' ? '#FF3B30' : theme.textSecondary} />
          <Text style={[styles.tabText, { color: filter === 'cancelled' ? '#FF3B30' : theme.textSecondary }]}>Otkazane</Text>
        </TouchableOpacity>
      </View>

      {loading && rides.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          renderItem={renderRideItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Nema zapisa.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: '900' },
  headerTextContainer: { flex: 1 },
  earningsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  earningsBtnText: { fontWeight: '800', fontSize: 13 },
  tabContainer: { flexDirection: 'row', marginBottom: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 4 },
  tabText: { fontWeight: '700', fontSize: 11 },
  list: { padding: 20 },
  rideCard: { padding: 18, borderRadius: 22, borderWidth: 1, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, position: 'relative', overflow: 'hidden' },
  unpaidBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#FF3B30', paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 10 },
  unpaidBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  unpaidWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,59,48,0.1)' },
  unpaidWarningText: { color: '#FF3B30', fontSize: 11, fontWeight: '600', flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  amountContainer: { alignItems: 'center' },
  amountText: { fontSize: 16, fontWeight: '800' },
  noCommissionText: { fontSize: 9, color: '#FF3B30', fontWeight: '700', marginTop: -2 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  addressText: { fontSize: 15, fontWeight: '700', flex: 1 },
  divider: { height: 1, marginBottom: 12, opacity: 0.5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerText: { fontSize: 12, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { marginTop: 60, alignItems: 'center' },
});