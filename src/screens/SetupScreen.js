import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { getSetting, saveSetting } from '../database/database';
import { DEFAULT_CARDS, APP_COLORS } from '../config/constants';

const SetupScreen = ({ onSetupComplete }) => {
  const [cards, setCards] = useState(DEFAULT_CARDS);
  const [onedriveFolder, setOnedriveFolder] = useState('/Receipts');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedCards = await getSetting('payment_cards');
      const savedFolder = await getSetting('onedrive_base_path');

      if (savedCards) {
        setCards(JSON.parse(savedCards));
      }
      if (savedFolder) {
        setOnedriveFolder(savedFolder);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await saveSetting('payment_cards', JSON.stringify(cards));
      await saveSetting('onedrive_base_path', onedriveFolder);
      await saveSetting('setup_completed', 'true');

      Alert.alert('Success', 'Settings saved successfully!', [
        { text: 'OK', onPress: onSetupComplete },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
      console.error('Error saving settings:', error);
    }
  };

  const updateCardName = (index, name) => {
    const newCards = [...cards];
    newCards[index].name = name;
    setCards(newCards);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📱 Receipt Keeper Setup</Text>
      <Text style={styles.subtitle}>Configure your app for quick receipt capture</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>OneDrive Folder</Text>
        <TextInput
          style={styles.input}
          value={onedriveFolder}
          onChangeText={setOnedriveFolder}
          placeholder="/Receipts"
          placeholderTextColor={APP_COLORS.textSecondary}
        />
        <Text style={styles.hint}>Base folder in your OneDrive for receipts</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Cards</Text>
        <Text style={styles.hint}>Customize your card names for quick selection</Text>
        {cards.map((card, index) => (
          <View key={card.id} style={styles.cardInput}>
            <View style={[styles.colorDot, { backgroundColor: card.color }]} />
            <TextInput
              style={styles.input}
              value={card.name}
              onChangeText={(text) => updateCardName(index, text)}
              placeholder={`Card ${index + 1}`}
              placeholderTextColor={APP_COLORS.textSecondary}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ How It Works</Text>
        <Text style={styles.infoText}>
          1. Tap the camera button to capture a receipt{'\n'}
          2. Select payment method (Cash or Card){'\n'}
          3. Receipt auto-saves to:{'\n'}
          {'   '}OneDrive/YYYY/MM/DD-HHMMSS.jpg{'\n'}
          4. Get instant success confirmation
        </Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save & Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: APP_COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: APP_COLORS.textSecondary,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: APP_COLORS.text,
  },
  input: {
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: APP_COLORS.text,
  },
  hint: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginTop: 5,
  },
  cardInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  infoText: {
    fontSize: 15,
    lineHeight: 24,
    color: APP_COLORS.text,
    backgroundColor: APP_COLORS.surface,
    padding: 15,
    borderRadius: 10,
  },
  saveButton: {
    backgroundColor: APP_COLORS.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SetupScreen;
