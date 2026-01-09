#!/usr/bin/env node
/**
 * Post-install script to fix React Native dependencies for Gradle 8 compatibility
 * This fixes the 'implementation react-native:+' issue in various packages
 */

const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'node_modules/@react-native-async-storage/async-storage/android/build.gradle',
    search: "implementation 'com.facebook.react:react-native:+'",
    replace: 'compileOnly "com.facebook.react:react-android:0.73.6"'
  },
  {
    file: 'node_modules/@react-native-camera-roll/camera-roll/android/build.gradle',
    search: "implementation 'com.facebook.react:react-native:+'",
    replace: 'compileOnly "com.facebook.react:react-android:0.73.6"'
  },
  {
    file: 'node_modules/@react-native-community/netinfo/android/build.gradle',
    search: "implementation 'com.facebook.react:react-native:+'",
    replace: 'compileOnly "com.facebook.react:react-android:0.73.6"'
  },
  {
    file: 'node_modules/react-native-app-auth/android/build.gradle',
    search: "implementation 'com.facebook.react:react-native:+'",
    replace: 'compileOnly "com.facebook.react:react-android:0.73.6"'
  },
  {
    file: 'node_modules/react-native-background-actions/android/build.gradle',
    search: "implementation 'com.facebook.react:react-native:+'",
    replace: 'compileOnly "com.facebook.react:react-android:0.73.6"'
  },
  {
    file: 'node_modules/rn-fetch-blob/android/build.gradle',
    search: "implementation 'com.facebook.react:react-native:+'",
    replace: 'compileOnly "com.facebook.react:react-android:0.73.6"'
  },
  {
    file: 'node_modules/rn-fetch-blob/android/build.gradle',
    search: 'android {',
    replace: 'android {\n    namespace "com.RNFetchBlob"'
  }
];

console.log('Fixing React Native dependencies for Gradle 8...');

fixes.forEach(({ file, search, replace }) => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  Skipping ${file} (not found)`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Fixed ${file}`);
  } else if (content.includes(replace)) {
    console.log(`  Already fixed ${file}`);
  } else {
    console.log(`  No changes needed for ${file}`);
  }
});

console.log('Done fixing dependencies!');
