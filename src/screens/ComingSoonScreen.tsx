import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  Rocket, 
  Clock, 
  Bell, 
  Construction,
  Sparkles
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function ComingSoonScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  
  // Možeš proslijediti naziv funkcije kroz route params
  const featureName = route?.params?.featureName || "Nova značajka";

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>U izradi</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <View style={styles.content}>
        {/* GLAVNA VIZUALNA SEKCIJA */}
        <View style={styles.centerSection}>
          <View style={[styles.iconCircle, { backgroundColor: theme.card, borderColor: theme.accent }]}>
             <Rocket size={50} color={theme.accent} />
             <View style={[styles.smallBadge, { backgroundColor: theme.accent }]}>
                <Sparkles size={12} color="#FFF" />
             </View>
          </View>
          
          <Text style={[styles.title, { color: theme.text }]}>{featureName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: theme.accent + '15' }]}>
            <Clock size={12} color={theme.accent} style={{marginRight: 6}} />
            <Text style={[styles.statusText, { color: theme.accent }]}>USKORO DOSTUPNO</Text>
          </View>
          
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Trenutno marljivo radimo na implementaciji ove funkcionalnosti kako bismo vam pružili još bolje iskustvo korištenja aplikacije.
          </Text>
        </View>

        {/* GUMB ZA POVRATAK */}
        <TouchableOpacity 
          style={[styles.mainBtn, { backgroundColor: theme.accent }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.mainBtnText}>Razumijem, vrati me natrag</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    height: 60 
  },
  headerTitle: { 
    flex: 1, 
    fontSize: 18, 
    fontWeight: '800', 
    textAlign: 'center' 
  },
  backBtn: { 
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  headerRightPlaceholder: { 
    width: 40 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 25, 
    justifyContent: 'center',
    paddingBottom: 40
  },
  centerSection: {
    alignItems: 'center',
    marginBottom: 40
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 25,
    position: 'relative'
  },
  smallBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 30,
    height: 30,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF'
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 20
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.7,
    paddingHorizontal: 10
  },
  group: { gap: 12, marginBottom: 40 },
  infoCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1 
  },
  infoIconCircle: { 
    width: 36, 
    height: 36, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  infoTextContainer: { flex: 1 },
  infoLabel: { 
    fontSize: 9, 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    marginBottom: 2, 
    opacity: 0.5 
  },
  infoValue: { fontSize: 15, fontWeight: '700' },
  mainBtn: {
    height: 55,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  mainBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800'
  }
});