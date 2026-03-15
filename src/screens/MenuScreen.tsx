import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Moon, Clock, ShieldCheck, HelpCircle, LogOut, ChevronRight, Globe, Info, Sun, Smartphone, Check } from 'lucide-react-native';

import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { APP_BUILD, APP_NAME, APP_VERSION } from '../constants/Info';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDarkMode, theme, themeMode, setThemeMode } = useTheme();

  const [userData, setUserData] = useState({
    name: 'Učitavanje...',
    email: '',
    avatarUrl: null as string | null,
  });
  const [loading, setLoading] = useState(true);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  useEffect(() => {
    fetchUserData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserData();
    });
    return unsubscribe;
  }, [navigation]);

  async function fetchUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: client, error } = await supabase
          .from('clients')
          .select('name, avatar_path')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        let finalAvatarUrl = null;
        if (client?.avatar_path) {
          const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(client.avatar_path);
          
          finalAvatarUrl = data.publicUrl;
        }

        setUserData({
          name: client?.name || 'Korisnik',
          email: user.email || '',
          avatarUrl: finalAvatarUrl,
        });
      }
    } catch (error) {
      console.error('Greška pri dohvaćanju podataka:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleThemeSelector = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowThemeSelector(!showThemeSelector);
  };

  async function handleSignOut() {
    Alert.alert("Odjava", "Jeste li sigurni da se želite odjaviti?", [
      { text: "Odustani", style: "cancel" },
      { 
        text: "Odjavi me", 
        style: "destructive", 
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (!error) {
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        }
      }
    ]);
  }

  const getThemeLabel = () => {
    switch(themeMode) {
      case 'light': return 'Svijetlo';
      case 'dark': return 'Tamno';
      case 'system': return 'Sustav';
      default: return '';
    }
  };

  const renderSettingItem = (
    icon: any, 
    title: string, 
    subtitle: string | null = null, 
    onPress: (() => void) | null = null,
    rightElement: React.ReactNode = null
  ) => (
    <TouchableOpacity 
      style={[styles.item, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
      onPress={onPress ? onPress : undefined}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconWrapper, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5' }]}>
          {React.createElement(icon, { size: 20, color: theme.accent })}
        </View>
        <View>
          <Text style={[styles.itemTitle, { color: theme.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement ? rightElement : <ChevronRight size={18} color={theme.border} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Izbornik</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>MOJ PROFIL</Text>
          <TouchableOpacity 
            style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            <View style={styles.profileInfo}>
              <View style={[styles.avatar, { backgroundColor: theme.accent }]}>
                {userData.avatarUrl ? (
                  <Image source={{ uri: userData.avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <User size={30} color="#FFF" />
                )}
              </View>
              <View>
                {loading ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : (
                  <>
                    <Text style={[styles.profileName, { color: theme.text }]}>{userData.name}</Text>
                    <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{userData.email}</Text>
                  </>
                )}
              </View>
            </View>
            <ChevronRight size={20} color={theme.border} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>AKTIVNOSTI</Text>
          <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {renderSettingItem(Clock, "Povijest narudžbi", "Pregled svih prošlih narudžbi", () => navigation.navigate('Rides'))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>APLIKACIJA</Text>
          <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
            
            {renderSettingItem(
              Moon, 
              "Izgled", 
              getThemeLabel(), 
              toggleThemeSelector,
              <ChevronRight 
                size={18} 
                color={theme.border} 
                style={{ transform: [{ rotate: showThemeSelector ? '90deg' : '0deg' }] }} 
              />
            )}
            
            {showThemeSelector && (
              <View style={[styles.selectorContainer, { borderTopWidth: 0.5, borderTopColor: theme.border }]}>
                {[
                  { id: 'light', label: 'Svijetli način', icon: Sun },
                  { id: 'dark', label: 'Tamni način', icon: Moon },
                  { id: 'system', label: 'Sustav', icon: Smartphone },
                ].map((mode) => (
                  <TouchableOpacity 
                    key={mode.id}
                    style={styles.selectorOption}
                    onPress={() => setThemeMode(mode.id as any)}
                  >
                    <View style={styles.optionLeft}>
                      <mode.icon size={18} color={themeMode === mode.id ? theme.accent : theme.textSecondary} />
                      <Text style={[styles.optionText, { color: themeMode === mode.id ? theme.text : theme.textSecondary }]}>{mode.label}</Text>
                    </View>
                    {themeMode === mode.id && <Check size={18} color={theme.accent} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {renderSettingItem(Globe, "Jezik", "Hrvatski", () => Alert.alert("Jezik", "Trenutno je podržan samo Hrvatski jezik."))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>PODRŠKA</Text>
          <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {renderSettingItem(HelpCircle, "Pomoć i podrška", "Kontaktiraj nas", () => navigation.navigate('Support'))}
            {renderSettingItem(ShieldCheck, "Pravila privatnosti", "Kako štitimo vaše podatke", () => navigation.navigate('Soon'))}
            {renderSettingItem(Info, "O aplikaciji", "Verzija i informacije", () => navigation.navigate('About'))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity 
              style={[styles.item, { borderBottomWidth: 0 }]}
              onPress={handleSignOut}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.iconWrapper, { backgroundColor: '#FF3B3015' }]}>
                  <LogOut size={20} color="#FF3B30" />
                </View>
                <Text style={[styles.itemTitle, { color: "#FF3B30", fontWeight: '700' }]}>Odjava</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.versionText, { color: theme.textSecondary }]}>{APP_NAME} v{APP_VERSION} • Build {APP_BUILD}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 25, paddingVertical: 20 },
  headerTitle: { fontSize: 28, fontWeight: '900' },
  scrollContent: { paddingBottom: 120 },
  section: { marginTop: 20 },
  sectionHeader: { fontSize: 11, fontWeight: '800', marginLeft: 25, marginBottom: 8, letterSpacing: 1 },
  group: { borderTopWidth: 0.5, borderBottomWidth: 0.5 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 25, borderBottomWidth: 0.5 },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  itemSubtitle: { fontSize: 12, marginTop: 1 },
  profileCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 25, borderTopWidth: 0.5, borderBottomWidth: 0.5 },
  profileInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  profileName: { fontSize: 17, fontWeight: '800' },
  profileEmail: { fontSize: 13, marginTop: 1 },
  selectorContainer: { paddingVertical: 5 },
  selectorOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 25, paddingLeft: 76 },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  optionText: { fontSize: 15, fontWeight: '600', marginLeft: 12 },
  versionText: { textAlign: 'center', marginTop: 30, fontSize: 11, marginBottom: 20, opacity: 0.5 }
});