import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingFormProvider } from '../screens/onboarding/useOnboardingForm';
import OnboardingStep1 from '../screens/onboarding/OnboardingStep1';
import OnboardingStep2 from '../screens/onboarding/OnboardingStep2';
import OnboardingStep3 from '../screens/onboarding/OnboardingStep3';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <OnboardingFormProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Step1" component={OnboardingStep1} />
        <Stack.Screen name="Step2" component={OnboardingStep2} />
        <Stack.Screen name="Step3" component={OnboardingStep3} options={{ gestureEnabled: false }} />
      </Stack.Navigator>
    </OnboardingFormProvider>
  );
}
