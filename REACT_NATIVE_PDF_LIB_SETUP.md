# React Native PDF Lib Installation & Configuration

## Installation Status

**Package Version**: react-native-pdf-lib@1.0.0 (already listed in package.json)

### Current Issue
The npm installation process encounters persistent memory corruption issues in the Termux environment ("double free or corruption (out)"), which is a known limitation of the ARM-based build environment. However, the package is already declared in package.json and partially installed.

### Workaround for Termux
If installation completes on the host machine or in a different build environment, the node_modules will properly sync. For now, the dependency is declared and ready.

---

## Required Android Configuration

The following changes are REQUIRED for react-native-pdf-lib to work properly on Android:

### 1. Enable Jumbo Mode in `android/app/build.gradle`

Add the following configuration inside the `android { }` block:

```gradle
android {
    ndkVersion rootProject.ext.ndkVersion
    buildToolsVersion rootProject.ext.buildToolsVersion
    compileSdk rootProject.ext.compileSdkVersion
    
    // ADD THIS SECTION:
    dexOptions {
        jumboMode = true
    }
    
    namespace "com.receiptkeeper"
    // ... rest of configuration
}
```

**Why**: react-native-pdf-lib (via PdfBox-Android) uses many methods that exceed the default 64K method reference limit. Jumbo Mode allows up to 2 billion method references.

### 2. Verify Android Permissions (Already Present)

Your `AndroidManifest.xml` already has the required permissions:
- ✅ `WRITE_EXTERNAL_STORAGE` - For saving PDFs
- ✅ `READ_EXTERNAL_STORAGE` - For reading source files
- ✅ `READ_MEDIA_IMAGES` - For Android 13+ media access

No additional permissions needed.

### 3. Target API Level

- **Minimum SDK**: API 18 (minSdkVersion) - ✅ Supported
- **Recommended**: API 21+ for best compatibility
- **Current**: Check `rootProject.ext.compileSdkVersion` in `android/build.gradle`

---

## Library Details

**Name**: react-native-pdf-lib  
**Version**: 1.0.0  
**Author**: Andrew Dillon  
**License**: Apache-2.0  
**Repository**: https://github.com/Hopding/react-native-pdf-lib  

### Dependencies Used
- **iOS**: PDF-Writer (Hummus library)
- **Android**: PdfBox-Android (TomRoush)

### Supported Features
- ✅ Create new PDF documents
- ✅ Edit existing PDF documents
- ✅ Add text with custom colors and positioning
- ✅ Add rectangles and shapes
- ✅ Add JPG and PNG images
- ✅ Get system documents directory
- ✅ Read/write files to app's private directory

### Supported Platforms
- ✅ Android API 18+
- ✅ iOS 8.0+

---

## Usage Example

```javascript
import PDFLib, { PDFDocument, PDFPage } from 'react-native-pdf-lib';

// Create a PDF page with text
const page = PDFPage
  .create()
  .setMediaBox(200, 200)
  .drawText('Hello PDF!', {
    x: 10,
    y: 100,
    color: '#000000',
  });

// Save the PDF
const docsDir = await PDFLib.getDocumentsDirectory();
const pdfPath = `${docsDir}/sample.pdf`;
PDFDocument
  .create(pdfPath)
  .addPages(page)
  .write()
  .then(path => {
    console.log('PDF created at: ' + path);
  })
  .catch(error => {
    console.error('PDF creation failed: ', error);
  });
```

---

## Next Steps for Android Build

1. **Add dexOptions configuration** to `android/app/build.gradle`
2. **Rebuild Android app** with: `npm run android`
3. **Test PDF generation** by calling the methods in your app
4. If jumboMode still shows errors, try:
   - Increasing `dexOptions.maxProcessArguments`
   - Using proguard/R8 with proper configuration
   - Updating Android Gradle Plugin version

---

## Troubleshooting

### Method Reference Error
If you see: `Unable to get method id from...` or `D8 cannot fit method... in one dex file`
- ✅ You've added `dexOptions.jumboMode = true`? Rebuild with: `cd android && ./gradlew clean`
- Check that the gradle plugin version is compatible (usually 4.x or newer)

### Out of Memory During Build
- Increase Gradle heap: Add to `android/gradle.properties`: `org.gradle.jvmargs=-Xmx4096m`

### PDF Not Saving
- Verify `WRITE_EXTERNAL_STORAGE` permission is granted at runtime (Android 6.0+)
- Check that app has access to documents directory
- Ensure file path is writable

