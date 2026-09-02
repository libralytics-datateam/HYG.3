import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts as useFigtree, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold } from '@expo-google-fonts/figtree';
import { useFonts as useNotoSans, NotoSans_400Regular, NotoSans_500Medium, NotoSans_600SemiBold } from '@expo-google-fonts/noto-sans';

import './src/i18n';
import { restoreLanguage } from './src/i18n';
import { PatientProvider } from './src/context/PatientContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [figtreeLoaded] = useFigtree({ Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold });
  const [notoLoaded] = useNotoSans({ NotoSans_400Regular, NotoSans_500Medium, NotoSans_600SemiBold });
  const [languageReady, setLanguageReady] = useState(false);

  useEffect(() => {
    restoreLanguage().finally(() => setLanguageReady(true));
  }, []);

  const ready = figtreeLoaded && notoLoaded && languageReady;

  const onLayout = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} onLayout={onLayout}>
      <SafeAreaProvider>
        <PatientProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </PatientProvider>
      </SafeAreaProvider>
    </View>
  );
}
