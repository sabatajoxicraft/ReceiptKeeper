# Receipt Keeper - Setup & Usage Guide

## 📋 What You Have

A complete React Native app for organizing bookkeeping receipts with:
- **Point-and-shoot** receipt capture
- **Automatic organization** by date (YYYY/MM/DD-HHMMSS.jpg)
- **Payment tracking** (Cash, Card 1, Card 2, Card 3)
- **OneDrive sync** (requires Azure setup - optional)
- **Local storage** with SQLite database
- **Success notifications** showing file location

## 🚀 Next Steps to Run the App

### 1. Build the APK

The app will automatically build via GitHub Actions. To trigger:

```bash
cd /home/sabata/development/ReceiptKeeper
git push  # Already done!
```

Wait 5-10 minutes, then download APK from:
- GitHub → Actions tab → Latest workflow run → Download artifact

**OR build locally (if you have Android SDK):**

```bash
cd android
./gradlew assembleDebug
# APK at: android/app/build/outputs/apk/debug/app-debug.apk
```

### 2. Install on Your Phone

```bash
# Copy APK to phone storage
cp android/app/build/outputs/apk/debug/app-debug.apk /sdcard/Download/

# Or use GitHub CLI to download from Actions
gh run download <run-id> --name app-debug
```

Then install the APK on your phone.

### 3. First-Time Setup

When you open the app:

1. **OneDrive Folder**: Enter `/Receipts` (or your preference)
2. **Card Names**: Customize the 3 payment cards:
   - Card 1: "Business Visa"
   - Card 2: "Personal MasterCard"
   - Card 3: "Amex"
3. Tap **Save & Continue**

### 4. Daily Usage

**Capture a receipt:**
1. Tap "📸 Capture Receipt"
2. Take photo (or choose from gallery)
3. Select payment method:
   - 💵 Cash
   - 💳 Business Visa
   - 💳 Personal MasterCard
   - 💳 Amex
4. Done! Success message shows file location

**View history:**
- Main screen shows all receipts
- Pull down to refresh
- See payment method and path for each

## 📁 File Organization

Receipts are saved locally at:
```
/data/data/com.receiptkeeper/files/receipts/
└── 2026/
    └── 01/
        ├── 08-112543.jpg
        ├── 08-112543.json
        ├── 08-143022.jpg
        └── 08-143022.json
```

**Metadata JSON example:**
```json
{
  "filename": "08-143022.jpg",
  "captureDate": "2026-01-08T14:30:22.000Z",
  "paymentMethod": "card",
  "cardName": "Business Visa",
  "year": "2026",
  "month": "01"
}
```

## ☁️ OneDrive Integration (Optional)

Currently, the app is configured to **save locally only**. OneDrive sync is prepared but requires:

### To Enable OneDrive Sync:

1. **Register in Azure Portal:**
   - Go to https://portal.azure.com
   - Create App Registration
   - Get Client ID
   - Configure redirect URI: `msalYOUR_CLIENT_ID://auth`

2. **Install MSAL:**
   ```bash
   npm install @react-native-community/msal
   ```

3. **Update configuration:**
   Edit `src/services/onedriveService.js`:
   ```javascript
   const ONEDRIVE_CONFIG = {
     clientId: 'YOUR_AZURE_CLIENT_ID',
     redirectUri: 'msalYOUR_CLIENT_ID://auth',
     scopes: ['Files.ReadWrite', 'User.Read'],
   };
   ```

4. **Implement authentication:**
   Uncomment the MSAL code in `onedriveService.js`

**Without OneDrive:** Receipts save locally and your accountant can access them via USB or cloud backup manually.

## 🔧 Configuration Changes

To modify settings after setup:
1. Tap ⚙️ icon on main screen
2. Update OneDrive folder or card names
3. Save changes

## 📊 For Your Accountant

Share with your accountant:
- Receipts are organized by Year → Month → Day-Time.jpg
- Each receipt has a JSON metadata file
- Metadata includes: date, payment method, card name
- Easy to import into accounting software

**File naming:** `DD-HHMMSS.jpg`
- DD = day of month
- HH = hour (24-hour)
- MM = minute
- SS = second

Example: `08-143022.jpg` = 8th day at 2:30:22 PM

## 🐛 Troubleshooting

**Camera not working?**
- Check permissions in Android settings
- Enable Camera permission for Receipt Keeper

**Can't save files?**
- Enable Storage permission in Android settings

**App crashes on capture?**
- Check logcat: `adb logcat | grep ReactNative`
- Ensure all dependencies installed: `npm install`

**Want to test without building?**
- Use React Native Debugger
- Run: `npm start` then `npm run android`

## 📝 Database Location

SQLite database: `/data/data/com.receiptkeeper/databases/ReceiptKeeper.db`

Tables:
- **receipts**: All receipt metadata
- **settings**: App configuration

## 🎯 Quick Reference

| Action | Steps |
|--------|-------|
| Capture | Tap 📸 → Photo → Payment method |
| View history | Main screen, pull to refresh |
| Settings | Tap ⚙️ icon |
| File location | Shows in success toast |

## 🔄 Future Enhancements

Possible additions:
- OCR to auto-detect amounts
- PDF export for monthly summaries
- Multi-currency support
- Receipt categories (fuel, meals, office)
- Export to Excel/CSV
- Backup to Google Drive option

## 📞 Need Help?

Check GitHub issues or modify the code as needed. The codebase is clean and well-structured for easy customization.

---

**Happy bookkeeping! 📱💼**
