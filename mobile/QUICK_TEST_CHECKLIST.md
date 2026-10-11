# Quick Testing Checklist - Responsive Design

Use this quick reference when testing orientation and responsive features.

## Pre-Test Setup
```bash
npm install                    # Install dependencies
npm start -- --clear          # Start with clean cache
# Open in Expo Go or emulator
```

## 5-Minute Quick Test

### Auth Screen
- [ ] **Portrait:** Form displays, all fields visible
- [ ] **Rotation:** Try to rotate → stays portrait ✓ (correct)
- [ ] **Keyboard:** Tap input, content shifts up ✓
- [ ] **Button:** Sign In button clickable ✓

### Register Screen  
- [ ] **Portrait:** All form fields visible
- [ ] **Rotation:** Device rotates → screen stays portrait ✓
- [ ] **Spacing:** Form looks balanced ✓

### Patient Dashboard
- [ ] **Portrait:** Stats stack, cards full-width
- [ ] **Landscape:** Rotate → stats in columns, cards side-by-side ✓
- [ ] **Both:** No text overflow, readable ✓
- [ ] **Scroll:** Smooth scrolling ✓

## Screen Size Tests (5 min each)

### Small Phone (375px width)
```
Auth Screen:
  ✓ Form centered
  ✓ Inputs full width with padding
  ✓ Button tappable

Dashboard:
  ✓ Stats single column
  ✓ Cards full width
  ✓ No horizontal scroll
```

### Medium Phone (390px width)
```
Auth Screen:
  ✓ Proportions good
  ✓ Form not cramped

Dashboard:
  ✓ Stats layout looks balanced
  ✓ Content readable
```

### Large Phone (430px width)
```
Dashboard:
  ✓ Content doesn't stretch too much
  ✓ Proportions maintained
  ✓ Text not oversized
```

### Tablet (768px+ width)
```
Dashboard:
  ✓ Stats show 2-3 columns naturally
  ✓ Adherence & Reminders side-by-side
  ✓ Adequate whitespace
  ✓ Content feels organized
```

## Landscape Mode Tests

### Dashboard in Landscape
- [ ] Rotation works smoothly
- [ ] Stats cards adjust (2-3 columns)
- [ ] Two-column layout appears
- [ ] No content cut off
- [ ] Text readable
- [ ] Padding adjusted for landscape
- [ ] Scroll works if needed

### Rapid Rotation Test
- [ ] Rotate portrait → landscape → portrait → landscape
- [ ] Each transition smooth (< 500ms)
- [ ] No glitches or visual errors
- [ ] Data preserved
- [ ] No console errors

## Keyboard & Input Tests

### Auth Form
- [ ] Tap email input → Keyboard appears
- [ ] Content shifts up (doesn't hide behind keyboard)
- [ ] Tap password → Keyboard for password field
- [ ] Dismiss keyboard → Content returns
- [ ] Tap checkbox → Still accessible

### Register Form
- [ ] All 5 inputs remain accessible with keyboard open
- [ ] Form scrolls if needed
- [ ] Sign Up button never hidden

## Device-Specific Tests

### iOS Simulator
```
1. Hardware → Rotate Left/Right
2. Verify app rotates (or stays portrait for auth)
3. Hardware → Auto Rotation Off
4. Try manual rotation → app respects lock
```

### Android Emulator
```
1. Press Ctrl+Right Arrow (rotate)
2. Verify app rotates (or stays portrait for auth)
3. Repeat Ctrl+Left Arrow (counter-rotate)
4. Verify smooth transitions
```

### Real Device
```
1. Disable device rotation lock in Settings
2. Physically rotate device
3. App should rotate only where permitted
4. Reverse and repeat
```

## Visual Inspection

### Typography
- [ ] **All text readable** in portrait and landscape
- [ ] **Font sizes scale** with screen width
- [ ] **No text overflow** on any screen size
- [ ] **Line heights** provide good spacing
- [ ] **Contrast** sufficient for readability

### Spacing & Layout
- [ ] **Consistent padding** across screens
- [ ] **Margins balanced** in all orientations
- [ ] **Components don't touch edges** (safe area respected)
- [ ] **Alignment centered/justified** appropriately

### Buttons & Interactions
- [ ] **All buttons minimum 44x44 points** (tappable)
- [ ] **Button text visible** in all orientations
- [ ] **Touch feedback** works (highlight on tap)
- [ ] **No overlapping** interactive elements

### Colors & Contrast
- [ ] **Text readable** against backgrounds
- [ ] **Input fields distinguishable** from background
- [ ] **Icons visible** and clear
- [ ] **Status colors** consistent

## Performance Check

### Rotation Performance
- [ ] **Smooth animation** (60 FPS, no jank)
- [ ] **Quick response** (< 500ms from device tilt to screen update)
- [ ] **No freeze** during rotation

### General Performance
- [ ] **App loads quickly** (< 3 seconds)
- [ ] **No lag** when scrolling
- [ ] **Forms responsive** to input
- [ ] **Smooth transitions** between screens

## Console Checks

Open Expo console:
1. Shake device (or Cmd+M / Ctrl+M)
2. Select "View Console"
3. Check for:
   ```
   ✓ No red errors
   ✓ No yellow warnings
   ✓ Orientation logs appear on rotation
   ```

Expected logs:
```
"Orientation changed to: LANDSCAPE_RIGHT"
"Orientation changed to: PORTRAIT_UP"
```

## Regression Tests (After Code Changes)

- [ ] Auth screen still portrait-only
- [ ] Register screen still portrait-only
- [ ] Dashboard rotates in landscape
- [ ] All previous checks still pass
- [ ] No new console errors
- [ ] No broken layouts

## Final Certification

### All Tests Pass ✓
- [ ] Auth: Portrait only, form works
- [ ] Register: Portrait only, form works
- [ ] Dashboard: Portrait works, landscape works
- [ ] Small phone: Readable, no overflow
- [ ] Medium phone: Balanced proportions
- [ ] Large phone: Not over-stretched
- [ ] Tablet: Multi-column layout works
- [ ] Rotation: Smooth, no glitches
- [ ] Keyboard: Doesn't hide content
- [ ] Console: No errors or warnings
- [ ] Performance: Smooth 60 FPS

**Status:** READY FOR DEPLOYMENT ✓

---

## Quick Troubleshooting

| Issue | Check | Fix |
|-------|-------|-----|
| Screen won't rotate | useOrientation() called? | Add hook to component |
| Text too small | Using responsive.fontSize? | Replace hardcoded sizes |
| Layout breaks | Using ResponsiveTwoColumn? | Update to responsive component |
| Keyboard hides content | avoidKeyboard prop set? | Add to ResponsiveContainer |
| Auth rotates | Wrong orientation config? | Use ORIENTATION_CONFIGS.AUTH |
| Slow rotation | Fixed pixel calc? | Use responsive utilities |
| No console logs | Logging enabled? | Check Expo console open |

---

**For detailed testing:** See `TESTING_ORIENTATION.md`  
**For implementation:** See `RESPONSIVE_DESIGN.md`
