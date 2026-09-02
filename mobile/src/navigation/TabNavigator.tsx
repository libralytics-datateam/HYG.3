import { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Home, ScanLine, Calendar, User } from 'lucide-react-native';
import { HomeStackNavigator } from './HomeStackNavigator';
import ScanFlowScreen from '../screens/scan/ScanFlowScreen';
import CheckInFlowScreen from '../screens/checkin/CheckInFlowScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { colors } from '../theme/tokens';
import { usePatient } from '../context/PatientContext';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function TabNavigator() {
  const navigation = useNavigation();
  const { pendingIntent, setPendingIntent } = usePatient();

  // Consumes the intent Onboarding Step 3 set (e.g. "take me straight to the
  // scanner") the first time the main app mounts after signing in.
  useEffect(() => {
    if (!pendingIntent) return;
    const target = pendingIntent === 'scan' ? 'ScanTab' : 'ProfileTab';
    // @ts-expect-error -- navigating by name across the tab navigator
    navigation.navigate(target);
    setPendingIntent(null);
  }, [pendingIntent, navigation, setPendingIntent]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.inactiveTab,
        tabBarStyle: { borderTopColor: colors.border, height: 84, paddingTop: 8, paddingBottom: 26 },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen
        name="ScanTab"
        component={ScanFlowScreen}
        options={({ route }) => ({
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} />,
          // The camera and analyzing states are full-bleed — hide the tab
          // bar for those, same as the prototype's showTabs logic.
          tabBarStyle: hiddenTabBarFor(route) ? { display: 'none' } : { borderTopColor: colors.border, height: 84, paddingTop: 8, paddingBottom: 26 },
        })}
      />
      <Tab.Screen
        name="CheckinTab"
        component={CheckInFlowScreen}
        options={{ tabBarLabel: 'Check-in', tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} /> }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

function hiddenTabBarFor(route: { params?: object }): boolean {
  const params = route.params as { scanStep?: string } | undefined;
  return params?.scanStep === 'camera' || params?.scanStep === 'analyzing';
}
