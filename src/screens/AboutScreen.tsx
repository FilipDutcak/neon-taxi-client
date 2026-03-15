import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Info, FileText, Mail, Code2, ExternalLink, Cpu } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

import { APP_VERSION, APP_BUILD, COMPANY_NAME_FULL, VERSION_TYPE, APP_NAME, SUPPORT_EMAIL } from '../constants/Info';

export default function AboutScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const InfoCard = ({ icon: Icon, label, value, onPress }: any) => (
    <TouchableOpacity 
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <View style={[styles.infoIconCircle, { backgroundColor: theme.background }]}>
        <Icon size={16} color={theme.accent} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
      </View>
      {onPress && <ExternalLink size={14} color={theme.textSecondary} style={{ opacity: 0.5 }} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={28} color={theme.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.text }]}>O aplikaciji</Text>
        
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.card, borderColor: theme.accent }]}>
             <Cpu size={45} color={theme.accent} />
          </View>
          <Text style={[styles.companyNameHeader, { color: theme.text }]}>{APP_NAME}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.accent + '15' }]}>
            <Text style={[styles.roleText, { color: theme.accent }]}>{VERSION_TYPE}</Text>
          </View>
        </View>

        <View style={styles.content}>
          
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>INFORMACIJE O APLIKACIJI</Text>
          <View style={styles.group}>
            <InfoCard icon={Info} label="Verzija aplikacije" value={APP_VERSION} />
            <InfoCard icon={Cpu} label="Build broj" value={APP_BUILD} />
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 25 }]}>PRAVNA DOKUMENTACIJA</Text>
          <View style={styles.group}>
            <InfoCard 
                icon={FileText} 
                label="U izradi" 
                value="Dolazi uskoro"
            />
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 25 }]}>TEHNIČKA PODRŠKA</Text>
          <View style={styles.group}>
            <InfoCard 
                icon={Mail} 
                label="Email za upite" 
                value={SUPPORT_EMAIL} 
                onPress={() => handleOpenLink('mailto:support@detaily.hr')}
            />
          </View>

          <View style={[styles.noteContainer, { backgroundColor: theme.card }]}>
            <Code2 size={16} color={theme.textSecondary} />
            <Text style={[styles.noteText, { color: theme.textSecondary }]}>
              Aplikacija je vlasništvo {COMPANY_NAME_FULL}. Sva prava pridržana. Razvijeno s fokusom na sigurnost i brzinu.
            </Text>
          </View>

          <View style={styles.footerBranding}>
             <Text style={[styles.footerText, { color: theme.textSecondary }]}>© 2026 {COMPANY_NAME_FULL}</Text>
             <Text style={[styles.footerSubText, { color: theme.textSecondary }]}>Made in Croatia, EU</Text>
          </View>
        </View>
      </ScrollView>
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
  scrollContent: { paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginTop: 10, marginBottom: 25 },
  avatarCircle: { 
    width: 110, 
    height: 110, 
    borderRadius: 35, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 2, 
    marginBottom: 15, 
    overflow: 'hidden' 
  },
  companyNameHeader: { fontSize: 24, fontWeight: '900', marginBottom: 6, textAlign: 'center' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  roleText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  content: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '800', marginBottom: 10, marginLeft: 5, letterSpacing: 1 },
  group: { gap: 10 },
  infoCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 1 },
  infoIconCircle: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginBottom: 2, opacity: 0.5 },
  infoValue: { fontSize: 15, fontWeight: '600' },
  noteContainer: { marginTop: 30, padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
  footerBranding: { marginTop: 30, alignItems: 'center', opacity: 0.6 },
  footerText: { fontSize: 13, fontWeight: '700' },
  footerSubText: { fontSize: 11, fontWeight: '600', marginTop: 2 }
});