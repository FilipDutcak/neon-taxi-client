import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Bell, Car, Map, Menu } from 'lucide-react-native';
import { View, Platform, StatusBar } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Import Contexta
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

// Import ekrana
import HomeScreen from './src/screens/HomeScreen';
import MenuScreen from './src/screens/MenuScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RideDetailsScreen from './src/screens/RideDetailsScreen';
import RideHistoryScreen from './src/screens/RideHistoryScreen';
import AboutScreen from './src/screens/AboutScreen';
import ComingSoonScreen from './src/screens/ComingSoonScreen';
import EarningsScreen from './src/screens/EarningsScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import SupportScreen from './src/screens/SupportScreen';

// Kreiramo Navigatore
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// --- NAVIGACIJSKE TEME ---
const MyNavigationLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#008AFF',
    background: '#F8F9FB',
    card: '#FFFFFF',
    text: '#1A1A1A',
    border: '#F0F0F0',
  },
};

const MyNavigationDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#008AFF',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#333333',
  },
};

// --- TAB NAVIGACIJA (Glavni dio aplikacije) ---
function MyTabs() {
  const { isDarkMode, theme } = useTheme();
  const insets = useSafeAreaInsets(); // Dohvaćamo sigurne margine sustava

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: isDarkMode ? '#888' : '#AAAAAA',
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          elevation: 25,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -5 },
          // POPRAVAK: Koristimo insets za dinamičku visinu
          height: Platform.OS === 'ios' ? 88 : 65 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10 + insets.bottom,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          // Uklonjen marginBottom jer paddingBottom na tabBarStyle rješava stvar
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          title: 'Naruči',
          tabBarIcon: ({ color }) => <Map size={22} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Rides" 
        component={RideHistoryScreen} 
        options={{
          title: 'Narudžbe',
          tabBarIcon: ({ color }) => <Car size={22} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationScreen} 
        options={{
          title: 'Obavijesti',
          tabBarIcon: ({ color }) => <Bell size={22} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Menu" 
        component={MenuScreen} 
        options={{
          title: 'Izbornik',
          tabBarIcon: ({ color }) => <Menu size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// --- GLAVNI SADRŽAJ (Sluša Context) ---
function AppContent() {
  const { isDarkMode, theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent" 
        translucent={true}
      />
      
      <NavigationContainer theme={isDarkMode ? MyNavigationDarkTheme : MyNavigationLightTheme}>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS 
          }}
        >
          {/* 1. Login Ekran */}
          <Stack.Screen name="Login" component={LoginScreen} />
          
          {/* 2. Glavni dio s tabovima */}
          <Stack.Screen name="Main" component={MyTabs} />

          {/* 3. Detalji vožnje */}
          <Stack.Screen 
            name="RideDetails" 
            component={RideDetailsScreen} 
            options={{
              headerShown: false,
            }}
          />

          {/* 4. Profil kao modal */}
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{
              presentation: 'modal', 
              cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
            }}
          />
          <Stack.Screen 
            name="About" 
            component={AboutScreen} 
            options={{
              presentation: 'modal', 
              cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
            }}
          />
          <Stack.Screen 
            name="Support" 
            component={SupportScreen} 
            options={{
              presentation: 'modal', 
              cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
            }}
          />
          <Stack.Screen 
            name="Earnings" 
            component={EarningsScreen} 
            options={{
              presentation: 'modal', 
              cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
            }}
          />
          <Stack.Screen 
            name="Soon" 
            component={ComingSoonScreen} 
            options={{
              presentation: 'modal', 
              cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

// --- KORIJEN APLIKACIJE ---
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}