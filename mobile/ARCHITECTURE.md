# Responsive Design Architecture

Visual guide to how the responsive design system is structured and how components interact.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         App Root                                     │
│                       (App.tsx)                                      │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AppNavigator                                      │
│         Manages navigation and screen routing                       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
    ┌─────────┐      ┌──────────┐     ┌─────────────┐
    │AuthScreen│      │Register  │     │Dashboards   │
    │(Portrait)│      │(Portrait)│     │(Landscape) │
    └────┬────┘      └────┬─────┘     └────┬────────┘
         │                │               │
         │ useOrientation │ useOrientation│ useOrientation
         │                │               │
         ▼                ▼               ▼
    ┌─────────────────────────────────────────────────┐
    │        useOrientation Hook                      │
    │   (src/hooks/useOrientation.ts)                │
    │                                                 │
    │  • Locks/unlocks screen rotation              │
    │  • Manages on mount/unmount                    │
    │  • Works with expo-screen-orientation         │
    └──────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
    ┌──────────────┐        ┌──────────────────────┐
    │ PORTRAIT_UP  │        │ ALL_BUT_UPSIDE_DOWN  │
    │ (Auth forms) │        │ (Dashboard screens)  │
    └──────────────┘        └──────────────────────┘
```

## Component Hierarchy

```
App
├── AppNavigator
│   ├── AuthScreen
│   │   ├── ResponsiveContainer (scrollable, avoidKeyboard)
│   │   │   ├── FormSection
│   │   │   │   ├── TextInput (with responsive fontSize)
│   │   │   │   └── TextInput (with responsive fontSize)
│   │   │   └── TouchableOpacity (responsive buttonLarge)
│   │   └── useOrientation(AUTH) → PORTRAIT_UP
│   │
│   ├── RegisterScreen
│   │   ├── ResponsiveContainer (scrollable, avoidKeyboard, centerContent)
│   │   │   ├── FormSection
│   │   │   │   ├── TextInput (×5 fields)
│   │   │   │   └── TouchableOpacity (responsive button)
│   │   │   └── TouchableOpacity (link)
│   │   └── useOrientation(AUTH) → PORTRAIT_UP
│   │
│   └── PatientDashboard
│       ├── ResponsiveContainer (scrollable)
│       │   ├── Greeting Section (responsive heading1)
│       │   │
│       │   ├── Stats Grid (responsive layout)
│       │   │   ├── StatCard (with responsive styling)
│       │   │   ├── StatCard (with responsive styling)
│       │   │   └── StatCard (with responsive styling)
│       │   │
│       │   └── ResponsiveTwoColumn
│       │       ├── Left: Adherence Card
│       │       │   └── CircularProgress (scales with screen)
│       │       └── Right: Reminders Card
│       │           └── RemindersList (scrollable)
│       │
│       └── useOrientation(DASHBOARD) → ALL_BUT_UPSIDE_DOWN
```

## Data Flow: Responsive Metrics

```
┌──────────────────────┐
│  Screen Dimensions   │ (Width × Height)
│  (from OS)           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  useResponsive Hook                  │ ◄── useWindowDimensions()
│  (src/hooks/useResponsive.ts)        │
└──────────────────────────────────────┘
           │
           ├─► isLandscape / isPortrait
           ├─► isPhone / isTablet
           ├─► screenSize ('small'|'medium'|'large'|'xlarge')
           ├─► spacing {xs, sm, md, lg, xl}
           ├─► fontSize {xs, sm, md, lg, xl, xxl}
           ├─► horizontalPadding
           └─► verticalPadding
                  │
                  ▼
        ┌──────────────────────┐
        │  Component renders   │
        │  with responsive     │
        │  values              │
        └──────────────────────┘
```

## Style Generation Flow

```
┌─────────────────────────────────────────┐
│  Component receives responsive object   │
│  const responsive = useResponsive()     │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────┐
│  createResponsiveStyles(responsive)      │ ◄── src/utils/responsiveStyles.ts
│  Generates complete StyleSheet            │
└──────────────────┬───────────────────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
     ▼             ▼             ▼
┌─────────┐  ┌──────────┐  ┌─────────────┐
│Container│  │Typography│  │Interactive │
│styles   │  │styles    │  │styles       │
│         │  │          │  │             │
│·container│ │·heading1│  │·button      │
│·scrollCnt│ │·heading2│  │·buttonText │
│·card    │  │·heading3│  │·input       │
│·centered│  │·bodyLrg │  │·buttonLarge │
│·spacing │  │·bodySml │  │·error/success
└────┬────┘  └────┬────┘  └────┬────────┘
     │            │             │
     └────────────┼─────────────┘
                  │
                  ▼
        ┌──────────────────────┐
        │  Applied to Views    │
        │  style={styles.xxx}  │
        └──────────────────────┘
```

## Orientation Lock Flow

```
┌──────────────────────────┐
│  Component mounts        │ ◄── useEffect in useOrientation
└──────────────┬───────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  useOrientation(config) called       │
│  with ORIENTATION_CONFIGS.AUTH       │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  getExpoOrientation(config.lock)     │ ◄── Convert to Expo format
│  Returns Expo orientation type       │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  ScreenOrientation.lockAsync()       │ ◄── Expo SDK
│  Locks device rotation               │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  User rotates device                 │
│  Device stays in locked orientation  │
└──────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Component unmounts (page change)    │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Cleanup: ScreenOrientation.unlockAsync()
│  Restores device rotation            │
└──────────────────────────────────────┘
```

## Responsive Container Component

```
ResponsiveContainer
├── Props
│   ├── scrollable: boolean (default: false)
│   ├── avoidKeyboard: boolean (default: false)
│   ├── horizontalPadding: boolean (default: true)
│   ├── verticalPadding: boolean (default: true)
│   ├── centerContent: boolean (default: false)
│   ├── backgroundColor: string
│   └── children: ReactNode
│
├── Logic
│   ├── Get responsive metrics via useResponsive()
│   ├── Calculate padding based on screen dimensions
│   ├── Apply SafeArea wrapper
│   ├── Optionally apply KeyboardAvoidingView
│   └── Optionally apply ScrollView
│
└── Output
    └── <SafeAreaView>
        ├── <KeyboardAvoidingView> (optional)
        │   └── <ScrollView> (optional)
        │       └── <View>
        │           └── {children}
        └── (or directly <View> if no options)
```

## Layout Adaptation Pattern

```
SCREEN WIDTH DETECTION
         │
    ┌────┴────┬────────────┬──────────┐
    │          │            │          │
    ▼          ▼            ▼          ▼
  <480px    480-600px    600-768px   >768px
  Small      Medium       Large      XLarge
  Phone      Phone        Phone      Tablet
    │          │            │          │
    ├──────────┴────────┬───┴──────────┤
    │                   │              │
    ▼                   ▼              ▼
PORTRAIT MODE      PORTRAIT          LANDSCAPE
    │              or                   │
    │            LANDSCAPE               │
    │                 │                  │
    ├─────────────────┼──────────────────┤
    │                 │                  │
    ▼                 ▼                  ▼
Responsive       Responsive         Responsive
Layout #1        Layout #2          Layout #3
(stacked)       (mixed)            (side-by-side)
```

## Spacing System

```
Base Unit: % of screen width
│
├─ xs: 2%   ┐
├─ sm: 3%   │ Scales with screen width
├─ md: 5%   │ Increases on larger devices
├─ lg: 7%   │
└─ xl: 10%  ┘

Example on iPhone (375px):
  xs = 7.5px
  sm = 11.25px
  md = 18.75px
  lg = 26.25px
  xl = 37.5px

Example on iPad (1024px):
  xs = 20px
  sm = 30px
  md = 51px
  lg = 71px
  xl = 102px

Usage:
  padding: responsive.spacing.md  ← Automatically scales
```

## Font Size System

```
Minimum Values (ensure readability)
│
├─ xs: min(10px, width × 0.03)
├─ sm: min(12px, width × 0.035)
├─ md: min(14px, width × 0.04)
├─ lg: min(16px, width × 0.05)
├─ xl: min(20px, width × 0.06)
└─ xxl: min(24px, width × 0.08)

Example on small screen (375px):
  xs = 10px (minimum)
  sm = 12px (minimum)
  md = 14px (minimum)
  lg = 16px (minimum)
  xl = 20px (minimum)
  xxl = 24px (minimum)

Example on large screen (1024px):
  xs = 30px
  sm = 35px
  md = 40px
  lg = 51px
  xl = 61px
  xxl = 81px

Usage:
  fontSize: responsive.fontSize.md  ← Scales with min guarantee
```

## Configuration Hierarchy

```
app.json (global orientation settings)
    │
    ├── iOS: ALL_BUT_UPSIDE_DOWN
    ├── Android: all
    ├── Plugin: expo-screen-orientation
    └── Initial: PORTRAIT_UP
         │
         ▼
ORIENTATION_CONFIGS (predefined locks)
    │
    ├── AUTH: PORTRAIT_UP
    ├── DASHBOARD: ALL_BUT_UPSIDE_DOWN
    ├── FORM: PORTRAIT_UP
    └── MEDIA: LANDSCAPE
         │
         ▼
useOrientation hook (screen-level control)
    │
    └── Calls ScreenOrientation.lockAsync()
        with selected orientation
```

## Runtime Responsiveness Flow

```
Device Rotated (user rotates phone)
    │
    ▼
OS notifies React Native
    │
    ▼
useWindowDimensions() hook fires
    │
    ▼
useResponsive() recalculates metrics
    │
    ├─► width, height updated
    ├─► isLandscape, isPortrait toggled
    ├─► spacing values recalculated
    └─► fontSize values recalculated
         │
         ▼
Component re-renders with new values
    │
    ├─► Padding adjusts
    ├─► Font sizes scale
    ├─► Layout adapts
    └─► UI smoothly transitions
         │
         ▼
ResponsiveTwoColumn switches layout
    │
    ├─ Landscape: side-by-side
    └─ Portrait: stacked
         │
         ▼
User sees adapted layout (60 FPS, smooth)
```

## Files Organization

```
mobile/
│
├── src/
│   │
│   ├── hooks/
│   │   ├── useResponsive.ts ◄─── Calculate responsive metrics
│   │   ├── useOrientation.ts ◄─── Lock/unlock orientation
│   │   └── useAuth.ts (existing)
│   │
│   ├── components/
│   │   ├── ResponsiveContainer.tsx ◄─── Layout wrappers
│   │   └── ... (other components)
│   │
│   ├── config/
│   │   ├── orientation.config.ts ◄─── Predefined orientations
│   │   └── ... (other configs)
│   │
│   ├── utils/
│   │   ├── responsiveStyles.ts ◄─── StyleSheet generator
│   │   └── ... (other utils)
│   │
│   └── screens/
│       ├── AuthScreen.tsx ◄─── Updated (responsive)
│       ├── RegisterScreen.tsx ◄─── Updated (responsive)
│       ├── patient/
│       │   ├── PatientDashboard.tsx ◄─── Updated (responsive)
│       │   └── ... (other screens)
│       └── ...
│
├── app.json ◄─── Updated (orientation config)
├── package.json ◄─── Updated (expo-screen-orientation)
│
└── Documentation/
    ├── README_RESPONSIVE.md ◄─── Entry point
    ├── RESPONSIVE_DESIGN.md ◄─── Implementation guide
    ├── TESTING_ORIENTATION.md ◄─── Testing guide
    ├── QUICK_TEST_CHECKLIST.md ◄─── Quick reference
    ├── IMPLEMENTATION_SUMMARY.md ◄─── Project summary
    └── ARCHITECTURE.md ◄─── This file
```

## Component Tree with Responsive Values

```
<ResponsiveContainer>
  ├── width: responsive.width (dynamically updates)
  ├── height: responsive.height (dynamically updates)
  ├── padding: responsive.horizontalPadding
  ├── paddingVertical: responsive.verticalPadding
  │
  └── Children receive metrics via props or context
      │
      └── <Text style={{ fontSize: responsive.fontSize.md }}>
          └── Auto-scales with screen dimension
```

## State Management Flow

```
Component Mounts
    │
    ▼
useResponsive() Hook
    │
    ├─► useWindowDimensions() (RN built-in)
    │   └─► Subscribes to dimension changes
    │
    ├─► useMemo calculations
    │   ├─► isLandscape calculation
    │   ├─► screenSize determination
    │   ├─► spacing percentage calculations
    │   └─► fontSize calculations
    │
    └─► Returns responsive object
         │
         ▼
Component uses responsive values
    │
    └─► Re-renders on dimension change
         │
         └─► Layout smoothly adapts
```

---

This architecture ensures:
- ✅ Automatic responsiveness on orientation change
- ✅ Consistent spacing and typography
- ✅ Smooth 60 FPS transitions
- ✅ Portrait/landscape specific layouts
- ✅ Multi-device support
- ✅ Clean, reusable component structure
