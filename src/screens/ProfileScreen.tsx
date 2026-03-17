import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Building2, Mail, Phone, LogOut, MapPin, ShieldCheck, Info, User, Percent } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  
  const [data, setData] = useState({
    operator: {
      fullName: '',
      phone: '',
      email: '',
    },
    client: {
      name: '',
      address: '',
      phone: '',
      email: '',
      percentage: '',
      avatarUrl: null as string | null,
    }
  });

  useEffect(() => {
    fetchCompleteProfile();
  }, []);

  async function fetchCompleteProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select(`
            full_name,
            phone,
            clients (
              name,
              address,
              phone,
              email,
              percentage,
              avatar_path
            )
          `)
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (profileData) {
          const clientRaw = profileData.clients;
          const client = Array.isArray(clientRaw) ? clientRaw[0] : clientRaw;

          let finalAvatarUrl = null;
          
          if (client?.avatar_path) {
            const { data: storageData } = supabase.storage
              .from('avatars')
              .getPublicUrl(client.avatar_path);
            
            finalAvatarUrl = storageData.publicUrl;
          }

          setData({
            operator: {
              fullName: profileData.full_name || 'Nije postavljeno',
              phone: profileData.phone || 'Nema telefonskog broja',
              email: user.email || '',
            },
            client: {
              name: client?.name || 'Objekt nije dodijeljen',
              address: client?.address || 'Adresa nije postavljena',
              phone: client?.phone || 'Nema telefonskog broja',
              email: client?.email || 'Nema email adrese',
              percentage: client?.percentage || 'Nema dogovorene provizije',
              avatarUrl: finalAvatarUrl,
            }
          });
        }
      }
    } catch (error) {
      console.error('Greška pri dohvaćanju profila:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    Alert.alert("Odjava", "Jeste li sigurni?", [
      { text: "Odustani", style: "cancel" },
      { 
        text: "Odjavi se", 
        style: "destructive", 
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    ]);
  }

  const InfoCard = ({ icon: Icon, label, value }: any) => (
    <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.infoIconCircle, { backgroundColor: theme.background }]}>
        <Icon size={16} color={theme.accent} />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={28} color={theme.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.text }]}>Moj Profil</Text>
        
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.card, borderColor: theme.accent }]}>
            {data.client.avatarUrl ? (
              <Image source={{ uri: data.client.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Building2 size={40} color={theme.accent} />
            )}
          </View>
          <Text style={[styles.companyNameHeader, { color: theme.text }]}>{data.client.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.accent + '15' }]}>
            <ShieldCheck size={12} color={theme.accent} style={{marginRight: 4}} />
            <Text style={[styles.roleText, { color: theme.accent }]}>PARTNER</Text>
          </View>
        </View>

        <View style={styles.content}>
          
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PODACI O OPERATERU</Text>
          <View style={styles.group}>
            <InfoCard icon={User} label="Ime i prezime" value={data.operator.fullName} />
            <InfoCard icon={Phone} label="Kontakt telefon" value={data.operator.phone} />
            <InfoCard icon={Mail} label="Kontakt email" value={data.operator.email} />
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 25 }]}>PODACI O OBJEKTU</Text>
          <View style={styles.group}>
            <InfoCard icon={Building2} label="Naziv" value={data.client.name} />
            <InfoCard icon={MapPin} label="Adresa" value={data.client.address} />
            <InfoCard icon={Phone} label="Kontakt telefon" value={data.client.phone} />
            <InfoCard icon={Mail} label="Email adresa" value={data.client.email} />
            <InfoCard 
              icon={Percent} 
              label="Dogovorena provizija" 
              value={typeof data.client.percentage === 'number' || !isNaN(Number(data.client.percentage)) 
                ? `${data.client.percentage}%` 
                : data.client.percentage} 
            />
          </View>

          <View style={[styles.noteContainer, { backgroundColor: theme.card }]}>
            <Info size={16} color={theme.textSecondary} />
            <Text style={[styles.noteText, { color: theme.textSecondary }]}>
              Za izmjenu podataka o objektu ili operateru, kontaktirajte korisničku podršku.
            </Text>
          </View>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <LogOut size={20} color="#FF3B30" />
            <Text style={[styles.signOutText, { color: "#FF3B30" }]}>Odjavi se iz sustava</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  avatarCircle: { width: 110, height: 110, borderRadius: 35, justifyContent: 'center', alignItems: 'center', borderWidth: 2, marginBottom: 15, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
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
  signOutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30, gap: 10, padding: 10 },
  signOutText: { fontSize: 15, fontWeight: '700' },
});