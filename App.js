import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  View,
  Text,
  ActivityIndicator,
  AppState,
} from 'react-native';
import RNBootSplash from 'react-native-bootsplash';
import { initDatabase, getSetting } from './src/database/database';
import SetupScreen from './src/screens/SetupScreen';
import MainScreen from './src/screens/MainScreen';
import CaptureScreen from './src/screens/CaptureScreen';
import LogViewerScreen from './src/screens/LogViewerScreen';
import AnimatedSplash from './src/components/AnimatedSplash';
import Toast from 'react-native-toast-message';
import { APP_COLORS } from './src/config/constants';
import { processQueue } from './src/services/uploadQueueService';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('main');

  useEffect(() => {
    initialize();
    
    // Start periodic queue processing
    const queueInterval = setInterval(() => {
      processQueue().catch(console.error);
    }, 30000); // Every 30 seconds
    
    // Process queue when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        processQueue().catch(console.error);
      }
    });
    
    return () => {
      clearInterval(queueInterval);
      subscription.remove();
    };
  }, []);

  const initialize = async () => {
    try {
      await initDatabase();
      const setupStatus = await getSetting('setup_completed');
      setSetupCompleted(setupStatus === 'true');
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      // Hide native splash quickly - animated splash takes over
      await RNBootSplash.hide({ fade: true, duration: 100 });
      setIsLoading(false);
    }
  };

  const handleAnimatedSplashFinish = () => {
    setShowAnimatedSplash(false);
  };

  const handleSetupComplete = () => {
    setSetupCompleted(true);
    setCurrentScreen('main');
  };

  const handleCapture = () => {
    setCurrentScreen('capture');
  };

  const handleBackToMain = () => {
    setCurrentScreen('main');
  };

  const handleSettings = () => {
    setCurrentScreen('setup');
  };

  const handleViewLogs = () => {
    setCurrentScreen('logs');
  };

  if (isLoading) {
    // Dark background matching splash overlay while loading
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0B3D2E" translucent />
      </View>
    );
  }

  // Show animated Lottie splash after native splash hides
  if (showAnimatedSplash) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0B3D2E" translucent />
        <AnimatedSplash onAnimationFinish={handleAnimatedSplashFinish} />
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {!setupCompleted || currentScreen === 'setup' ? (
          <SetupScreen onSetupComplete={handleSetupComplete} />
        ) : currentScreen === 'capture' ? (
          <CaptureScreen onBack={handleBackToMain} />
        ) : currentScreen === 'logs' ? (
          <LogViewerScreen onBack={handleBackToMain} />
        ) : (
          <MainScreen 
            onCapture={handleCapture} 
            onSettings={handleSettings}
            onViewLogs={handleViewLogs}
          />
        )}
      </SafeAreaView>
      <Toast />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#0B3D2E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: APP_COLORS.textSecondary,
  },
});

export default App;

