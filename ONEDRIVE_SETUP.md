# OneDrive Personal Integration Setup

This app uses Microsoft Graph API to sync receipts to your OneDrive Personal account.

## Azure AD App Registration

### Step 1: Register your app

1. Go to [Azure Portal - App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Click **"New registration"**
3. Fill in:
   - **Name**: `ReceiptKeeper` (or your preferred name)
   - **Supported account types**: Select **"Personal Microsoft accounts only"** (for OneDrive Personal)
   - **Redirect URI**: Select **"Mobile and desktop applications"** and enter:
     ```
     com.receiptkeeper://oauth/redirect
     ```
4. Click **"Register"**

### Step 2: Copy Client ID

1. After registration, you'll see the **Application (client) ID**
2. Copy this ID (it looks like: `12345678-1234-1234-1234-123456789abc`)
3. Open `src/services/onedriveService.js` in your code editor
4. Replace `'YOUR_CLIENT_ID_HERE'` with your copied Client ID:
   ```javascript
   clientId: '12345678-1234-1234-1234-123456789abc',
   ```

### Step 3: Configure API Permissions

1. In Azure Portal, click **"API permissions"** in the left menu
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Select **"Delegated permissions"**
5. Add these permissions:
   - ✅ `Files.ReadWrite.All` - Read and write files in all folders
   - ✅ `User.Read` - Sign in and read user profile
   - ✅ `offline_access` - Maintain access to data (for refresh tokens)
6. Click **"Add permissions"**
7. You don't need admin consent for these permissions (they're user-level)

### Step 4: Configure Authentication

1. Click **"Authentication"** in the left menu
2. Under **"Mobile and desktop applications"**, verify:
   - ✅ `com.receiptkeeper://oauth/redirect`
3. Under **"Advanced settings"**:
   - **Allow public client flows**: Set to **Yes**
4. Click **"Save"**

## How It Works

### Authentication Flow

1. User taps "Sign in with Microsoft" in the Setup screen
2. App opens browser to Microsoft login page
3. User signs in with their Microsoft account (personal)
4. Microsoft redirects back to app with authorization code
5. App exchanges code for access token (PKCE flow, no secret needed)
6. Access token is saved securely in SQLite database

### Folder Selection

1. After authentication, user can browse their OneDrive folders
2. User selects base folder for receipts (e.g., `/Documents/Receipts`)
3. App creates folder structure: `BasePath/YYYY/MM/DD-HHMMSS.jpg`

### File Upload

1. When user captures receipt, file is saved locally first
2. App uploads to OneDrive in background using Microsoft Graph API
3. If upload fails (no connection), file is queued for retry
4. Upload endpoint: `PUT /me/drive/root:{path}:/content`

## Testing

### Without Azure Registration (Development Mode)

The app will still work locally without Azure setup:
- ✅ Captures receipts
- ✅ Saves to device storage
- ✅ Saves metadata to database
- ❌ OneDrive sync will fail gracefully

### With Azure Registration (Production Mode)

After completing Azure setup:
- ✅ Full OneDrive authentication
- ✅ Folder browsing
- ✅ Automatic sync to OneDrive
- ✅ Background upload queue

## Security Notes

- **No client secret**: Mobile apps use PKCE flow (Proof Key for Code Exchange)
- **Tokens stored locally**: Access tokens saved in app's private SQLite database
- **Auto-refresh**: Tokens automatically refreshed when expired
- **User control**: User can sign out to revoke access at any time

## API Endpoints Used

- **Auth**: `https://login.microsoftonline.com/common/oauth2/v2.0/*`
- **User Info**: `GET https://graph.microsoft.com/v1.0/me`
- **Browse Folders**: `GET https://graph.microsoft.com/v1.0/me/drive/root/children`
- **Upload File**: `PUT https://graph.microsoft.com/v1.0/me/drive/root:{path}:/content`
- **Create Folder**: `POST https://graph.microsoft.com/v1.0/me/drive/root/children`

## Troubleshooting

### "AADSTS50011: The redirect URI specified in the request does not match"

- Check that redirect URI in Azure matches exactly: `com.receiptkeeper://oauth/redirect`
- Verify it's under "Mobile and desktop applications" (not Web)

### "AADSTS65001: The user or administrator has not consented"

- Make sure you added the correct Microsoft Graph permissions
- Try signing out and signing in again

### "Network request failed"

- Check internet connection
- Verify Client ID is correct in `onedriveService.js`
- Check Azure app is configured for "Personal Microsoft accounts only"

## Support

For issues with Azure AD setup:
- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/api/resources/onedrive)
- [Azure AD Mobile App Registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
