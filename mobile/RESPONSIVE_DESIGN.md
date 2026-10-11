# Responsive Design & Orientation Guide

This document explains how the PMED-AID mobile app handles responsive design and screen orientation.

## Overview

The app is built with a mobile-first responsive design that automatically adapts to:
- Different screen sizes (phones, tablets, large tablets)
- Portrait and landscape orientations
- Dynamic spacing and typography that scales with screen dimensions

## Key Features

### 1. Responsive Hooks & Utilities

#### `useResponsive()` Hook
Located in: `src/hooks/useResponsive.ts`

Provides layout metrics that automatically update when screen dimensions change:

```typescript
import { useResponsive } from '@/hooks/useResponsive';

function MyComponent() {
  const responsive = useResponsive();
  
  return (
    <View style={{ 
      padding: responsive.spacing.md,
      fontSize: responsive.fontSize.md 
    }}>
      {responsive.isLandscape ? 'Landscape' : 'Portrait'}
    </View>
  );
}
```

**Available properties:**
- `width`, `height` - Current screen dimensions
- `isLandscape`, `isPortrait` - Orientation booleans
- `isPhone`, `isTablet` - Device type
- `screenSize` - 'small' | 'medium' | 'large' | 'xlarge'
- `horizontalPadding`, `verticalPadding` - Responsive padding
- `spacing` - Object with xs, sm, md, lg, xl spacing values (% of width)
- `fontSize` - Object with xs, sm, md, lg, xl, xxl font sizes

#### `createResponsiveStyles()` Utility
Located in: `src/utils/responsiveStyles.ts`

Generates a complete StyleSheet with responsive values:

```typescript
import { createResponsiveStyles } from '@/utils/responsiveStyles';
import { useResponsive } from '@/hooks/useResponsive';

function MyComponent() {
  const responsive = useResponsive();
  const styles = createResponsiveStyles(responsive);
  
  return (
    <View style={styles.container}>
      <Text style={styles.heading1}>Title</Text>
      <TouchableOpacity style={styles.buttonLarge}>
        <Text style={styles.buttonText}>Press Me</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 2. Responsive Components

#### ResponsiveContainer
Located in: `src/components/ResponsiveContainer.tsx`

Main wrapper component that handles SafeArea, keyboard avoidance, and responsive padding:

```typescript
import { ResponsiveContainer } from '@/components/ResponsiveContainer';

function MyScreen() {
  return (
    <ResponsiveContainer 
      scrollable 
      avoidKeyboard
      horizontalPadding
      verticalPadding
    >
      <Text>Content that auto-adjusts to screen size</Text>
    </ResponsiveContainer>
  );
}
```

**Props:**
- `scrollable?: boolean` - Enable ScrollView
- `avoidKeyboard?: boolean` - Wrap with KeyboardAvoidingView
- `horizontalPadding?: boolean` - Add responsive horizontal padding
- `verticalPadding?: boolean` - Add responsive vertical padding
- `centerContent?: boolean` - Center content
- `backgroundColor?: string` - Custom background color

#### ResponsiveTwoColumn
Automatically stacks on phones, displays side-by-side on tablets/landscape:

```typescript
import { ResponsiveTwoColumn } from '@/components/ResponsiveContainer';

function MyLayout() {
  return (
    <ResponsiveTwoColumn
      left={<View>Left Panel</View>}
      right={<View>Right Panel</View>}
      gap={spacing.lg}
    />
  );
}
```

#### ResponsiveGrid
Creates a responsive grid that adapts column count:

```typescript
import { ResponsiveGrid } from '@/components/ResponsiveContainer';

function MyGrid() {
  return (
    <ResponsiveGrid columns={2} gap={16}>
      <Card />
      <Card />
      <Card />
      <Card />
    </ResponsiveGrid>
  );
}
```

#### FormSection
Wrapper for form groups with consistent spacing:

```typescript
import { FormSection } from '@/components/ResponsiveContainer';

function MyForm() {
  return (
    <FormSection title="Personal Info" gap={16}>
      <TextInput placeholder="Name" />
      <TextInput placeholder="Email" />
    </FormSection>
  );
}
```

### 3. Orientation Management

#### `useOrientation()` Hook
Located in: `src/hooks/useOrientation.ts`

Lock/unlock screen orientation for specific screens:

```typescript
import { useOrientation } from '@/hooks/useOrientation';
import { ORIENTATION_CONFIGS } from '@/config/orientation.config';

function AuthScreen() {
  // Lock auth screens to portrait only
  useOrientation(ORIENTATION_CONFIGS.AUTH);
  
  return <View>Login Form</View>;
}

function DashboardScreen() {
  // Allow both orientations
  useOrientation(ORIENTATION_CONFIGS.DASHBOARD);
  
  return <View>Dashboard</View>;
}
```

#### Predefined Orientation Configs
Located in: `src/config/orientation.config.ts`

Available configurations:
- `AUTH` - Portrait only (better for forms)
- `DASHBOARD` - All orientations except upside-down
- `DETAIL` - All orientations except upside-down
- `FORM` - Portrait only
- `MEDIA` - Landscape preferred
- `APP` - All orientations except upside-down

### 4. App Configuration

The `app.json` is configured to support orientation changes:

```json
{
  "ios": {
    "orientationLock": "ALL_BUT_UPSIDE_DOWN"
  },
  "android": {
    "orientationLock": "all"
  },
  "plugins": [
    [
      "expo-screen-orientation",
      {
        "initialOrientation": "PORTRAIT_UP"
      }
    ]
  ]
}
```

This allows:
- iOS: Portrait, landscape left, landscape right
- Android: All orientations
- Initial state: Portrait up

## Implementation Examples

### Example 1: Responsive Auth Screen

```typescript
import { useResponsive } from '@/hooks/useResponsive';
import { useOrientation } from '@/hooks/useOrientation';
import { createResponsiveStyles } from '@/utils/responsiveStyles';
import { ResponsiveContainer, FormSection } from '@/components/ResponsiveContainer';
import { ORIENTATION_CONFIGS } from '@/config/orientation.config';

export default function LoginScreen() {
  const responsive = useResponsive();
  const styles = createResponsiveStyles(responsive);
  
  useOrientation(ORIENTATION_CONFIGS.AUTH); // Lock to portrait
  
  return (
    <ResponsiveContainer scrollable avoidKeyboard>
      <View style={{ padding: responsive.spacing.lg }}>
        <Text style={styles.heading1}>Login</Text>
        
        <FormSection gap={responsive.spacing.md}>
          <TextInput style={styles.inputLarge} placeholder="Email" />
          <TextInput style={styles.inputLarge} placeholder="Password" />
        </FormSection>
        
        <TouchableOpacity style={styles.buttonLarge}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ResponsiveContainer>
  );
}
```

### Example 2: Responsive Dashboard

```typescript
import { useResponsive } from '@/hooks/useResponsive';
import { useOrientation } from '@/hooks/useOrientation';
import { createResponsiveStyles } from '@/utils/responsiveStyles';
import { ResponsiveContainer, ResponsiveTwoColumn } from '@/components/ResponsiveContainer';
import { ORIENTATION_CONFIGS } from '@/config/orientation.config';

export default function DashboardScreen() {
  const responsive = useResponsive();
  const styles = createResponsiveStyles(responsive);
  
  useOrientation(ORIENTATION_CONFIGS.DASHBOARD); // Allow both orientations
  
  return (
    <ResponsiveContainer scrollable>
      <Text style={styles.heading1}>Dashboard</Text>
      
      {/* This component automatically stacks on phone, side-by-side on tablet */}
      <ResponsiveTwoColumn
        left={
          <View style={styles.card}>
            <Text>Left Panel</Text>
          </View>
        }
        right={
          <View style={styles.card}>
            <Text>Right Panel</Text>
          </View>
        }
        gap={responsive.spacing.lg}
      />
    </ResponsiveContainer>
  );
}
```

### Example 3: Responsive Stats Grid

```typescript
import { useResponsive } from '@/hooks/useResponsive';
import { createResponsiveStyles } from '@/utils/responsiveStyles';
import { ResponsiveGrid } from '@/components/ResponsiveContainer';

export default function StatsScreen() {
  const responsive = useResponsive();
  const styles = createResponsiveStyles(responsive);
  
  return (
    <ResponsiveGrid columns={responsive.isTablet ? 3 : 2} gap={responsive.spacing.md}>
      <View style={styles.card}>
        <Text style={styles.heading3}>Stat 1</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading3}>Stat 2</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading3}>Stat 3</Text>
      </View>
    </ResponsiveGrid>
  );
}
```

## Breakpoints & Sizing

### Screen Size Breakpoints

```typescript
{
  "small": "width < 480",
  "medium": "width < 600",  // Most phones
  "large": "width < 900",   // Tablets
  "xlarge": "width >= 900"  // Large tablets
}
```

### Responsive Spacing (% of screen width)

```typescript
{
  "xs": "2%",   // 7.5px on iPhone
  "sm": "3%",   // 11.25px on iPhone
  "md": "5%",   // 18.75px on iPhone
  "lg": "7%",   // 26.25px on iPhone
  "xl": "10%"   // 37.5px on iPhone
}
```

### Responsive Font Sizes

Calculated to maintain readability across all screens:
```typescript
{
  "xs": Math.max(10, width * 0.03),    // Min 10px
  "sm": Math.max(12, width * 0.035),   // Min 12px
  "md": Math.max(14, width * 0.04),    // Min 14px
  "lg": Math.max(16, width * 0.05),    // Min 16px
  "xl": Math.max(20, width * 0.06),    // Min 20px
  "xxl": Math.max(24, width * 0.08)    // Min 24px
}
```

## Best Practices

### DO ✅

- Use `useResponsive()` hook for dynamic sizing
- Use `createResponsiveStyles()` for consistent styling
- Use responsive components (ResponsiveContainer, ResponsiveTwoColumn)
- Lock orientation for forms using `useOrientation()`
- Test on both phones and tablets
- Use responsive padding instead of fixed values
- Use `spacing` and `fontSize` objects instead of hardcoding

### DON'T ❌

- Hardcode pixel values (e.g., `padding: 20`)
- Use fixed widths for layouts
- Forget to handle landscape mode
- Mix responsive and fixed sizing
- Ignore tablet/large screen layouts

## Testing Orientation Changes

### In Expo Go:
1. Rotate your device to test landscape
2. Use Shake gesture to access Expo menu
3. Check DevTools for errors

### In Android Emulator:
1. Press Ctrl+Right Arrow to rotate
2. Use rotate buttons in emulator controls

### In iOS Simulator:
1. Press Cmd+Right Arrow to rotate
2. Use Hardware → Rotate menu

## Common Issues & Solutions

### Issue: Content is clipped in landscape
**Solution:** Use `ResponsiveContainer` with `scrollable={true}` or reduce `padding` values.

### Issue: Text too small on large screens
**Solution:** Responsive font sizes auto-scale. If using custom sizes, multiply by screen width factor.

### Issue: Two-column layout not appearing on tablet
**Solution:** Ensure `isTablet` is being checked or use `ResponsiveTwoColumn` component.

### Issue: Orientation won't lock
**Solution:** Check that `useOrientation()` hook is called at component root and `expo-screen-orientation` plugin is installed.

## Migration Guide: Converting Old Screens

To convert a fixed-size screen to responsive:

1. **Remove fixed widths/heights:**
   ```typescript
   // Before
   padding: 20,
   fontSize: 16
   
   // After
   padding: responsive.spacing.md,
   fontSize: responsive.fontSize.md
   ```

2. **Replace hardcoded layouts:**
   ```typescript
   // Before
   flexDirection: isTablet ? 'row' : 'column'
   
   // After
   <ResponsiveTwoColumn left={...} right={...} />
   ```

3. **Add orientation lock:**
   ```typescript
   // Add to component
   useOrientation(ORIENTATION_CONFIGS.DASHBOARD);
   ```

4. **Use responsive containers:**
   ```typescript
   // Wrap content
   <ResponsiveContainer scrollable avoidKeyboard>
     {/* Your content */}
   </ResponsiveContainer>
   ```

## Resources

- [React Native Dimensions API](https://reactnative.dev/docs/dimensions)
- [Expo Screen Orientation](https://docs.expo.dev/versions/latest/sdk/screen-orientation/)
- [React Native Responsive Design](https://reactnative.dev/docs/height-and-width)
