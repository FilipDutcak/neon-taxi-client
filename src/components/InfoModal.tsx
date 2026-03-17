import React from 'react';
import { 
  StyleSheet, View, Text, TouchableOpacity, Modal, 
  Dimensions, Animated, Platform 
} from 'react-native';
import { X, Info, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tipovi informacija koje modal može prikazati
export type InfoModalType = 'info' | 'success' | 'warning' | 'error';

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  type?: InfoModalType;
  primaryButtonText?: string;
  onPrimaryAction?: () => void;
  secondaryButtonText?: string;
}

export default function InfoModal({ 
  visible, 
  onClose, 
  title, 
  description, 
  type = 'info',
  primaryButtonText,
  onPrimaryAction,
  secondaryButtonText
}: InfoModalProps) {
  const { theme, isDarkMode } = useTheme();

  // Konfiguracija ikona i boja ovisno o tipu
  const getConfig = () => {
    switch (type) {
      case 'success':
        return { icon: CheckCircle2, color: '#34C759', bg: 'rgba(52, 199, 89, 0.1)' };
      case 'warning':
        return { icon: AlertTriangle, color: '#FF9500', bg: 'rgba(255, 149, 0, 0.1)' };
      case 'error':
        return { icon: AlertCircle, color: '#FF3B30', bg: 'rgba(255, 59, 48, 0.1)' };
      default:
        return { icon: Info, color: theme.accent, bg: isDarkMode ? 'rgba(0, 138, 255, 0.1)' : 'rgba(0, 138, 255, 0.05)' };
    }
  };

  const config = getConfig();
  const StatusIcon = config.icon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          
          {/* Gumb za zatvaranje u kutu */}
          <TouchableOpacity 
            style={styles.closeBtn} 
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X color={theme.textSecondary} size={20} />
          </TouchableOpacity>

          {/* Ikona statusa */}
          <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
            <StatusIcon color={config.color} size={32} />
          </View>

          {/* Tekstualni sadržaj */}
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {description}
            </Text>
          </View>

          {/* Akcijski gumbi */}
          <View style={styles.footer}>
            {secondaryButtonText && (
              <TouchableOpacity 
                style={[styles.btn, { flex: 1, backgroundColor: isDarkMode ? '#1A1A1A' : '#F5F5F5' }]} 
                onPress={onClose}
              >
                <Text style={[styles.btnText, { color: theme.text }]}>{secondaryButtonText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.btn, 
                { flex: 1, backgroundColor: type === 'error' ? '#FF3B30' : theme.accent }
              ]} 
              onPress={onPrimaryAction || onClose}
            >
              <Text style={[styles.btnText, { color: '#FFF' }]}>
                {primaryButtonText || 'U redu'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 10 }
    })
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: 20,
    zIndex: 1
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  btn: {
    height: 55,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700'
  }
});