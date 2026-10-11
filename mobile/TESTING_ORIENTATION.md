# Testing Orientation & Responsive Design

This guide provides comprehensive instructions for testing the responsive design and orientation handling across the PMED-AID mobile app.

## Quick Start Testing

### Setup
1. Install dependencies: `npm install` or `npm install expo-screen-orientation@^7.0.0`
2. Start the app: `npm start`
3. Open in Expo Go (phone) or emulator

### Test Checklist

#### ✅ Auth Screen (Portrait-Only)
1. **Portrait Mode**
   - [ ] Login form displays properly with good spacing
   - [ ] All input fields are accessible
   - [ ] Button is clickable and visible
   - [ ] Text is readable
   - [ ] Try to rotate device → Should stay in portrait

2. **Orientation Lock Verification**
   - [ ] Rotate device to landscape
   - [ ] Screen should NOT rotate (stays portrait)
   - [ ] Device accelerometer is working (check system settings)

3. **Keyboard Interaction**
   - [ ] Tap email input → Keyboard appears
   - [ ] Content shifts up appropriately
   - [ ] No content is hidden behind keyboard
   - [ ] Dismiss keyboard works smoothly

#### ✅ Register Screen (Portrait-Only)
1. **Portrait Mode**
   - [ ] All form fields visible on screen
   - [ ] Form fields have proper spacing
   - [ ] Sign Up button is accessible
   - [ ] Navigation link to Login works

2. **Orientation Lock**
   - [ ] Screen remains in portrait when device rotates
   - [ ] Lock works same as Auth screen

#### ✅ Patient Dashboard (Portrait & Landscape)
1. **Portrait Mode**
   - [ ] Greeting section displays
   - [ ] Stats cards stack vertically
   - [ ] Each stat card shows icon, number, and label
   - [ ] Two cards below: Adherence Progress and Upcoming Reminders
   - [ ] Cards stack vertically (one above other)
   - [ ] Circular progress shows correctly
   - [ ] Reminder items list properly
   - [ ] Scrolling works smoothly

2. **Landscape Mode**
   - [ ] Rotate device to landscape
   - [ ] Screen rotates smoothly
   - [ ] Stats cards layout adjusts (shows more columns)
   - [ ] Adherence Progress and Reminders appear side-by-side
   - [ ] Content is not cut off
   - [ ] Scrolling still works if needed
   - [ ] Text is readable and not cramped
   - [ ] Circular progress is appropriately sized

3. **Transition Testing**
   - [ ] Rotate from portrait → landscape → portrait
   - [ ] Layout smoothly transitions each time
   - [ ] No data loss during rotation
   - [ ] No console errors

4. **Responsive Spacing**
   - [ ] Compare padding in portrait vs landscape
   - [ ] Landscape padding should be slightly reduced
   - [ ] Text sizes scale appropriately

## Detailed Test Scenarios

### Scenario 1: New User Flow
**Device:** iPhone or Android phone
**Expected:** Portrait-only experience

```
1. Open App
   → See loading screen
   → App transitions to Auth screen
   
2. Auth Screen - Portrait
   → Verify form is centered
   → Verify all fields visible
   → Try landscape rotation → Should NOT rotate
   
3. Tap Register Link
   → Navigate to Register screen
   → Register form should display
   → Try landscape rotation → Should NOT rotate
   
4. Complete Registration
   → On success, navigate back to Auth
   → Verify smooth transition
```

### Scenario 2: Dashboard Orientation Testing
**Device:** iPad or tablet emulator
**Expected:** Responsive layout changes

```
1. Login Successfully
   → Navigate to Patient Dashboard
   
2. Portrait Mode
   → Verify stacked layout
   → Cards should be full-width
   → Scrollable if needed
   
3. Rotate to Landscape
   → Stats cards adjust columns
   → Adherence & Reminders side-by-side
   → Verify no overflow
   
4. Rotate Back to Portrait
   → Layout returns to stacked view
   → Data preserved
   
5. Rapid Rotation Test
   → Rotate multiple times quickly
   → App should handle smoothly
   → No visual glitches or errors
```

### Scenario 3: Device Sizes
**Test on multiple screen sizes**

#### Small Phone (iPhone SE - 375x667)
- [ ] All content fits without excessive scrolling
- [ ] Text is readable
- [ ] Buttons are tappable (min 44x44 points)
- [ ] No horizontal scroll needed

#### Medium Phone (iPhone 12 - 390x844)
- [ ] Content layout looks good
- [ ] Proportions are balanced
- [ ] Stats cards display properly

#### Large Phone (iPhone 14 Pro Max - 430x932)
- [ ] Content isn't overstretched
- [ ] Proportions maintain
- [ ] Text doesn't become too large

#### Tablet (iPad Pro - 1024x1366)
- [ ] Dashboard shows side-by-side layout naturally
- [ ] Stats grid shows multiple columns
- [ ] Adequate whitespace
- [ ] Content doesn't feel cramped

## Platform-Specific Testing

### iOS Testing

#### In iOS Simulator:
```
1. Hardware → Rotate Left/Right
   - Triggers rotation simulation
   - UI should update immediately

2. Settings → Accessibility → Motion
   - Enable/disable motion sensitivity
   - Test forced orientations work

3. Device Rotation Lock
   - Swipe down from top → Control Center
   - Toggle Portrait Orientation Lock
   - Should work with app's orientation config
```

#### On Real iPhone:
```
1. Settings → Display & Brightness
   - Check "Lock Rotation" toggle
   - Should respect app's orientation settings

2. Accessibility → Motion
   - Adjust motion sensitivity if needed

3. Physical rotation
   - Rotate device in all directions
   - App should only rotate when permitted
```

### Android Testing

#### In Android Emulator:
```
1. Extended Controls (Virtual Sensor)
   - Use rotate buttons (← →)
   - Rotate 90, 180, 270 degrees

2. Keyboard Shortcut:
   - Ctrl + Right Arrow: Rotate right
   - Ctrl + Left Arrow: Rotate left

3. Auto-Rotation Settings:
   - Extended Controls → Settings
   - Enable "Auto-rotate"
```

#### On Real Android Device:
```
1. Settings → Display → Screen timeout
   - Ensure screen stays on during testing

2. Settings → Accessibility → Visibility
   - Check font scale settings
   - Test with different text sizes

3. Physical rotation:
   - Rotate device
   - Check accelerometer works
   - App should rotate only when permitted
```

## Testing Tools & Commands

### Expo Go Testing

**Mac/Linux:**
```bash
# Clear cache and restart
npm start -- --clear

# Specific platform
npm start -- --ios
npm start -- --android
npm start -- --web

# With logging
npm start -- --verbose
```

**Windows (PowerShell):**
```powershell
# Clear cache
npm start -- --clear

# Specific platform
npm start -- --android
npm start -- --web
```

### Console Debugging

When testing, check console for orientation messages:

```typescript
// These messages should appear in console
"Orientation changed to: LANDSCAPE"
"Orientation changed to: PORTRAIT_UP"
```

**View Console in Expo:**
1. Open app in Expo Go
2. Shake device (or Cmd+M on iOS Simulator, Ctrl+M on Android Emulator)
3. Select "View Console"
4. Check for orientation logs

### React Native Debugger

For advanced testing:
```bash
# Install React Native Debugger
# https://github.com/jhen0409/react-native-debugger

# Open app with debugger enabled
npm start
# Shake phone → select "Open Debugger"
```

## Automated Test Checklist

### Visual Tests
- [ ] No text overflow in any orientation
- [ ] Buttons are always tappable (min 44x44 points)
- [ ] No horizontal scrolling on phone
- [ ] Consistent spacing across screens
- [ ] Icons scale appropriately
- [ ] Cards don't get too wide (max 600px recommended)

### Layout Tests
- [ ] Portrait: Single column layout
- [ ] Landscape: Multi-column where applicable
- [ ] Auth screens: Portrait-only (no rotation)
- [ ] Dashboard: Responds to rotation
- [ ] Smooth transitions between orientations
- [ ] No content loss during rotation

### Content Tests
- [ ] Text is readable at all sizes
- [ ] Font sizes scale with screen width
- [ ] Spacing adjusts based on screen size
- [ ] Forms are usable in all orientations
- [ ] Lists scroll smoothly

### Performance Tests
- [ ] No lag during rotation
- [ ] Smooth animation transitions
- [ ] No memory leaks (test for 10+ rotations)
- [ ] Console clear of errors and warnings

## Expected Results by Screen

### Auth Screen
```
PORTRAIT (Required)
├─ Logo/Title: Centered at top
├─ Form: Centered with responsive spacing
├─ Inputs: Full width with padding
├─ Button: Full width, tappable
└─ Links: Centered below

LANDSCAPE (Blocked)
└─ Should NOT rotate (stays portrait)
```

### Register Screen
```
PORTRAIT (Required)
├─ Title: Centered
├─ Form Fields: Stacked vertically
├─ Spacing: Responsive padding
├─ Button: Full width
└─ Navigation: Centered

LANDSCAPE (Blocked)
└─ Should NOT rotate (stays portrait)
```

### Patient Dashboard
```
PORTRAIT
├─ Greeting: Full width
├─ Stats: Responsive grid (1-2 columns)
├─ Adherence: Full width card
├─ Reminders: Full width card
└─ Scroll: Vertical scrolling available

LANDSCAPE
├─ Greeting: Full width, reduced vertical padding
├─ Stats: 2-3 columns based on width
├─ Content: Side-by-side layout
│  ├─ Adherence: 50% width
│  └─ Reminders: 50% width
└─ Optimized for landscape viewing
```

## Common Issues & Troubleshooting

### Issue: Screen doesn't rotate
**Possible Causes:**
- Device orientation lock enabled (check phone settings)
- `useOrientation()` hook not called or wrong config
- Expo cache needs clearing

**Solution:**
```bash
npm start -- --clear
# Disable device rotation lock in phone settings
```

### Issue: Layout breaks in landscape
**Possible Causes:**
- Fixed pixel values instead of responsive
- Missing `ResponsiveTwoColumn` or responsive component

**Solution:**
- Replace fixed widths with responsive spacing
- Use responsive utility functions
- Check console for errors

### Issue: Text too small/large
**Possible Causes:**
- Not using responsive font sizes
- System font scale override

**Solution:**
```typescript
// Use responsive font sizes
fontSize: responsive.fontSize.md  // Instead of: fontSize: 16

// In Settings, check font scale isn't increased
```

### Issue: Keyboard hides content
**Possible Causes:**
- Missing `KeyboardAvoidingView`
- `avoidKeyboard` prop not set to true

**Solution:**
```typescript
<ResponsiveContainer avoidKeyboard scrollable>
  {/* Form content */}
</ResponsiveContainer>
```

### Issue: Console errors about orientation
**Possible Causes:**
- `expo-screen-orientation` not installed
- Plugin not declared in `app.json`

**Solution:**
```bash
npm install expo-screen-orientation@^7.0.0
# Check app.json has plugin config
```

## Performance Metrics to Track

### During Testing, Monitor:
- **Frame Rate:** Should stay at 60 FPS during rotation
- **Memory:** Should not increase during repeated rotations
- **Load Time:** App should load in < 3 seconds
- **Rotation Latency:** < 500ms from device rotation to screen update

## Regression Testing Checklist

After any code changes, verify:

- [ ] Auth screen still portrait-only
- [ ] Register screen still portrait-only
- [ ] Dashboard rotates to landscape
- [ ] No console errors in any orientation
- [ ] All buttons still tappable (44x44 minimum)
- [ ] Text readable at all screen sizes
- [ ] No data loss during rotation
- [ ] Keyboard avoidance works
- [ ] Spacing looks good on phones and tablets
- [ ] Performance is smooth (no jank)

## Final Verification

Before deploying, verify on:

- [ ] iPhone SE (small phone)
- [ ] iPhone 12/13/14 (medium phone)
- [ ] iPhone 14 Pro Max (large phone)
- [ ] iPad (tablet)
- [ ] Android phone
- [ ] Android tablet

All screens should:
- ✅ Display correctly in portrait
- ✅ Scale appropriately for screen size
- ✅ Rotate smoothly where permitted
- ✅ Maintain usability in all orientations
- ✅ Show no console errors or warnings

---

**Need Help?**
- Check `RESPONSIVE_DESIGN.md` for implementation details
- Review hook/component documentation in code comments
- Check console output during testing
- Test on multiple devices for comprehensive coverage
