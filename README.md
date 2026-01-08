# React Native Android Template 📱

A production-ready React Native Android template with SQLite database, GitHub Actions CI/CD, and optimized for building from Termux on Android devices.

## ✨ Features

- **React Native 0.73.6** - Latest stable version
- **SQLite Database** - Local data persistence with `react-native-sqlite-storage`
- **GitHub Actions CI/CD** - Automated APK builds on every push
- **Termux Compatible** - Build and manage from your Android phone
- **Hermes Engine** - Fast JavaScript execution
- **No Expo Required** - Pure React Native (bare workflow)

## 🚀 Quick Start

### Use This Template

1. Click **"Use this template"** button above
2. Create your new repository
3. Clone it to your device
4. Customize the app

### Local Development

```bash
# Install dependencies
npm install

# Start Metro bundler (for development)
npm start

# Build debug APK (requires Android SDK or use GitHub Actions)
cd android && ./gradlew assembleDebug
```

### GitHub Actions Build

The APK is automatically built when you push to `master` branch. Download it from the Actions tab → Select latest run → Download `app-debug` artifact.

## 📁 Project Structure

```
├── App.js                 # Main React Native component
├── index.js               # App entry point
├── package.json           # Dependencies
├── android/               # Android native code
│   ├── app/
│   │   ├── build.gradle   # App build config
│   │   └── src/main/
│   │       ├── java/      # Java source files
│   │       ├── res/       # Android resources
│   │       └── AndroidManifest.xml
│   ├── build.gradle       # Project build config
│   ├── settings.gradle    # Gradle settings
│   └── gradle.properties  # Gradle properties
├── patches/               # Patches for native modules
└── .github/workflows/     # CI/CD workflows
    └── build-android.yml  # APK build workflow
```

## 🔧 Customization

### Change App Name

1. Edit `android/app/src/main/res/values/strings.xml`:
   ```xml
   <string name="app_name">Your App Name</string>
   ```

2. Edit `app.json`:
   ```json
   {
     "name": "YourAppName",
     "displayName": "Your App Name"
   }
   ```

### Change Package ID

1. Update `android/app/build.gradle`:
   ```groovy
   namespace "com.yourcompany.yourapp"
   applicationId "com.yourcompany.yourapp"
   ```

2. Rename the Java package directory and update imports

### Add New Dependencies

```bash
npm install your-package
```

For native modules, patches may be needed (see `patches/` directory).

## 📱 Building from Termux

This template is optimized for building via GitHub Actions when working from Termux:

1. Make your changes locally
2. Commit and push to GitHub
3. GitHub Actions builds the APK automatically
4. Download the APK artifact

```bash
# Push changes
git add . && git commit -m "Your changes" && git push

# Trigger manual build
gh workflow run build-android.yml

# Check build status
gh run list --limit 1

# Download APK when complete
gh run download <run-id> --name app-debug
cp app-debug.apk /sdcard/Download/
```

## 🗄️ SQLite Usage

The template includes SQLite setup. Example usage:

```javascript
import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const db = await SQLite.openDatabase({
  name: 'MyApp.db',
  location: 'default',
});

// Create table
await db.executeSql(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
  )
`);

// Insert data
await db.executeSql('INSERT INTO users (name) VALUES (?)', ['John']);

// Query data
const results = await db.executeSql('SELECT * FROM users');
```

## 🔨 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.73.6 | Mobile framework |
| React | 18.2.0 | UI library |
| SQLite | 6.0.1 | Local database |
| Hermes | Enabled | JS engine |
| Gradle | 8.4 | Build system |
| JDK | 17 | Java runtime |

## 📝 License

MIT License - feel free to use this template for any project!

## 🙏 Credits

Built with ❤️ for the React Native community, especially those building from mobile devices.
