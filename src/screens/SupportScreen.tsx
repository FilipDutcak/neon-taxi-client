import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Linking, 
  Platform,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  ExternalLink,
  ArrowLeft // Dodana ikona za povratak
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { APP_VERSION, SUPPORT_EMAIL, SUPPORT_PHONE, WORKING_HOURS } from '../constants/Info';

export default function SupportScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();

  const handleCall = () => Linking.openURL(`tel:${SUPPORT_PHONE}`);
  const handleEmail = () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  const handleWhatsApp = () => {
    const msg = "Poštovani, trebam pomoć oko narudžbe...";
    Linking.openURL(`whatsapp://send?phone=${SUPPORT_PHONE}&text=${encodeURIComponent(msg)}`);
  };

  const SupportCard = ({ icon: Icon, title, value, onPress, color }: any) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <Icon size={22} color={color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>{title}</Text>
        <Text style={[styles.cardValue, { color: theme.text }]}>{value}</Text>
      </View>
      <ChevronRight size={18} color={theme.divider} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Gumb za povratak */}
      <TouchableOpacity 
        style={[styles.backButton, { top: insets.top + 10, backgroundColor: theme.card }]} 
        onPress={() => navigation.goBack()}
      >
        <ArrowLeft size={24} color={theme.text} />
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.heroIcon, { backgroundColor: theme.accent }]}>
            <ShieldCheck size={40} color="#FFF" />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Centar za podršku</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Naš tim je dostupan 24/7 za sva vaša pitanja i poteškoće.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Brzi kontakt</Text>
          
          <SupportCard 
            icon={Phone} 
            title="Telefon" 
            value={SUPPORT_PHONE} 
            onPress={handleCall}
            color="#34C759"
          />
          
          <SupportCard 
            icon={MessageCircle} 
            title="WhatsApp" 
            value="Pošalji poruku" 
            onPress={handleWhatsApp}
            color="#25D366"
          />
          
          <SupportCard 
            icon={Mail} 
            title="E-mail" 
            value={SUPPORT_EMAIL} 
            onPress={handleEmail}
            color={theme.accent}
          />
        </View>

        <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1e1e1e' : '#f8f9fa' }]}>
          <Clock size={18} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Radno vrijeme: <Text style={{ fontWeight: '800', color: theme.text }}>{WORKING_HOURS}</Text>
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: theme.divider }]}>Verzija sustava: {APP_VERSION}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Novi stil za back button
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  scrollContent: { paddingHorizontal: 25 },
  header: { alignItems: 'center', marginBottom: 40 },
  heroIcon: { 
    width: 80, 
    height: 80, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5
  },
  title: { fontSize: 26, fontWeight: '900', marginBottom: 10 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, marginLeft: 5 },
  
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1,
  },
  iconBox: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  
  infoBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    marginTop: 30, 
    padding: 15, 
    borderRadius: 15 
  },
  infoText: { fontSize: 14, fontWeight: '600' },
  
  footer: { marginTop: 40, alignItems: 'center', gap: 10 },
  footerLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  versionText: { fontSize: 12, fontWeight: '600' }
});