# Patient UI Responsive Design - Quick Reference

## Overview
All 5 patient screens are now responsive across portrait and landscape orientations using the `useOrientation` hook.

---

## How to Use `useOrientation`

### Import
```typescript
import { useOrientation } from '../../hooks/useOrientation';
```

### Hook Usage
```typescript
const { width, height, isLandscape, isPortrait } = useOrientation();
```

### What You Get
| Property | Type | Description |
|----------|------|-------------|
| `width` | number | Screen width in pixels |
| `height` | number | Screen height in pixels |
| `isLandscape` | boolean | True if landscape orientation |
| `isPortrait` | boolean | True if portrait orientation |

---

## Responsive Patterns Used

### 1. Spacing (Padding/Gap)
```typescript
// Use conditional spacing
padding: isLandscape ? 12 : 16,
gap: isLandscape ? 12 : 16,
marginBottom: isLandscape ? 8 : 12,
```

### 2. Dynamic Sizing
```typescript
// QR code example
const qrSize = isLandscape ? 120 : 200;

// General sizing
size: isLandscape ? 40 : 48,
```

### 3. Responsive Columns
```typescript
// Use useMemo for expensive calculations
const columnWidths = useMemo(() => {
  if (isLandscape && width >= 768) {
    // Tablet landscape
    return { COL_A: width * 0.22, COL_B: width * 0.25, ... }
  } else if (isLandscape) {
    // Mobile landscape
    return { COL_A: 130, COL_B: 160, ... }
  } else {
    // Portrait
    return { COL_A: 150, COL_B: 180, ... }
  }
}, [width, isLandscape])
```

### 4. Conditional Layout
```typescript
// Horizontal scroll in portrait, full-width in tablet landscape
<ScrollView horizontal={!isLandscape || width < 768}>
  {/* content */}
</ScrollView>
```

---

## Screen-Specific Implementations

### PatientDashboard
```typescript
{/* Responsive spacing */}
<View style={{ 
  gap: isLandscape ? responsive.spacing.sm : responsive.spacing.md,
  marginBottom: isLandscape ? responsive.spacing.md : responsive.spacing.lg
}}>
  {/* cards */}
</View>
```

### MedicationSchedule
```typescript
{/* Dynamic padding and gap */}
contentContainerStyle={[
  styles.listContent, 
  { 
    padding: isLandscape ? 12 : 16, 
    gap: isLandscape ? 12 : 16 
  }
]}
```

### MyPrescriptions
```typescript
{/* Responsive gap between cards */}
style={[
  styles.activeGrid,
  isLandscape ? { gap: 12 } : { gap: 16 },
]}
```

### AdherenceHistory
```typescript
{/* useMemo for column width calculations */}
const columnWidths = useMemo(() => {
  // Calculations based on width and isLandscape
  return { TABLE_WIDTH, COL_A, COL_B, ... }
}, [width, isLandscape, availableWidth])
```

### QrBinding
```typescript
{/* Landscape-aware QR sizing */}
const qrSize = isLandscape ? Math.min(120, width * 0.25) : Math.min(200, width * 0.6);

<QRCode value={qrCode} size={qrSize} />
```

---

## Breakpoints

### Mobile Portrait
- Width: < 768px
- Padding: 16px
- Gap: 16px
- QR Size: 200px
- Behavior: Horizontal scroll where needed

### Mobile Landscape
- Width: < 768px
- Padding: 12px
- Gap: 12px
- QR Size: 120px
- Behavior: Compact layout, may scroll horizontally

### Tablet Landscape
- Width: >= 768px
- Padding: 16px
- Gap: 16px
- QR Size: 150-200px
- Behavior: Full-width, rarely needs horizontal scroll

---

## Best Practices

### ✅ DO
- Use `useOrientation` for orientation-specific values
- Use `useMemo` for expensive calculations
- Test with `isLandscape` check
- Maintain minimum 44x44 touch targets
- Keep text sizes consistent
- Provide visual feedback for interactions

### ❌ DON'T
- Pass arguments to `useOrientation()` (it takes no args)
- Use `useWindowDimensions` (use `useOrientation` instead)
- Scale text based on orientation
- Create fixed-width layouts that don't adapt
- Forget about horizontal scroll on tables
- Use padding that's too aggressive in landscape

---

## Testing Checklist

For each screen in both portrait and landscape:

- [ ] All content visible without clipping
- [ ] Text remains readable (not too small)
- [ ] Buttons/inputs remain accessible (44x44+ minimum)
- [ ] No horizontal overflow (or smooth scroll)
- [ ] Vertical scroll works smoothly
- [ ] Images scale appropriately
- [ ] Spacing looks balanced
- [ ] Touch targets are usable
- [ ] No text truncation errors
- [ ] Data displays completely

---

## Common Issues & Solutions

### Issue: Content overflows in landscape
**Solution:** Use conditional padding/gap, reduce from 16px to 12px

### Issue: Text becomes too small in landscape
**Solution:** DON'T scale text. Keep font sizes constant across orientations.

### Issue: Table columns are too narrow
**Solution:** Use dynamic column width calculation with `useMemo`, calculate as percentage of available width

### Issue: QR code too large in landscape
**Solution:** Use conditional sizing: `isLandscape ? 120 : 200`

### Issue: Buttons not clickable in landscape
**Solution:** Maintain minimum 44x44 touch target, use conditional padding instead of removing space

### Issue: Orientation changes feel janky
**Solution:** Use `useMemo` or `useCallback` to prevent unnecessary re-renders, let Dimensions API update smoothly

---

## Migration Guide

### Converting from useWindowDimensions to useOrientation

**Before:**
```typescript
import { useWindowDimensions } from 'react-native';

const { width } = useWindowDimensions();
const isLandscape = width > height; // Manual calculation
```

**After:**
```typescript
import { useOrientation } from '../../hooks/useOrientation';

const { width, height, isLandscape } = useOrientation();
```

### Benefits
- Faster orientation detection
- Built-in `isLandscape` and `isPortrait` flags
- Cleaner code
- Better performance

---

## Examples from Current Implementation

### Simple Conditional
```typescript
// PatientDashboard
marginBottom: isLandscape ? responsive.spacing.md : responsive.spacing.lg
```

### Medium Complexity
```typescript
// MedicationSchedule
padding: isLandscape ? 12 : 16,
gap: isLandscape ? 12 : 16
```

### High Complexity
```typescript
// AdherenceHistory (with useMemo)
const columnWidths = useMemo(() => {
  if (isLandscape && width >= 768) {
    return { TABLE_WIDTH: Math.max(availableWidth, 720), ... }
  } else if (isLandscape) {
    return { TABLE_WIDTH: 680, ... }
  } else {
    return { TABLE_WIDTH: 720, ... }
  }
}, [width, isLandscape, availableWidth])
```

---

## File Locations

```
c:\laragon\www\pmed-aid\mobile\
├── src\
│   ├── hooks\
│   │   └── useOrientation.ts          ← Hook implementation
│   ├── screens\
│   │   └── patient\
│   │       ├── PatientDashboard.tsx   ✓ Updated
│   │       ├── MedicationSchedule.tsx ✓ Updated
│   │       ├── MyPrescriptions.tsx    ✓ Updated
│   │       ├── AdherenceHistory.tsx   ✓ Updated
│   │       └── QrBinding.tsx          ✓ Updated
│   └── ...
├── TEST_PATIENT_UI_RESPONSIVE.md      ← Full test report
└── RESPONSIVE_DESIGN_GUIDE.md         ← This file
```

---

## Support & Questions

For questions about responsive design implementation:
1. Check the specific screen file (e.g., `PatientDashboard.tsx`)
2. Review `useOrientation.ts` hook implementation
3. See `TEST_PATIENT_UI_RESPONSIVE.md` for detailed examples
4. Reference this guide for best practices

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-10-07 | Initial responsive design implementation for 5 patient screens |

---

*Last updated: October 7, 2026*

