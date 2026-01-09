/**
 * OneDrive Personal Integration using Microsoft Graph API
 * 
 * Setup Instructions:
 * 1. Register app at https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
 * 2. Create "Mobile and desktop application" with redirect URI: com.receiptkeeper://oauth/redirect
 * 3. Add Microsoft Graph permissions: Files.ReadWrite.All, User.Read, offline_access
 * 4. Copy Application (client) ID below
 */

import { authorize } from 'react-native-app-auth';
import { getSetting, saveSetting } from '../database/database';
import RNFS from 'react-native-fs';

// OneDrive Personal OAuth Configuration
const ONEDRIVE_CONFIG = {
  clientId: '13f7d33b-7bc3-4e73-8c88-73c35c5f5303',
  redirectUrl: 'com.receiptkeeper://oauth/redirect',
  scopes: ['Files.ReadWrite.All', 'User.Read', 'offline_access'],
  serviceConfiguration: {
    authorizationEndpoint: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
  },
  additionalParameters: {
    prompt: 'select_account',
  },
};

/**
 * Authenticate with OneDrive Personal using OAuth 2.0 PKCE
 */
export const authenticateOneDrive = async () => {
  try {
    const result = await authorize(ONEDRIVE_CONFIG);
    
    // Save tokens
    await saveSetting('onedrive_access_token', result.accessToken);
    await saveSetting('onedrive_refresh_token', result.refreshToken);
    await saveSetting('onedrive_token_expiry', result.accessTokenExpirationDate);
    
    // Get user info
    const userInfo = await getUserInfo(result.accessToken);
    await saveSetting('onedrive_user_email', userInfo.userPrincipalName);
    await saveSetting('onedrive_user_name', userInfo.displayName);
    
    return {
      success: true,
      email: userInfo.userPrincipalName,
      name: userInfo.displayName,
    };
  } catch (error) {
    console.error('OneDrive authentication error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Check if authenticated and token is valid
 */
export const isAuthenticated = async () => {
  const accessToken = await getSetting('onedrive_access_token');
  const expiry = await getSetting('onedrive_token_expiry');
  
  if (!accessToken || !expiry) {
    return false;
  }
  
  // Check if token expired
  const now = new Date().toISOString();
  if (now > expiry) {
    // Token expired - need to refresh or re-auth
    return false;
  }
  
  return true;
};

/**
 * Get valid access token (refresh if needed)
 */
const getAccessToken = async () => {
  const accessToken = await getSetting('onedrive_access_token');
  const expiry = await getSetting('onedrive_token_expiry');
  
  if (!accessToken) {
    throw new Error('Not authenticated with OneDrive');
  }
  
  // Check if token expired
  const now = new Date().toISOString();
  if (now > expiry) {
    // TODO: Implement token refresh
    throw new Error('Token expired - please re-authenticate');
  }
  
  return accessToken;
};

/**
 * Get authenticated user info
 */
const getUserInfo = async (accessToken) => {
  const response = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user info');
  }
  
  return response.json();
};

/**
 * Get OneDrive user info
 */
export const getOneDriveUserInfo = async () => {
  const email = await getSetting('onedrive_user_email');
  const name = await getSetting('onedrive_user_name');
  
  return { email, name };
};

/**
 * Sign out from OneDrive
 */
export const signOutOneDrive = async () => {
  await saveSetting('onedrive_access_token', null);
  await saveSetting('onedrive_refresh_token', null);
  await saveSetting('onedrive_token_expiry', null);
  await saveSetting('onedrive_user_email', null);
  await saveSetting('onedrive_user_name', null);
};

/**
 * Browse OneDrive folders
 */
export const browseFolders = async (folderId = 'root') => {
  try {
    const accessToken = await getAccessToken();
    
    const url = folderId === 'root'
      ? 'https://graph.microsoft.com/v1.0/me/drive/root/children'
      : `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to browse folders');
    }
    
    const data = await response.json();
    
    // Filter to only folders
    const folders = data.value.filter(item => item.folder);
    
    return folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      path: folder.parentReference.path + '/' + folder.name,
    }));
  } catch (error) {
    console.error('Browse folders error:', error);
    throw error;
  }
};

/**
 * Get folder by path
 */
export const getFolderByPath = async (path) => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:${path}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Folder doesn't exist
      }
      throw new Error('Failed to get folder');
    }
    
    return response.json();
  } catch (error) {
    console.error('Get folder error:', error);
    throw error;
  }
};

/**
 * Create folder on OneDrive
 */
export const createFolder = async (parentId, folderName) => {
  try {
    const accessToken = await getAccessToken();
    
    const url = parentId === 'root'
      ? 'https://graph.microsoft.com/v1.0/me/drive/root/children'
      : `https://graph.microsoft.com/v1.0/me/drive/items/${parentId}/children`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'fail',
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create folder');
    }
    
    return response.json();
  } catch (error) {
    console.error('Create folder error:', error);
    throw error;
  }
};

/**
 * Upload file to OneDrive
 */
export const uploadToOneDrive = async (localFilePath, remotePath) => {
  try {
    const accessToken = await getAccessToken();
    
    // Get base path from settings
    const basePath = await getOneDriveBasePath();
    const fullPath = `${basePath}${remotePath}`;
    
    console.log(`Uploading to OneDrive: ${fullPath}`);
    
    // Read file as base64
    const fileData = await RNFS.readFile(localFilePath, 'base64');
    
    // For React Native, we need to convert base64 to blob/array buffer
    // Using fetch with base64 data URL
    const base64Response = await fetch(`data:image/jpeg;base64,${fileData}`);
    const blob = await base64Response.blob();
    
    // Upload using simple upload (< 4MB)
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:${fullPath}:/content`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'image/jpeg',
        },
        body: blob,
      }
    );
    
    console.log(`Upload response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload error response:', errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Upload successful:', result.id);
    
    return {
      success: true,
      path: fullPath,
      id: result.id,
      webUrl: result.webUrl,
    };
  } catch (error) {
    console.error('OneDrive upload error:', error);
    throw error;
  }
};

/**
 * Get or set OneDrive base path
 */
export const getOneDriveBasePath = async () => {
  const basePath = await getSetting('onedrive_base_path');
  return basePath || '/Receipts';
};

export const setOneDriveBasePath = async (path) => {
  await saveSetting('onedrive_base_path', path);
};

/**
 * Build OneDrive path from date components
 */
export const buildOneDrivePath = (year, month, filename) => {
  return `/${year}/${month}/${filename}`;
};
