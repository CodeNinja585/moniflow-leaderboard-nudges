import { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { RewardsScreen } from './src/screens/RewardsScreen';
import { BottomNav } from './src/components/BottomNav';
import { RecommendationsProvider } from './src/state/RecommendationsContext';
import { DemoProvider } from './src/state/DemoContext';
import { colors } from './src/theme/tokens';

type Screen = 'home' | 'rewards' | 'leaderboard';

SplashScreen.preventAutoHideAsync();

export default function App() {
  // Demo flow, like the live app: Home, Reward tab, Rewards, Leaderboard.
  const [screen, setScreen] = useState<Screen>('home');
  const [cameFrom, setCameFrom] = useState<'home' | 'rewards'>('rewards');

  const openLeaderboard = (from: 'home' | 'rewards') => {
    setCameFrom(from);
    setScreen('leaderboard');
  };

  // Android back: Leaderboard returns where it came from, Rewards returns Home, Home exits.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'leaderboard') {
        setScreen(cameFrom);
        return true;
      }
      if (screen === 'rewards') {
        setScreen('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [screen, cameFrom]);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <RecommendationsProvider>
      <DemoProvider>
        <View style={{ flex: 1, backgroundColor: colors.screenBg }}>
          {screen === 'leaderboard' ? (
            <LeaderboardScreen onBack={() => setScreen(cameFrom)} />
          ) : (
            <>
              <View style={{ flex: 1 }}>
                {screen === 'home' ? (
                  <HomeScreen onOpenLeaderboard={() => openLeaderboard('home')} />
                ) : (
                  <RewardsScreen onOpenLeaderboard={() => openLeaderboard('rewards')} />
                )}
              </View>
              <BottomNav
                active={screen === 'home' ? 'home' : 'reward'}
                onChange={(tab) => setScreen(tab === 'home' ? 'home' : 'rewards')}
              />
            </>
          )}
        </View>
        <StatusBar style={screen === 'rewards' ? 'dark' : 'light'} />
      </DemoProvider>
      </RecommendationsProvider>
    </SafeAreaProvider>
  );
}
