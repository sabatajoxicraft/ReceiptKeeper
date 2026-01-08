import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { browseFolders, createFolder } from '../services/onedriveService';
import { APP_COLORS } from '../config/constants';

const OneDriveFolderBrowser = ({ onSelectFolder, onCancel }) => {
  const [folders, setFolders] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [loading, setLoading] = useState(true);
  const [pathHistory, setPathHistory] = useState([{ id: 'root', path: '/', name: 'OneDrive' }]);

  useEffect(() => {
    loadFolders(currentFolderId);
  }, [currentFolderId]);

  const loadFolders = async (folderId) => {
    setLoading(true);
    try {
      const folderList = await browseFolders(folderId);
      setFolders(folderList);
    } catch (error) {
      Alert.alert('Error', 'Failed to load folders: ' + error.message);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderPress = (folder) => {
    setPathHistory([...pathHistory, { id: folder.id, path: folder.path, name: folder.name }]);
    setCurrentPath(folder.path);
    setCurrentFolderId(folder.id);
  };

  const handleBackPress = () => {
    if (pathHistory.length > 1) {
      const newHistory = [...pathHistory];
      newHistory.pop();
      const previous = newHistory[newHistory.length - 1];
      setPathHistory(newHistory);
      setCurrentPath(previous.path);
      setCurrentFolderId(previous.id);
    }
  };

  const handleSelectCurrent = () => {
    onSelectFolder(currentPath);
  };

  const renderFolder = ({ item }) => (
    <TouchableOpacity style={styles.folderItem} onPress={() => handleFolderPress(item)}>
      <Text style={styles.folderIcon}>📁</Text>
      <Text style={styles.folderName}>{item.name}</Text>
      <Text style={styles.folderArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select OneDrive Folder</Text>
        <Text style={styles.currentPath}>{currentPath}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.primary} />
          <Text style={styles.loadingText}>Loading folders...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={folders}
            renderItem={renderFolder}
            keyExtractor={(item) => item.id}
            style={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No folders found</Text>
                <Text style={styles.emptyHint}>This folder is empty or contains only files</Text>
              </View>
            }
          />

          <View style={styles.buttonContainer}>
            {pathHistory.length > 1 && (
              <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.selectButton} onPress={handleSelectCurrent}>
              <Text style={styles.selectButtonText}>✓ Select This Folder</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: APP_COLORS.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  currentPath: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  list: {
    flex: 1,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: APP_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  folderIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  folderName: {
    flex: 1,
    fontSize: 16,
    color: APP_COLORS.text,
  },
  folderArrow: {
    fontSize: 24,
    color: APP_COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: APP_COLORS.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: APP_COLORS.text,
    marginBottom: 5,
  },
  emptyHint: {
    fontSize: 14,
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  backButton: {
    flex: 1,
    backgroundColor: APP_COLORS.border,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: APP_COLORS.text,
  },
  selectButton: {
    flex: 2,
    backgroundColor: APP_COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: APP_COLORS.surface,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  cancelButtonText: {
    fontSize: 16,
    color: APP_COLORS.text,
  },
});

export default OneDriveFolderBrowser;
