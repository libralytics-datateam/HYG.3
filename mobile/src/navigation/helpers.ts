import type { HomeStackParamList } from './types';

// Cross-tab navigation (e.g. Check-in's "See it on my trend" jumping into
// the Home tab's nested stack) isn't expressible in a single strongly-typed
// call without a much larger composite-navigator type — this one helper
// isolates the necessary `any` instead of scattering `as never` everywhere.
export function navigateHomeStack(navigation: { navigate: (...args: any[]) => void }, screen: keyof HomeStackParamList) {
  navigation.navigate('HomeTab', { screen });
}
