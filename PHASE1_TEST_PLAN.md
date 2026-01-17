# Phase 1 MVP Integration Test Plan

## 🎯 Overview
Phase 1 MVP is **COMPLETE** (commit cd48463). This document provides a comprehensive manual testing checklist to ensure all features work correctly before production deployment.

---

## ✅ Feature Checklist

### 1️⃣ Home Screen (MainScreen.js)
**Status:** ✅ Implemented

**Test Cases:**
- [ ] **TC-1.1**: App launches and shows MainScreen as default
- [ ] **TC-1.2**: Receipt list displays with thumbnails (if receipts exist)
- [ ] **TC-1.3**: Empty state shows when no receipts exist
- [ ] **TC-1.4**: Pull-to-refresh updates receipt list
- [ ] **TC-1.5**: Stats show correct "Total Receipts" count
- [ ] **TC-1.6**: Stats show correct "This Month" count
- [ ] **TC-1.7**: Receipts grouped into "☁️ Needs Sync" and "✅ Synced History"
- [ ] **TC-1.8**: Thumbnail images load correctly from file paths
- [ ] **TC-1.9**: Tap receipt card opens ReceiptDetailScreen
- [ ] **TC-1.10**: Tap "📸 Capture Receipt" button navigates to CaptureScreen
- [ ] **TC-1.11**: Back button from MainScreen exits app gracefully

**Expected Results:**
- Smooth navigation
- No crashes
- Thumbnails render within 500ms
- Stats update after refresh

---

### 2️⃣ Search & Filter (SearchFilterBar.js)
**Status:** ✅ Implemented

**Test Cases:**
- [ ] **TC-2.1**: Search bar appears on MainScreen
- [ ] **TC-2.2**: Typing in search filters receipts in real-time
- [ ] **TC-2.3**: Search by merchant name works (case-insensitive)
- [ ] **TC-2.4**: Search by filename works
- [ ] **TC-2.5**: Search by invoice number works
- [ ] **TC-2.6**: Clear button (✕) clears search and shows all receipts
- [ ] **TC-2.7**: Filter button shows modal with filter options
- [ ] **TC-2.8**: Category filter: Select "All" shows all receipts
- [ ] **TC-2.9**: Category filter: Select specific category filters correctly
- [ ] **TC-2.10**: Amount range filter: Min amount works
- [ ] **TC-2.11**: Amount range filter: Max amount works
- [ ] **TC-2.12**: Amount range filter: Min + Max together works
- [ ] **TC-2.13**: Date range filter: Start date works (YYYY-MM-DD format)
- [ ] **TC-2.14**: Date range filter: End date works
- [ ] **TC-2.15**: Date range filter: Both dates together works
- [ ] **TC-2.16**: Multiple filters combine correctly (AND logic)
- [ ] **TC-2.17**: "Clear All" button resets all filters
- [ ] **TC-2.18**: Active filter count badge shows correctly (e.g., 🔧 (3))
- [ ] **TC-2.19**: Filter modal closes on "Apply Filters"
- [ ] **TC-2.20**: Filter modal closes on back gesture

**Edge Cases:**
- [ ] **TC-2.21**: Empty search returns no results gracefully
- [ ] **TC-2.22**: Special characters in search (e.g., #, $, %) work
- [ ] **TC-2.23**: Very long search query (100+ chars) doesn't crash
- [ ] **TC-2.24**: Invalid date format shows validation or ignores filter
- [ ] **TC-2.25**: Negative amounts in filter don't crash app
- [ ] **TC-2.26**: Min > Max amount filter handles gracefully

---

### 3️⃣ Category System
**Status:** ✅ Implemented (Database + UI)

**Test Cases:**
- [ ] **TC-3.1**: Database has `category` column (check with migration 001)
- [ ] **TC-3.2**: Categories available: Transport, Meals, Supplies, Services, Other, Uncategorized
- [ ] **TC-3.3**: Receipt without category shows "Uncategorized" badge
- [ ] **TC-3.4**: Category badge displays on MainScreen receipt cards
- [ ] **TC-3.5**: Category badge has correct color styling (green)
- [ ] **TC-3.6**: Open ReceiptDetailScreen → tap Edit → category picker appears
- [ ] **TC-3.7**: Category picker modal shows all 6 categories
- [ ] **TC-3.8**: Select category → picker closes → category updates
- [ ] **TC-3.9**: Save edited receipt → category persists in database
- [ ] **TC-3.10**: Return to MainScreen → category badge shows new value
- [ ] **TC-3.11**: Filter by category on MainScreen works correctly
- [ ] **TC-3.12**: PDF export shows correct category for each receipt

---

### 4️⃣ PDF Export (PDFExportModal.js)
**Status:** ✅ Implemented

**Test Cases:**
- [ ] **TC-4.1**: "📄 Export to PDF" button appears on MainScreen (if receipts exist)
- [ ] **TC-4.2**: Button hidden when no receipts exist
- [ ] **TC-4.3**: Tap button opens PDF export modal
- [ ] **TC-4.4**: Modal shows list of all receipts with checkboxes
- [ ] **TC-4.5**: "☐ Select All" button selects all receipts
- [ ] **TC-4.6**: "☑ Deselect All" button deselects all receipts
- [ ] **TC-4.7**: Tap individual receipt toggles selection
- [ ] **TC-4.8**: Selection count shows "X of Y selected"
- [ ] **TC-4.9**: Export button disabled when no receipts selected
- [ ] **TC-4.10**: Export button enabled when 1+ receipts selected
- [ ] **TC-4.11**: Tap "📄 Export (X)" generates HTML file
- [ ] **TC-4.12**: Share sheet appears with HTML file
- [ ] **TC-4.13**: HTML content includes summary table
- [ ] **TC-4.14**: HTML content includes detailed receipt pages
- [ ] **TC-4.15**: HTML shows receipt images correctly
- [ ] **TC-4.16**: HTML calculates total amount correctly
- [ ] **TC-4.17**: HTML is SARS-compliant (business name, dates, categories, totals)
- [ ] **TC-4.18**: Open HTML in browser → renders correctly
- [ ] **TC-4.19**: Print to PDF from browser works
- [ ] **TC-4.20**: Close button (✕) closes modal

**Performance Tests:**
- [ ] **TC-4.21**: Export 1 receipt: completes in < 2 seconds
- [ ] **TC-4.22**: Export 10 receipts: completes in < 5 seconds
- [ ] **TC-4.23**: Export 50 receipts: completes in < 20 seconds
- [ ] **TC-4.24**: Export with large images (5MB+) doesn't crash
- [ ] **TC-4.25**: Export doesn't block UI (loading indicator shows)

---

### 5️⃣ Receipt Detail Screen (ReceiptDetailScreen.js)
**Status:** ✅ Implemented

**Test Cases:**
- [ ] **TC-5.1**: Tap receipt on MainScreen opens detail screen
- [ ] **TC-5.2**: Receipt image displays full-screen or scrollable
- [ ] **TC-5.3**: All fields display: Merchant, Amount, Tax, Invoice#, Category, Date, Payment
- [ ] **TC-5.4**: Tap "← Back" returns to MainScreen
- [ ] **TC-5.5**: Tap "✏️ Edit" enables edit mode
- [ ] **TC-5.6**: Edit mode: All fields become editable
- [ ] **TC-5.7**: Edit mode: Category shows picker button
- [ ] **TC-5.8**: Edit mode: Delete button appears
- [ ] **TC-5.9**: Modify fields → tap "💾 Save" → success message
- [ ] **TC-5.10**: Return to MainScreen → changes reflected
- [ ] **TC-5.11**: Delete button shows confirmation dialog
- [ ] **TC-5.12**: Confirm delete → receipt removed from database
- [ ] **TC-5.13**: After delete → returns to MainScreen
- [ ] **TC-5.14**: Receipt not in list after delete

---

### 6️⃣ Navigation & Integration
**Status:** ⚠️ Needs Testing

**Test Cases:**
- [ ] **TC-6.1**: App launches → MainScreen shows
- [ ] **TC-6.2**: MainScreen → CaptureScreen → capture photo → ReceiptPreviewScreen
- [ ] **TC-6.3**: ReceiptPreviewScreen → save → returns to MainScreen
- [ ] **TC-6.4**: MainScreen → ReceiptDetailScreen → back → MainScreen
- [ ] **TC-6.5**: MainScreen → Settings → back → MainScreen
- [ ] **TC-6.6**: MainScreen → Logs → back → MainScreen
- [ ] **TC-6.7**: Android back button works on all screens
- [ ] **TC-6.8**: No screen shows "undefined" or null errors
- [ ] **TC-6.9**: Screen transitions smooth (no white flashes)
- [ ] **TC-6.10**: State persists across navigation (e.g., filters stay active)

---

### 7️⃣ Database Integration
**Status:** ⚠️ Needs Testing

**Test Cases:**
- [ ] **TC-7.1**: Migration 001 runs on first launch
- [ ] **TC-7.2**: Database has all required columns (vendor_name, total_amount, category, etc.)
- [ ] **TC-7.3**: Save receipt → data persists after app restart
- [ ] **TC-7.4**: Update receipt → changes persisted
- [ ] **TC-7.5**: Delete receipt → record removed from database
- [ ] **TC-7.6**: Query with filters returns correct results
- [ ] **TC-7.7**: No SQL injection vulnerabilities (test with quotes in vendor name)
- [ ] **TC-7.8**: Database handles 100+ receipts without lag

---

### 8️⃣ Memory & Performance
**Status:** ⚠️ Needs Testing

**Test Cases:**
- [ ] **TC-8.1**: App uses < 200MB RAM with 50 receipts
- [ ] **TC-8.2**: No memory leaks after 10 navigation cycles
- [ ] **TC-8.3**: Image thumbnails load within 500ms
- [ ] **TC-8.4**: Search filtering updates within 200ms
- [ ] **TC-8.5**: PDF export with 10 receipts completes < 5 seconds
- [ ] **TC-8.6**: App doesn't crash after 1 hour continuous use
- [ ] **TC-8.7**: Background/foreground cycle preserves state
- [ ] **TC-8.8**: No ANR (App Not Responding) errors during normal use

---

### 9️⃣ Regression Tests (Existing Features)
**Status:** ⚠️ Critical

**Test Cases:**
- [ ] **TC-9.1**: Camera still works (capture photo)
- [ ] **TC-9.2**: OCR still extracts text from receipts
- [ ] **TC-9.3**: OCR confidence score calculated
- [ ] **TC-9.4**: Receipt preview screen shows extracted data
- [ ] **TC-9.5**: Edit receipt fields on preview screen works
- [ ] **TC-9.6**: Save receipt to database works
- [ ] **TC-9.7**: OneDrive sync still works (if configured)
- [ ] **TC-9.8**: Settings screen accessible
- [ ] **TC-9.9**: Log viewer accessible
- [ ] **TC-9.10**: Animated splash screen shows on launch

---

## 🐛 Known Issues (To Fix)
- [ ] None identified yet - requires testing

---

## 📋 Test Execution Log

### Test Session 1: [DATE]
**Tester:** [NAME]  
**Device:** [MODEL]  
**Android Version:** [VERSION]  
**App Version:** [VERSION]

**Results:**
- Tests Passed: X / Y
- Tests Failed: X / Y
- Critical Issues: X
- Minor Issues: X

**Notes:**
[Add notes here]

---

## 🚀 Pre-Release Checklist
- [ ] All critical test cases (TC-X.1) passed
- [ ] No crashes during 30-minute stress test
- [ ] Database migrations run successfully
- [ ] PDF export tested with 1, 10, 50 receipts
- [ ] Memory usage acceptable (< 200MB)
- [ ] Search/filter tested with edge cases
- [ ] Category system fully functional
- [ ] Navigation flows smooth
- [ ] Back button handling correct on all screens
- [ ] Code committed with descriptive message
- [ ] APK built successfully via GitHub Actions
- [ ] APK tested on physical device

---

## 📝 Test Execution Instructions

### Setup
1. Build fresh APK: `git push` → wait for GitHub Actions
2. Download APK: `gh run download --name ReceiptKeeper.apk`
3. Install on device: `adb install ReceiptKeeper.apk`
4. Clear app data: Settings → Apps → ReceiptKeeper → Clear Data

### Test Execution
1. Follow test cases sequentially
2. Mark ✅ passed, ❌ failed, ⚠️ partial
3. Document failures with screenshots
4. Note device/Android version for failures

### Bug Reporting
For each bug found:
- **ID:** BUG-XXX
- **Severity:** Critical / Major / Minor
- **Test Case:** TC-X.Y
- **Steps to Reproduce:** [1, 2, 3...]
- **Expected:** [What should happen]
- **Actual:** [What actually happened]
- **Device:** [Model + Android version]
- **Screenshot/Log:** [Attach if possible]

---

## ✅ Sign-Off

**Developer:** COMPLETE - All features implemented  
**QA Tester:** [ ] PENDING - Awaiting test execution  
**Product Owner:** [ ] PENDING - Awaiting approval  

**Ready for Production:** [ ] YES / [ ] NO

---

**Last Updated:** 2026-01-17  
**Document Version:** 1.0  
**App Commit:** cd48463
