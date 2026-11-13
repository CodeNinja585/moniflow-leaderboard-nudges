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
import { PayScreen } from './src/screens/PayScreen';
import { BottomNav } from './src/components/BottomNav';
import { RecommendationsProvider } from './src/state/RecommendationsContext';
import { DemoProvider } from './src/state/DemoContext';
import { SessionProvider, useSession } from './src/state/SessionContext';
import { SelectUserScreen } from './src/screens/SelectUserScreen';
import { colors } from './src/theme/tokens';

type Screen = 'home' | 'rewards' | 'leaderboard' | 'pay';

SplashScreen.preventAutoHideAsync();

/** Everything after sign-in. Keyed by user in App, so switching user starts from a clean slate. */
function Main() {
  const { signOut } = useSession();
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
      if (screen === 'rewards' || screen === 'pay') {
        setScreen('home');
        return true;
      }
      // Home: back returns to the user picker instead of closing the app.
      signOut();
      return true;
    });
    return () => sub.remove();
  }, [screen, cameFrom, signOut]);

  return (
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
                ) : screen === 'pay' ? (
                  <PayScreen />
                ) : (
                  <RewardsScreen onOpenLeaderboard={() => openLeaderboard('rewards')} />
                )}
              </View>
              <BottomNav
                active={screen === 'home' ? 'home' : screen === 'pay' ? 'pay' : 'reward'}
                onChange={(tab) => setScreen(tab === 'home' ? 'home' : tab === 'pay' ? 'pay' : 'rewards')}
              />
            </>
          )}
        </View>
        <StatusBar style={screen === 'rewards' || screen === 'pay' ? 'dark' : 'light'} />
      </DemoProvider>
    </RecommendationsProvider>
  );
}

function Gate() {
  const { user } = useSession();
  if (!user) {
    return (
      <>
        <SelectUserScreen />
        <StatusBar style="light" />
      </>
    );
  }
  return <Main key={user.id} />;
}

export default function App() {
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
      <SessionProvider>
        <Gate />
      </SessionProvider>
    </SafeAreaProvider>
  );
}
