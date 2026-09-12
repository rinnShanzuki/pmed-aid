# Debug White Screen Issue

## Step 1: Check React Native Logs

Para makita ang actual error message:

### For Android:
```bash
npx react-native log-android
```

OR

```bash
adb logcat | grep -i "error\|exception\|fatal"
```

### For iOS:
```bash
npx react-native log-ios
```

## Step 2: Clear Cache and Restart

```bash
# Stop everything first (Ctrl+C)

# Clear Metro bundler cache
npx react-native start --reset-cache

# In another terminal, rebuild the app
npx react-native run-android
# OR
npx react-native run-ios
```

## Step 3: Check Common Issues

### Issue: Cannot find module or import error
**Solution**: 
```bash
cd mobile
npm install
```

### Issue: Build error
**Solution**:
```bash
# Android
cd android
./gradlew clean
cd ..
npx react-native run-android

# iOS
cd ios
pod install
cd ..
npx react-native run-ios
```

## Step 4: Enable Remote Debugging

1. Shake device or press `Ctrl+M` (Android) / `Cmd+D` (iOS)
2. Select "Debug"
3. Open Chrome DevTools
4. Check Console for errors

## Step 5: Check Specific Files

If may syntax error, check these files:
- `mobile/src/services/api.ts`
- `mobile/src/contexts/AuthContext.tsx`
- `mobile/src/config/api.config.ts`
- `mobile/App.tsx`

## Quick Fix: Rollback Changes

If gusto mo bumalik sa working version:
```bash
git status
git checkout -- mobile/src/services/api.ts
git checkout -- mobile/src/contexts/AuthContext.tsx
```

## Most Common White Screen Causes:

1. **Import Error** - Missing or wrong import path
2. **Syntax Error** - Typo in TypeScript code
3. **Module Not Found** - Need to run `npm install`
4. **Build Cache** - Need to clear cache with `--reset-cache`
5. **Platform-specific error** - Check `Platform.OS` logic

## Get Full Error Stack:

Run this para makita ang detailed error:
```bash
npx react-native run-android --verbose
```
