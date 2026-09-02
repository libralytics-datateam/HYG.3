export type OnboardingStackParamList = {
  Step1: undefined;
  Step2: undefined;
  Step3: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Plan: undefined;
  Trends: { metric?: string } | undefined;
  Report: undefined;
  Pharmacist: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ScanTab: undefined;
  CheckinTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};
