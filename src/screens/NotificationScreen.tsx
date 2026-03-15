import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar,
  RefreshControl,
  Modal,
  ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, BellOff, X, Calendar, Info } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

export default function NotificationScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  
  // State za detalje obavijesti
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (client) {
        // Dohvat obavijesti
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .or(`role.eq.client,client_id.eq.${client.id}`)
          .order('created_at', { ascending: false });

        // Dohvat pročitanih ID-eva
        const { data: reads } = await supabase
          .from('notification_reads')
          .select('notification_id')
          .eq('user_id', user.id);

        if (notifs) setNotifications(notifs);
        if (reads) setReadIds(reads.map(r => r.notification_id));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleOpenNotification(notif: any) {
    setSelectedNotif(notif);
    
    // Ako već nije pročitana, označi je u bazi
    if (!readIds.includes(notif.id)) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notification_reads')
        .upsert({ 
          notification_id: notif.id, 
          user_id: user.id 
        }, { onConflict: 'notification_id, user_id' });

      if (!error) {
        setReadIds(prev => [...prev, notif.id]);
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hr-HR', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const isRead = readIds.includes(item.id);
    return (
      <TouchableOpacity 
        style={[
          styles.card, 
          { backgroundColor: theme.card, borderColor: isRead ? theme.border : theme.accent + '40' }
        ]}
        onPress={() => handleOpenNotification(item)}
      >
        <View style={[styles.iconBox, { backgroundColor: isRead ? theme.border + '50' : theme.accent + '15' }]}>
          <Bell size={20} color={isRead ? theme.textSecondary : theme.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.row}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
            {!isRead && <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />}
          </View>
          <Text style={[styles.msgPreview, { color: theme.textSecondary }]} numberOfLines={2}>{item.message}</Text>
          <Text style={[styles.date, { color: theme.divider }]}>{formatDate(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Obavijesti</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchNotifications} tintColor={theme.accent} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <BellOff size={50} color={theme.border} />
              <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Nema obavijesti.</Text>
            </View>
          ) : null
        }
      />

      {/* MODAL ZA DETALJE */}
      <Modal
        visible={!!selectedNotif}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNotif(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.iconBox, { backgroundColor: theme.accent + '15' }]}>
                <Info size={24} color={theme.accent} />
              </View>
              <TouchableOpacity onPress={() => setSelectedNotif(null)} style={styles.closeBtn}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedNotif?.title}</Text>
              <View style={styles.modalDateRow}>
                <Calendar size={14} color={theme.divider} />
                <Text style={[styles.modalDate, { color: theme.divider }]}>
                  {selectedNotif && formatDate(selectedNotif.created_at)}
                </Text>
              </View>
              <Text style={[styles.modalBody, { color: theme.textSecondary }]}>
                {selectedNotif?.message}
              </Text>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.confirmBtn, { backgroundColor: theme.accent }]}
              onPress={() => setSelectedNotif(null)}
            >
              <Text style={styles.confirmBtnText}>Zatvori</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 25, paddingBottom: 15 },
  headerTitle: { fontSize: 28, fontWeight: '900' },
  card: { 
    flexDirection: 'row', 
    padding: 15, 
    borderRadius: 18, 
    borderWidth: 1, 
    marginBottom: 12,
    alignItems: 'center'
  },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '800', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 5 },
  msgPreview: { fontSize: 14, marginTop: 2 },
  date: { fontSize: 11, marginTop: 5, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 100 },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxHeight: '80%', borderRadius: 30, padding: 25, elevation: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  closeBtn: { padding: 5 },
  modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
  modalDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15 },
  modalDate: { fontSize: 13, fontWeight: '600' },
  modalBody: { fontSize: 16, lineHeight: 24, fontWeight: '500' },
  confirmBtn: { marginTop: 25, height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});