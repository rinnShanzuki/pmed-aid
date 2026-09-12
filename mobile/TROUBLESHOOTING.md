# PMed-Aid Mobile - Troubleshooting Guide

## "Access denied. Please log in" Error (401)

Kung nakikita mo ang error na "Access denied. Please log in", ito ang mga possible causes:

### 1. **Expired or Invalid Token**
- **Solution**: Mag-logout at mag-login ulit
- Token expiration: 24 hours (default)

### 2. **Backend Not Running**
- **Check**: Siguraduhin na running ang backend server
```bash
cd backend
npm run dev
```
- Should see: "Server running on port 5000"

### 3. **Wrong API URL Configuration**

#### For Android Emulator:
- Default: `http://10.0.2.2:5000/api` ✓
- This maps to `localhost` on your computer

#### For iOS Simulator:
- Default: `http://localhost:5000/api` ✓

#### For Real Device (Android or iOS):
**KAILANGAN MO I-UPDATE ANG CONFIG!**

1. Find your computer's local IP address:
   - **Windows**: Open CMD and run `ipconfig`
     - Look for "IPv4 Address" (e.g., 192.168.1.100)
   - **Mac/Linux**: Run `ifconfig` or `ip addr`
     - Look for inet address (e.g., 192.168.1.100)

2. Update `mobile/src/config/api.config.ts`:
   ```typescript
   export const API_CONFIG = {
     LOCAL_IP: '192.168.1.100', // <-- YOUR COMPUTER'S IP
     PORT: '5000',
   };
   ```

3. Uncomment the appropriate line:
   - **Android device**: Line 38
   - **iOS device**: Line 44

4. Make sure:
   - Device and computer are on the SAME Wi-Fi network
   - Firewall allows connections to port 5000

### 4. **Database or Backend Issues**
- Check if MySQL is running
- Check if `.env` file is configured correctly
- Run migrations: `npm run migrate`

## Quick Diagnostic Steps

1. **Check Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Test Backend Manually**:
   Open browser/Postman: `http://localhost:5000/api/health`
   Should return: `{ "success": true }`

3. **Clear App Data** (if needed):
   - Android: Settings > Apps > PMed-Aid > Clear Data
   - iOS: Delete and reinstall app

4. **Check Logs**:
   ```bash
   # React Native
   npx react-native log-android  # for Android
   npx react-native log-ios      # for iOS
   ```

## Common Solutions Summary

| Problem | Solution |
|---------|----------|
| 401 Error | Re-login or check token |
| Connection Error | Check backend is running |
| Timeout | Check API URL is correct |
| Can't connect from real device | Update LOCAL_IP in config |

## Still Not Working?

1. Restart everything:
   ```bash
   # Kill backend
   # Kill Metro bundler
   # Restart app
   cd mobile
   npm start -- --reset-cache
   ```

2. Check this file for your API URL:
   - `mobile/src/config/api.config.ts`

3. Enable detailed logging in:
   - `mobile/src/services/api.ts`
