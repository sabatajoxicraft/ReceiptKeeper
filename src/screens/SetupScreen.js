import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { getSetting, saveSetting } from '../database/database';
import { DEFAULT_CARDS, APP_COLORS } from '../config/constants';
import { getCardType, formatCardLabel } from '../utils/cardUtils';
import {
  authenticateOneDrive,
  isAuthenticated,
  getOneDriveUserInfo,
  signOutOneDrive,
  browseFolders,
  setOneDriveBasePath,
  getOneDriveBasePath,
} from '../services/onedriveService';
import OneDriveFolderBrowser from '../components/OneDriveFolderBrowser';

const SetupScreen = ({ onSetupComplete }) => {
  const [cards, setCards] = useState(DEFAULT_CARDS);
  const [onedriveFolder, setOnedriveFolder] = useState('/Receipts');
  const [localReceiptsPath, setLocalReceiptsPath] = useState('/storage/emulated/0/Download/ReceiptKeeper');
  const [localLogsPath, setLocalLogsPath] = useState('/storage/emulated/0/Download/ReceiptKeeper/Logs');
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [authenticating, setAuthenticating] = useState(false);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  
  // New Card State
  const [newCardFirst, setNewCardFirst] = useState('');
  const [newCardLast, setNewCardLast] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedCards = await getSetting('payment_cards');
      const savedFolder = await getOneDriveBasePath();
      const savedReceiptsPath = await getSetting('local_receipts_path');
      const savedLogsPath = await getSetting('local_logs_path');
      const auth = await isAuthenticated();
      
      if (savedCards) {
        setCards(JSON.parse(savedCards));
      }
      if (savedFolder) {
        setOnedriveFolder(savedFolder);
      }
      if (savedReceiptsPath) {
        setLocalReceiptsPath(savedReceiptsPath);
      }
      if (savedLogsPath) {
        setLocalLogsPath(savedLogsPath);
      }
      
      setAuthenticated(auth);
      
      if (auth) {
        const info = await getOneDriveUserInfo();
        setUserInfo(info);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setAuthenticating(true);
    try {
      const result = await authenticateOneDrive();
      
      if (result.success) {
        setAuthenticated(true);
        setUserInfo({ email: result.email, name: result.name });
        Alert.alert('Success', `Signed in as ${result.email}`);
      } else {
        Alert.alert('Authentication Failed', result.error || 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to sign in');
    } finally {
      setAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from OneDrive?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOutOneDrive();
            setAuthenticated(false);
            setUserInfo(null);
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!authenticated) {
      Alert.alert(
        'OneDrive Not Connected',
        'Would you like to continue without OneDrive sync? Receipts will only be saved locally.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: async () => {
              await saveSettings();
            },
          },
        ]
      );
      return;
    }
    
    await saveSettings();
  };

  const saveSettings = async () => {
    try {
      await saveSetting('payment_cards', JSON.stringify(cards));
      await setOneDriveBasePath(onedriveFolder);
      await saveSetting('local_receipts_path', localReceiptsPath);
      await saveSetting('local_logs_path', localLogsPath);
      await saveSetting('setup_completed', 'true');

      Alert.alert('Success', 'Settings saved successfully!', [
        { text: 'OK', onPress: onSetupComplete },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
      console.error('Error saving settings:', error);
    }
  };

  const handleAddCard = () => {
    if (!newCardFirst || newCardFirst.length !== 1 || !newCardLast || newCardLast.length !== 4) {
      Alert.alert('Invalid Input', 'Please enter the first digit and the last 4 digits.');
      return;
    }

    const { color, type } = getCardType(newCardFirst);
    const newCard = {
      id: Date.now().toString(),
      firstDigit: newCardFirst,
      lastFour: newCardLast,
      name: `${type} ${newCardFirst}********${newCardLast}`,
      color: color,
      type: type
    };

    setCards([...cards, newCard]);
    setNewCardFirst('');
    setNewCardLast('');
  };

  const handleDeleteCard = (id) => {
    Alert.alert(
      'Delete Card',
      'Are you sure? This will not affect past receipts.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setCards(cards.filter(c => c.id !== id));
          }
        }
      ]
    );
  };

  const handleBrowseReceiptsFolder = async () => {
    try {
      const result = await DocumentPicker.pickDirectory();
      if (result && result.uri) {
        console.log('Picked URI:', result.uri);
        
        // Convert content:// URI to file path
        let path = result.uri;
        
        // Handle different URI formats
        if (path.startsWith('content://com.android.externalstorage.documents/tree/primary:')) {
          // Remove the content URI prefix and convert to file path
          path = path.replace('content://com.android.externalstorage.documents/tree/primary:', '');
          path = decodeURIComponent(path);
          path = `/storage/emulated/0/${path}`;
        } else if (path.startsWith('content://')) {
          Alert.alert('Info', 'Please use the text field to enter the path manually.\n\nExample:\n/storage/emulated/0/Download/ReceiptKeeper');
          return;
        }
        
        console.log('Converted path:', path);
        setLocalReceiptsPath(path);
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Browse error:', err);
        Alert.alert('Error', 'Failed to pick folder: ' + err.message);
      }
    }
  };

  const handleBrowseLogsFolder = async () => {
    try {
      const result = await DocumentPicker.pickDirectory();
      if (result && result.uri) {
        console.log('Picked URI:', result.uri);
        
        // Convert content:// URI to file path
        let path = result.uri;
        
        // Handle different URI formats
        if (path.startsWith('content://com.android.externalstorage.documents/tree/primary:')) {
          // Remove the content URI prefix and convert to file path
          path = path.replace('content://com.android.externalstorage.documents/tree/primary:', '');
          path = decodeURIComponent(path);
          path = `/storage/emulated/0/${path}`;
        } else if (path.startsWith('content://')) {
          Alert.alert('Info', 'Please use the text field to enter the path manually.\n\nExample:\n/storage/emulated/0/Download/ReceiptKeeper/Logs');
          return;
        }
        
        console.log('Converted path:', path);
        setLocalLogsPath(path);
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        console.error('Browse error:', err);
        Alert.alert('Error', 'Failed to pick folder: ' + err.message);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={APP_COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📱 Receipt Keeper Setup</Text>
      <Text style={styles.subtitle}>Configure your app for quick receipt capture</Text>

      {/* OneDrive Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>☁️ OneDrive Connection</Text>
        
        {!authenticated ? (
          <>
            <Text style={styles.hint}>
              Connect your Microsoft account to sync receipts to OneDrive Personal
            </Text>
            <TouchableOpacity 
              style={styles.signInButton} 
              onPress={handleSignIn}
              disabled={authenticating}
            >
              {authenticating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signInButtonText}>🔐 Sign in with Microsoft</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.infoText}>
              Note: Requires Azure AD app registration. See ONEDRIVE_SETUP.md for instructions.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.userInfoBox}>
              <Text style={styles.userInfoLabel}>✅ Connected</Text>
              <Text style={styles.userInfoEmail}>{userInfo?.email}</Text>
              {userInfo?.name && (
                <Text style={styles.userInfoName}>{userInfo.name}</Text>
              )}
            </View>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Local Storage Paths Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💾 Local Storage Paths</Text>
        <Text style={styles.hint}>
          ⚠️ Use text fields below - Browse buttons may give content:// URIs that don't work
        </Text>
        
        <Text style={styles.inputLabel}>Receipt Images Folder:</Text>
        <View style={styles.folderInputContainer}>
          <TextInput
            style={styles.folderInput}
            value={localReceiptsPath}
            onChangeText={setLocalReceiptsPath}
            placeholder="/storage/emulated/0/Download/ReceiptKeeper"
            placeholderTextColor={APP_COLORS.textSecondary}
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={styles.browseButton} 
            onPress={handleBrowseReceiptsFolder}
          >
            <Text style={styles.browseButtonText}>Browse</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          Example: /storage/emulated/0/Download/ReceiptKeeper
        </Text>

        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Log Files Folder:</Text>
        <View style={styles.folderInputContainer}>
          <TextInput
            style={styles.folderInput}
            value={localLogsPath}
            onChangeText={setLocalLogsPath}
            placeholder="/storage/emulated/0/Download/ReceiptKeeper/Logs"
            placeholderTextColor={APP_COLORS.textSecondary}
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={styles.browseButton} 
            onPress={handleBrowseLogsFolder}
          >
            <Text style={styles.browseButtonText}>Browse</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          Example: /storage/emulated/0/Download/ReceiptKeeper/Logs
        </Text>
      </View>

      {/* Folder Path Section */}
      {authenticated && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📁 OneDrive Folder</Text>
          <View style={styles.folderInputContainer}>
            <TextInput
              style={styles.folderInput}
              value={onedriveFolder}
              onChangeText={setOnedriveFolder}
              placeholder="/Receipts"
              placeholderTextColor={APP_COLORS.textSecondary}
            />
            <TouchableOpacity 
              style={styles.browseButton} 
              onPress={() => setShowFolderBrowser(true)}
            >
              <Text style={styles.browseButtonText}>Browse</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            Base folder in your OneDrive for receipts (e.g., /Documents/Receipts)
          </Text>
        </View>
      )}

      {/* Payment Cards Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💳 Payment Cards</Text>
        <Text style={styles.hint}>Manage your cards for quick selection</Text>
        
        {/* Existing Cards List */}
        {cards.map((card) => (
          <View key={card.id} style={styles.cardItem}>
            <View style={[styles.colorDot, { backgroundColor: card.color }]} />
            <Text style={styles.cardNameText}>{card.name}</Text>
            <TouchableOpacity 
              onPress={() => handleDeleteCard(card.id)}
              style={styles.deleteCardButton}>
              <Text style={styles.deleteCardText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add New Card Form */}
        <View style={styles.addCardContainer}>
          <Text style={styles.addCardLabel}>Add New:</Text>
          <View style={styles.cardFormRow}>
            <TextInput
              style={[styles.input, styles.shortInput]}
              value={newCardFirst}
              onChangeText={(text) => setNewCardFirst(text.replace(/[^0-9]/g, '').slice(0, 1))}
              placeholder="#"
              keyboardType="numeric"
              placeholderTextColor={APP_COLORS.textSecondary}
            />
            <Text style={styles.asterisks}>********</Text>
            <TextInput
              style={[styles.input, styles.mediumInput]}
              value={newCardLast}
              onChangeText={(text) => setNewCardLast(text.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder="1234"
              keyboardType="numeric"
              placeholderTextColor={APP_COLORS.textSecondary}
            />
            <TouchableOpacity 
              style={[
                styles.addCardButton, 
                (!newCardFirst || !newCardLast) && styles.disabledButton
              ]} 
              onPress={handleAddCard}
              disabled={!newCardFirst || !newCardLast}
            >
              <Text style={styles.addCardButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ How It Works</Text>
        <Text style={styles.infoText}>
          1. Tap the camera button to capture a receipt{'\n'}
          2. Select payment method (Cash or Card){'\n'}
          3. Receipt auto-saves locally and syncs to:{'\n'}
          {'   '}OneDrive/YYYY/MM/DD-HHMMSS.jpg{'\n'}
          4. Get instant success confirmation
        </Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save & Continue</Text>
      </TouchableOpacity>

      {/* Folder Browser Modal */}
      <Modal
        visible={showFolderBrowser}
        animationType="slide"
        onRequestClose={() => setShowFolderBrowser(false)}
      >
        <OneDriveFolderBrowser
          onSelectFolder={(path) => {
            setOnedriveFolder(path);
            setShowFolderBrowser(false);
          }}
          onCancel={() => setShowFolderBrowser(false)}
        />
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: APP_COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: APP_COLORS.textSecondary,
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.text,
    marginBottom: 8,
  },
  pathInput: {
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    color: APP_COLORS.text,
    fontFamily: 'monospace',
  },
  folderInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  folderInput: {
    flex: 1,
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: APP_COLORS.text,
  },
  browseButton: {
    backgroundColor: APP_COLORS.secondary,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginTop: 5,
    marginBottom: 10,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  cardNameText: {
    flex: 1,
    fontSize: 16,
    color: APP_COLORS.text,
    fontFamily: 'monospace',
  },
  deleteCardButton: {
    padding: 5,
  },
  deleteCardText: {
    fontSize: 18,
  },
  addCardContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: APP_COLORS.surface,
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: APP_COLORS.textSecondary,
  },
  addCardLabel: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginBottom: 10,
  },
  cardFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shortInput: {
    width: 50,
    textAlign: 'center',
  },
  mediumInput: {
    width: 80,
    textAlign: 'center',
  },
  asterisks: {
    fontSize: 18,
    color: APP_COLORS.textSecondary,
    letterSpacing: 2,
  },
  addCardButton: {
    backgroundColor: APP_COLORS.success,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  disabledButton: {
    backgroundColor: APP_COLORS.textSecondary,
    opacity: 0.5,
  },
  addCardButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: APP_COLORS.textSecondary,
    backgroundColor: APP_COLORS.surface,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  signInButton: {
    backgroundColor: '#0078D4', // Microsoft blue
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfoBox: {
    backgroundColor: APP_COLORS.surface,
    borderWidth: 2,
    borderColor: APP_COLORS.success,
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  userInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_COLORS.success,
    marginBottom: 5,
  },
  userInfoEmail: {
    fontSize: 16,
    fontWeight: '500',
    color: APP_COLORS.text,
  },
  userInfoName: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    marginTop: 3,
  },
  signOutButton: {
    backgroundColor: APP_COLORS.border,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  signOutButtonText: {
    color: APP_COLORS.text,
    fontSize: 14,
    fontWeight: '500',
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
