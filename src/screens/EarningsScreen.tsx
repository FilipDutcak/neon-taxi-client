import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { ChevronLeft, TrendingUp, Calendar, Wallet, Landmark, ArrowUpRight, PieChart } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface Stats {
  totalRevenue: number;
  totalCommission: number;
  rideCount: number;
}

export default function EarningsScreen({ navigation }: any) {
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState<Stats>({ totalRevenue: 0, totalCommission: 0, rideCount: 0 });
  const [monthlyStats, setMonthlyStats] = useState<Stats>({ totalRevenue: 0, totalCommission: 0, rideCount: 0 });

  useEffect(() => {
    fetchEarnings();
  }, []);

  async function fetchEarnings() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Dohvaćamo klijentov ID i njegov postotak provizije
      const { data: client } = await supabase
        .from('clients')
        .select('id, percentage')
        .eq('user_id', user.id)
        .single();

      if (!client) return;

      const now = new Date();
      
      // Početak tjedna (Ponedjeljak)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
      startOfWeek.setHours(0, 0, 0, 0);

      // Početak mjeseca
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Dohvati sve završene vožnje
      const { data: rides, error } = await supabase
        .from('rides')
        .select('amount, created_at')
        .eq('client_id', client.id)
        .eq('status', 'completed');

      if (error) throw error;

      const statsW: Stats = { totalRevenue: 0, totalCommission: 0, rideCount: 0 };
      const statsM: Stats = { totalRevenue: 0, totalCommission: 0, rideCount: 0 };

      rides?.forEach(ride => {
        const rideDate = new Date(ride.created_at);
        const amount = ride.amount || 0;
        const commission = (amount * client.percentage) / 100;

        if (rideDate >= startOfWeek) {
          statsW.totalRevenue += amount;
          statsW.totalCommission += commission;
          statsW.rideCount++;
        }

        if (rideDate >= startOfMonth) {
          statsM.totalRevenue += amount;
          statsM.totalCommission += commission;
          statsM.rideCount++;
        }
      });

      setWeeklyStats(statsW);
      setMonthlyStats(statsM);

    } catch (error) {
      console.error('Greška pri dohvaćanju zarade:', error);
    } finally {
      setLoading(false);
    }
  }

  const StatCard = ({ title, stats, icon: Icon, color }: { title: string, stats: Stats, icon: any, color: string }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
          <Icon size={20} color={color} />
        </View>
        <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>{title}</Text>
      </View>

      <View style={styles.mainAmountRow}>
        <Text style={[styles.mainAmount, { color: theme.text }]}>{stats.totalCommission.toFixed(2)} €</Text>
        <View style={[styles.badge, { backgroundColor: '#34C75915' }]}>
          <TrendingUp size={12} color="#34C759" />
          <Text style={styles.badgeText}>Provizija</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.footerRow}>
        <View>
          <Text style={[styles.footerLabel, { color: theme.textSecondary }]}>UKUPAN PROMET</Text>
          <Text style={[styles.footerValue, { color: theme.text }]}>{stats.totalRevenue.toFixed(2)} €</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.footerLabel, { color: theme.textSecondary }]}>VOŽNJI</Text>
          <Text style={[styles.footerValue, { color: theme.text }]}>{stats.rideCount}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => navigation.goBack()}>
          <ChevronLeft color={theme.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Moja Zarada</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Total Wallet Summary */}
        <View style={[styles.summaryBox, { backgroundColor: theme.accent }]}>
          <View>
            <Text style={styles.summaryLabel}>UKUPNO ZA ISPLATU</Text>
            <Text style={styles.summaryValue}>{(monthlyStats.totalCommission).toFixed(2)} €</Text>
          </View>
          <View style={styles.summaryIcon}>
            <Wallet color="#FFF" size={32} opacity={0.3} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Pregled perioda</Text>
        
        <StatCard 
          title="Ovaj tjedan" 
          stats={weeklyStats} 
          icon={Calendar} 
          color="#007AFF" 
        />
        
        <StatCard 
          title="Ovaj mjesec" 
          stats={monthlyStats} 
          icon={Landmark} 
          color="#AF52DE" 
        />

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <PieChart size={20} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Provizija se obračunava automatski nakon svake završene vožnje koju ste naručili.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  summaryBox: {
    padding: 25,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  summaryValue: { color: '#FFF', fontSize: 32, fontWeight: '900', marginTop: 5 },
  summaryIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20 },
  card: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  mainAmountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  mainAmount: { fontSize: 26, fontWeight: '900' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#34C759' },
  divider: { height: 1, marginBottom: 15, opacity: 0.5 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  footerValue: { fontSize: 15, fontWeight: '700' },
  infoBox: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 15,
    marginTop: 10
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' }
});