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
import { initDatabase, getSetting } from './src/database/database';
import SetupScreen from './src/screens/SetupScreen';
import MainScreen from './src/screens/MainScreen';
import CaptureScreen from './src/screens/CaptureScreen';
import LogViewerScreen from './src/screens/LogViewerScreen';
import Toast from 'react-native-toast-message';
import { APP_COLORS } from './src/config/constants';
import { processQueue } from './src/services/uploadQueueService';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
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
      setIsLoading(false);
    }
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
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
          <Text style={styles.loadingText}>Loading Receipt Keeper...</Text>
        </View>
      </SafeAreaView>
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

