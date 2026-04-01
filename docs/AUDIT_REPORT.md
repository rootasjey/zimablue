# Zima Blue — Design Audit Report

**Date**: March 12, 2026  
**Scope**: Full codebase audit (49 Vue components, 20 pages)  
**Auditor**: Mux (AI Assistant)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 1 |
| High | 4 |
| Medium | 4 |
| Low | 3 |
| **Total** | **12** |

**Overall Quality Score**: 7.5/10

**Top Critical Issues**:
1. **Purple colors violate brand guidelines** — `useRandomColors.ts` contains purple hex codes despite explicit "no purple gradient" rule
2. **Missing reduced-motion support** — Only 2/49 components respect `prefers-reduced-motion`
3. **Small touch targets** — Theme toggle button is 24x24px (below 44px minimum)
4. **Form accessibility gaps** — Login form labels lack `for` attribute associations

**Recommended Next Steps**:
1. Remove purple from color palette (immediate)
2. Add reduced-motion media queries to all animated components
3. Increase touch target sizes for mobile
4. Add proper `for`/`id` associations to form inputs

---

## Anti-Patterns Verdict

### ⚠️ PARTIAL FAIL

**AI Design Tells Found**:
- ✅ **Glassmorphism** — Used in 5+ components (`backdrop-blur-md`, translucent backgrounds)
- ✅ **Gradient text** — Not present (good)
- ❌ **Purple colors** — Found in `useRandomColors.ts` (violates user preference)
- ⚠️ **Rainbow colors** — Used intentionally per user request, but `useRandomColors` adds randomness that may feel uncontrolled

**Specific Anti-Pattern Violations**:
1. **`app/composables/useRandomColors.ts`**: Contains `#9370DB` (Medium Purple) and `#B19CD9` (Light Purple)
2. **Glassmorphism overload**: `backdrop-blur-md` used in sticky headers, selection toolbar, upload zones

**Verdict**: The design is NOT generic AI-slop, but has specific issues that need addressing.

---

## Detailed Findings by Severity

### 🔴 Critical Issues

#### 1. Purple Colors in Palette
- **Location**: `app/composables/useRandomColors.ts:9-15`
- **Category**: Theming / Brand Compliance
- **Description**: Color palette includes `#9370DB` (Medium Purple) and `#B19CD9` (Light Purple)
- **Impact**: Violates explicit user requirement "no purple gradient"; creates brand inconsistency
- **Recommendation**: Remove purple colors from both `lightModeColors` and `darkModeColors` arrays
- **Suggested command**: Manual fix required (remove lines 9 and 13)

---

### 🟠 High-Severity Issues

#### 2. Missing Reduced Motion Support
- **Location**: Multiple components (47 of 49 lack `prefers-reduced-motion`)
- **Category**: Accessibility
- **Description**: Only `ImageGrid.vue` and `login.vue` respect user's motion preferences. Components like `CollectionHeader.vue`, `CollectionImageGrid.vue`, `PageHeader.vue` have animations without motion queries.
- **Impact**: Users with vestibular disorders or motion sensitivity experience discomfort
- **WCAG**: WCAG 2.1 AA, 2.3.3 (Animation from Interactions)
- **Recommendation**: Add `@media (prefers-reduced-motion: reduce)` to all CSS animations
- **Suggested command**: `/harden` to add accessibility guards

#### 3. Small Touch Targets (PageHeader)
- **Location**: `app/components/PageHeader.vue:52-58`
- **Category**: Responsive / Accessibility
- **Description**: Theme toggle and low-power mode buttons use `h-6 w-6` (24x24px)
- **Impact**: Difficult to tap on mobile devices; fails touch target minimum
- **WCAG**: WCAG 2.1 AA, 2.5.8 (Target Size Minimum) — 44x44px
- **Recommendation**: Increase to at least `h-10 w-10` (40px) or `h-11 w-11` (44px)
- **Suggested command**: `/adapt` to fix responsive touch targets

#### 4. Form Labels Without Association
- **Location**: `app/pages/login.vue` (multiple labels)
- **Category**: Accessibility
- **Description**: Form labels have text but lack `for` attributes linking to input IDs
- **Impact**: Screen readers cannot programmatically associate labels with inputs
- **WCAG**: WCAG 2.1 A, 1.3.1 (Info and Relationships), 4.1.2 (Name, Role, Value)
- **Recommendation**: Add matching `id` to inputs and `for` to labels, or use Nuxt UI's built-in association
- **Suggested command**: `/harden` to fix form accessibility

#### 5. RandomColors Contrast Concerns
- **Location**: `app/composables/useRandomColors.ts`
- **Category**: Accessibility / Theming
- **Description**: Randomly selected colors may not have sufficient contrast (4.5:1) against all backgrounds
- **Impact**: Text may be unreadable for users; unpredictable accessibility
- **Recommendation**: Audit color combinations for WCAG contrast compliance; consider using only pre-validated pairs
- **Suggested command**: `/normalize` to align with accessible design tokens

---

### 🟡 Medium-Severity Issues

#### 6. Glassmorphism Performance
- **Location**: `CollectionHeader.vue`, `AdminTable.vue`, `ImageUploadZone.vue`, `SelectionToolbar.vue`
- **Category**: Performance / Theming
- **Description**: `backdrop-blur-md` creates compositor layers; can impact scroll performance on lower-end devices
- **Impact**: Potential jank during scroll; increased memory usage
- **Recommendation**: Use sparingly; consider `will-change: backdrop-filter` for critical uses; or replace with solid translucent backgrounds
- **Suggested command**: `/optimize` to reduce compositor pressure

#### 7. Excessive Hover Scale
- **Location**: `PageHeader.vue:19` — `hover:scale-120`
- **Category**: Theming / Accessibility
- **Description**: 20% scale increase on hover may feel jarring to some users
- **Impact**: Could trigger discomfort in motion-sensitive users; feels less elegant
- **Recommendation**: Reduce to `hover:scale-105` or `hover:scale-110` for subtlety
- **Suggested command**: `/quieter` to reduce animation intensity

#### 8. RandomColors User Experience
- **Location**: `app/composables/useRandomColors.ts`, `app/pages/about.vue`
- **Category**: UX / Theming
- **Description**: Random colors change on each page load, creating inconsistency
- **Impact**: May feel unprofessional; unpredictable experience
- **Recommendation**: Consider using fixed brand colors instead of random selection, or persist the random choice
- **Suggested command**: `/normalize` to use consistent design tokens

#### 9. AdminTable Hardcoded Background
- **Location**: `app/components/admin/AdminTable.vue:2`
- **Category**: Theming
- **Description**: Hardcoded `bg-[#D1E0E9]` for light mode instead of design tokens
- **Impact**: Theme inconsistency; may not align with dark mode properly
- **Recommendation**: Use `bg-gray-100` or similar semantic token
- **Suggested command**: `/normalize` to replace hardcoded colors

---

### 🟢 Low-Severity Issues

#### 10. Minor Animation Opacity Pattern
- **Location**: `ImageGrid.vue`, `CollectionHeader.vue`
- **Category**: Performance
- **Description**: Multiple components use CSS keyframes for fade-in animations that could be simplified
- **Impact**: Minor; animations work correctly but code could be cleaner
- **Recommendation**: Extract common animation keyframes to global CSS
- **Suggested command**: `/extract` to consolidate patterns

#### 11. Keyboard Shortcut Documentation Missing
- **Location**: `app/components/DesktopBottomNav.vue:99-151`
- **Category**: UX
- **Description**: Keyboard shortcuts (Shift+1-6, U for upload) exist but are not discoverable
- **Impact**: Power users can't discover shortcuts without reading code
- **Recommendation**: Add keyboard shortcut hints in UI or documentation
- **Suggested command**: `/clarify` to improve discoverability

#### 12. Legacy Admin Sidebar Mobile Z-Index
- **Location**: Removed component (`app/components/admin/AdminSidebar.vue`)
- **Category**: Responsive
- **Description**: Uses `z-50` for mobile toggle and `z-40` for backdrop
- **Impact**: Works correctly but could conflict with other overlays
- **Recommendation**: Document z-index hierarchy or use CSS layers
- **Suggested command**: Low priority; document in code comments

---

## Patterns & Systemic Issues

### Recurring Patterns

| Pattern | Frequency | Severity | Recommendation |
|---------|-----------|----------|----------------|
| Missing `prefers-reduced-motion` | 47/49 components | High | Add to all CSS animations |
| `dark:` variant coverage | 300+ uses | ✅ Good | Maintain consistency |
| ARIA attributes | 23 `aria-label`, proper `aria-hidden` | ✅ Good | Continue pattern |
| Touch target sizes | 2-3 instances | Medium | Audit all mobile elements |

### Positive Patterns to Maintain

1. **Navigation accessibility**: `DesktopBottomNav` is exemplary — proper `role`, `aria-label`, keyboard handling, 44px touch targets
2. **Form patterns**: `AboutContactForm` properly associates labels with inputs
3. **Image accessibility**: Images use `aria-label` for descriptions when `alt` is empty
4. **Lazy loading**: Good coverage with `loading="lazy"`
5. **Dark mode depth**: Comprehensive `dark:` variants throughout

---

## Recommendations by Priority

### Immediate (Fix Now)
1. **Remove purple colors** from `useRandomColors.ts` — directly violates user requirements
2. **Add `prefers-reduced-motion`** to `PageHeader.vue`, `CollectionHeader.vue`, `CollectionImageGrid.vue` — high accessibility impact

### Short-term (This Sprint)
3. **Increase touch targets** in `PageHeader.vue` to 44x44px minimum
4. **Fix login form labels** — add `for`/`id` associations
5. **Audit RandomColors contrast** — verify all color pairs meet WCAG AA

### Medium-term (Next Sprint)
6. **Reduce glassmorphism usage** — replace with solid translucent where possible
7. **Soften hover animations** — change `scale-120` to `scale-105` or `scale-110`
8. **Add keyboard shortcut discoverability** — tooltips or help modal

### Long-term (Nice to Have)
9. **Extract common animations** to global stylesheet
10. **Document z-index hierarchy** for overlay management
11. **Consider removing RandomColors** entirely in favor of fixed brand colors

---

## Suggested Commands for Fixes

| Issue Count | Command | Purpose |
|-------------|---------|---------|
| 4 | `/harden` | Add `prefers-reduced-motion`, fix form accessibility, add motion guards |
| 3 | `/adapt` | Fix touch targets, responsive patterns |
| 3 | `/normalize` | Replace hardcoded colors with tokens, fix contrast |
| 2 | `/quieter` | Reduce animation intensity |
| 1 | `/optimize` | Reduce glassmorphism performance impact |
| 1 | `/clarify` | Add keyboard shortcut discoverability |

---

## Conclusion

Zima Blue has a solid foundation with good accessibility patterns in place (navigation, ARIA usage, dark mode). The primary issues are:

1. **Brand compliance** — Purple colors need removal
2. **Accessibility gaps** — Reduced motion support and form associations
3. **Mobile UX** — Touch target sizes

The codebase is well-organized with clear patterns. Addressing these issues will elevate the quality from good to excellent.

---

*Audit complete. See CLAUDE.md for design principles and AGENTS.md for implementation guidelines.*
