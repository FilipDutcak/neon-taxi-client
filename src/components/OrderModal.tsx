import React, { useState, useRef } from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, 
  Platform, TextInput, ActivityIndicator, Alert, Dimensions, ScrollView 
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  X, Plane, Building2, Palmtree, Calendar, Clock, Users, 
  Wallet, MessageSquare, Car, Minus, Plus, CreditCard, Receipt 
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_MAPS_API_KEY as string;

// Definiramo dostupne načine plaćanja
const PAYMENT_METHODS = [
  { id: 'cash', label: 'Gotovina', icon: Wallet, color: '#34C759' },
  // { id: 'card', label: 'Kartica', icon: CreditCard, color: '#007AFF' }, // Za budućnost
  // { id: 'room', label: 'Na sobu', icon: Building2, color: '#5856D6' }, // Za budućnost
];

interface OrderModalProps {
  onClose: () => void;
  clientInfo: {
    id: string;
    name: string;
    address?: string;
    lat?: number;
    lng?: number;
  };
  onSuccess: () => void;
}

export default function OrderModal({ onClose, clientInfo, onSuccess }: OrderModalProps) {
  const { theme, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);

  const [destination, setDestination] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [passengers, setPassengers] = useState(1);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Defaultno gotovina
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);

  const destRef = useRef<any>(null);

  const handleOrder = async () => {
    if (!destination || !coords) {
      Alert.alert('Greška', 'Molimo odaberite odredište putem pretrage kako bismo dobili točne koordinate.');
      return;
    }
    
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nije pronađen prijavljeni operater.");

      const tenMinFromNow = new Date(new Date().getTime() + 10 * 60000);
      const status = date > tenMinFromNow ? 'scheduled' : 'pending';

      const numVehicles = Math.ceil(passengers / 4);
      const rideOrders = [];
      let remainingPassengers = passengers;

      for (let i = 0; i < numVehicles; i++) {
        const passengersForThisRide = Math.min(4, remainingPassengers);
        remainingPassengers -= passengersForThisRide;

        rideOrders.push({
          client_id: clientInfo.id,
          pickup_address: clientInfo.address || 'Lokacija klijenta: ' + clientInfo.name,
          pickup_lat: clientInfo.lat || null,
          pickup_lng: clientInfo.lng || null,
          destination_address: destination,
          destination_lat: coords.lat,
          destination_lng: coords.lng,
          scheduled_at: date.toISOString(),
          passengers: passengersForThisRide,
          notes: numVehicles > 1 
            ? `[Vozilo ${i + 1}/${numVehicles}] ${notes}`.trim() 
            : notes,
          status,
          payment_method: paymentMethod, // Dinamički odabran način plaćanja
          created_by: user.id
        });
      }

      const { error } = await supabase.from('rides').insert(rideOrders);
      if (error) throw error;

      if (numVehicles > 1) {
        Alert.alert('Uspješno', `Poslane su ${numVehicles} narudžbe.`);
      }
      onSuccess();
    } catch (error: any) {
      Alert.alert('Greška', error.message);
    } finally {
      setLoading(false);
    }
  };

  const currentPayment = PAYMENT_METHODS.find(m => m.id === paymentMethod) || PAYMENT_METHODS[0];
  const PaymentIcon = currentPayment.icon;
  const commonHitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

  return (
    <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
        <Text style={[styles.modalTitle, { color: theme.text }]}>Nova Narudžba</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={commonHitSlop}>
          <X color={theme.text} size={24} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <View style={[styles.searchSection, { zIndex: 9999 }]}>
          <Text style={[styles.label, { color: theme.textSecondary, marginLeft: 5 }]}>Kamo gost putuje?</Text>
          <GooglePlacesAutocomplete
            ref={destRef}
            placeholder='Unesite adresu ili odredište...'
            onPress={(data, details = null) => {
              setDestination(data.description);
              if (details) {
                setCoords({
                  lat: details.geometry.location.lat,
                  lng: details.geometry.location.lng
                });
              }
            }}
            query={{ 
              key: GOOGLE_MAPS_API_KEY, 
              language: 'hr', 
              components: 'country:hr',
              location: '44.8666,13.8496', 
              radius: '10000',
            }}
            fetchDetails={true}
            enablePoweredByContainer={false}
            debounce={300}
            styles={{
              container: { flex: 0 },
              textInputContainer: { 
                backgroundColor: theme.card, 
                borderRadius: 15, 
                borderWidth: 1, 
                borderColor: theme.border,
                marginTop: 8
              },
              textInput: { 
                backgroundColor: 'transparent', 
                color: theme.text, 
                fontSize: 16,
                height: 50,
                paddingLeft: 10
              },
              listView: { 
                backgroundColor: theme.card, 
                borderColor: theme.border, 
                borderWidth: 1,
                borderRadius: 12,
                marginTop: 5,
                elevation: 5,
                zIndex: 1000,
                position: 'absolute',
                top: 55,
                width: '100%'
              },
              description: { color: theme.text },
              row: { backgroundColor: theme.card, padding: 13 },
              separator: { backgroundColor: theme.border },
            }}
            textInputProps={{ 
              placeholderTextColor: isDarkMode ? '#666' : '#999',
              clearButtonMode: 'while-editing',
              onChangeText: (txt) => {
                  setDestination(txt);
                  if(txt === "") setCoords(null);
              }
            }}
          />
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
        >
          <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 10 }]}>Vrijeme polaska</Text>
          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.infoBtn, { backgroundColor: theme.card, borderColor: theme.border }]} 
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={18} color={theme.accent} />
              <Text style={{ color: theme.text, fontWeight: '600' }}>{date.toLocaleDateString('hr-HR')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.infoBtn, { backgroundColor: theme.card, borderColor: theme.border }]} 
              onPress={() => setShowTimePicker(true)}
            >
              <Clock size={18} color={theme.accent} />
              <Text style={{ color: theme.text, fontWeight: '600' }}>{date.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            {/* Putnici - Stepper */}
            <View style={[styles.infoBtn, { backgroundColor: theme.card, borderColor: theme.border, flex: 1.2 }]}>
              <Users size={18} color={theme.accent} />
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => setPassengers(Math.max(1, passengers - 1))} hitSlop={commonHitSlop}>
                  <Minus size={20} color={theme.text}/>
                </TouchableOpacity>
                <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16, minWidth: 25, textAlign: 'center' }}>{passengers}</Text>
                <TouchableOpacity onPress={() => setPassengers(passengers + 1)} hitSlop={commonHitSlop}>
                  <Plus size={20} color={theme.text}/>
                </TouchableOpacity>
              </View>
            </View>

            {/* Plaćanje - Birač (Pripremljen) */}
            <TouchableOpacity 
              style={[styles.infoBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => {
                // Za sada samo obavijest jer imamo samo jedan izbor, 
                // kasnije ovdje otvaraš BottomSheet ili novi Modal
                Alert.alert("Način plaćanja", "Trenutno je dostupno samo plaćanje gotovinom.");
              }}
            >
              <PaymentIcon size={18} color={currentPayment.color} />
              <Text style={{ color: theme.text, fontWeight: '600' }}>{currentPayment.label}</Text>
            </TouchableOpacity>
          </View>

          {passengers > 4 && (
            <View style={[styles.vehicleInfo, { backgroundColor: theme.accent + '15' }]}>
              <Car size={16} color={theme.accent} />
              <Text style={{ color: theme.text, fontSize: 12, fontWeight: '600' }}>
                Potrebno vozila: <Text style={{ color: theme.accent, fontWeight: '800' }}>{Math.ceil(passengers / 4)}</Text>
              </Text>
            </View>
          )}

          <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 10, marginTop: 5 }]}>Dodatne informacije</Text>
          <View style={[styles.noteBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <MessageSquare size={18} color={theme.accent} style={{ marginTop: 2 }} />
            <TextInput 
              style={{ color: theme.text, flex: 1, fontWeight: '600', padding: 0, textAlignVertical: 'top', minHeight: 60 }}
              placeholder="Broj sobe, ime gosta ili sl..."
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <TouchableOpacity 
            style={[styles.confirmBtn, { backgroundColor: theme.accent }, (!destination || !coords) && { opacity: 0.5 }]}
            onPress={handleOrder}
            disabled={loading || !destination || !coords}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Car size={24} color="#FFF" />
                <Text style={styles.confirmBtnText}>POŠALJI NARUDŽBU</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Pickers... */}
      {showDatePicker && (
        <DateTimePicker 
          value={date} 
          mode="date" 
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => { setShowDatePicker(false); if(d) setDate(d); }} 
        />
      )}
      {showTimePicker && (
        <DateTimePicker 
          value={date} 
          mode="time" 
          is24Hour={true} 
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => { setShowTimePicker(false); if(d) setDate(d); }} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeBtn: { padding: 5 },
  searchSection: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 5 },
  label: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  infoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 15, borderRadius: 15, borderWidth: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 15 },
  noteBox: { flexDirection: 'row', gap: 10, padding: 15, borderRadius: 15, borderWidth: 1, marginBottom: 30 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 20, gap: 12, elevation: 4 },
  confirmBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});