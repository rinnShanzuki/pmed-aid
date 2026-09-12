# How to Rebuild the App After Adding Drawer Navigation

The error you're seeing is because `react-native-gesture-handler` requires native code changes. You need to rebuild the entire app.

## Steps to Fix:

### 1. Stop the current Metro bundler (if running)
Already done ✅

### 2. Clean the Android build
```bash
cd android
./gradlew clean
cd ..
```

### 3. Uninstall the app from your device/emulator
- Manually uninstall the app from your phone/emulator
- Or run: `adb uninstall com.pmedaid` (replace with your package name)

### 4. Rebuild and run the app
```bash
npx react-native run-android
```

This will:
- Compile the native code with gesture-handler
- Install the new APK
- Start the app

## Alternative: If you're still getting errors

### Clear everything and start fresh:
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules
npm install

# Clear Metro cache
npx react-native start --reset-cache

# In another terminal, clean and rebuild
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## What Changed:
- ✅ Added `react-native-gesture-handler` import to `index.js` (FIRST LINE)
- ✅ Added reanimated plugin to `babel.config.js`
- ✅ Created drawer navigation for patient screens
- ✅ Removed bottom tabs

## After Rebuild:
You should see:
- Hamburger menu icon (☰) in the top-left
- Patient profile in drawer
- Menu items with icons
- Logout button
- No more bottom navigation

**IMPORTANT:** You MUST rebuild the native app. Just reloading (R + R) won't work because we added native dependencies.
