import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/home/HomeScreen';
import PlanScreen from '../screens/plan/PlanScreen';
import TrendsScreen from '../screens/trends/TrendsScreen';
import ReportScreen from '../screens/report/ReportScreen';
import PharmacistScreen from '../screens/pharmacist/PharmacistScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Plan" component={PlanScreen} />
      <Stack.Screen name="Trends" component={TrendsScreen} />
      <Stack.Screen name="Report" component={ReportScreen} />
      <Stack.Screen name="Pharmacist" component={PharmacistScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
