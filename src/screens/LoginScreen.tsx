import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, 
  Keyboard, Alert, ActivityIndicator, Linking, Image 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock, UserPlus } from 'lucide-react-native';

import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { APP_NAME, APP_VERSION } from '../constants/Info';

export default function LoginScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Greška', 'Molimo unesite email i lozinku.');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (authError) {
        Alert.alert('Greška pri prijavi', 'Neispravni podaci za prijavu.');
        setLoading(false);
        return;
      }

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (clientError || !clientData) {
        Alert.alert('Profil nije pronađen', 'Vaš račun postoji, ali profil klijenta nije postavljen.');
        setLoading(false);
        return;
      }

      if (clientData.status === 0) {
        await supabase.auth.signOut();
        Alert.alert('Račun blokiran', 'Vaš klijentski račun je deaktiviran.');
        setLoading(false);
        return;
      }

      navigation.replace('Main');
    } catch (err) {
      Alert.alert('Sustavna greška', 'Došlo je do neočekivane pogreške.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    const formUrl = 'https://detaily.hr/';

    try {
      const supported = await Linking.canOpenURL(formUrl);

      if (supported) {
        await Linking.openURL(formUrl);
      } else {
        Alert.alert(
          "Greška", 
          "Nažalost, ne možemo otvoriti link na ovom uređaju."
        );
      }
    } catch (error) {
      console.error("Greška pri otvaranju forme:", error);
      Alert.alert("Greška", "Došlo je do problema pri otvaranju stranice.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <View style={styles.headerSection}>
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../assets/images/n_icon.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{APP_NAME || 'Dobrodošli'}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Prijavite se u sustav za partnere
            </Text>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Mail size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email adresa"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Lock size={20} color={theme.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Lozinka"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity 
              style={[styles.loginBtn, { backgroundColor: theme.accent }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginBtnText}>PRIJAVI SE</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>ILI</Text>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            </View>

            <TouchableOpacity 
              style={[styles.requestBtn, { borderColor: theme.accent }]}
              onPress={handleRequestAccess}
              activeOpacity={0.7}
            >
              <UserPlus size={20} color={theme.accent} style={{ marginRight: 10 }} />
              <Text style={[styles.requestBtnText, { color: theme.accent }]}>ZATRAŽI PRISTUP</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.footer, { marginBottom: insets.bottom + 20 }]}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Verzija {APP_VERSION} • Sigurna prijava
            </Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 30, justifyContent: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 50 },
  logoWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, textAlign: 'center', marginTop: 5, opacity: 0.7 },
  form: { width: '100%' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  inputIcon: { marginRight: 15 },
  input: { flex: 1, fontSize: 16, fontWeight: '700' },
  loginBtn: {
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#008AFF',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  divider: { flex: 1, height: 1 },
  dividerText: { 
    marginHorizontal: 15, 
    fontSize: 12, 
    fontWeight: '800', 
    opacity: 0.5 
  },
  requestBtn: {
    height: 60,
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
});