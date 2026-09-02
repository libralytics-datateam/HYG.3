import { createContext, useContext, useState, type ReactNode } from 'react';

export interface OnboardingForm {
  firstName: string;
  lastName: string;
  email: string;
  age: string;
  gender: string;
  heightCm: string;
  weightKg: string;
  healthGoals: string[];
  dietaryRestrictions: string[];
  pdpaConsent: boolean;
}

const initial: OnboardingForm = {
  firstName: '',
  lastName: '',
  email: '',
  age: '',
  gender: '',
  heightCm: '',
  weightKg: '',
  healthGoals: [],
  dietaryRestrictions: [],
  pdpaConsent: false,
};

interface Ctx {
  form: OnboardingForm;
  setForm: (f: OnboardingForm) => void;
}

const OnboardingFormContext = createContext<Ctx | null>(null);

export function OnboardingFormProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<OnboardingForm>(initial);
  return <OnboardingFormContext.Provider value={{ form, setForm }}>{children}</OnboardingFormContext.Provider>;
}

export function useOnboardingForm(): Ctx {
  const ctx = useContext(OnboardingFormContext);
  if (!ctx) throw new Error('useOnboardingForm must be used within OnboardingFormProvider');
  return ctx;
}
