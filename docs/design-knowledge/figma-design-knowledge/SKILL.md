# Figma Design Knowledge Skill

> Comprehensive design principles, patterns, and best practices sourced from Figma's Resource Library.

## Quick Reference

When building UIs, follow these core principles:

### Visual Hierarchy
1. **Size** - Larger elements draw attention first
2. **Color & Contrast** - High contrast = high importance
3. **Spacing** - White space creates groupings and breathing room
4. **Typography** - Font weight and size establish information hierarchy
5. **Position** - Top-left (in LTR) and center get most attention

### Color Usage
- **60-30-10 Rule**: 60% dominant color, 30% secondary, 10% accent
- **Limit palette**: 2-3 primary colors + neutrals
- **Ensure contrast**: WCAG AA requires 4.5:1 for text, 3:1 for large text
- **Use color meaningfully**: Red=error, Green=success, Yellow=warning, Blue=info

### Typography Best Practices
- **Limit typefaces**: 2 max (one for headings, one for body)
- **Establish scale**: Use consistent ratios (1.25x, 1.333x, 1.5x)
- **Line height**: 1.4-1.6 for body text, 1.2-1.3 for headings
- **Line length**: 45-75 characters for readability
- **Font pairing**: Contrast serif with sans-serif, or use weights from same family

### Spacing System (8px Grid)
```
4px   - Tight spacing (related elements)
8px   - Default spacing
16px  - Section spacing
24px  - Component spacing
32px  - Large section gaps
48px+ - Major page sections
```

### Layout Patterns
- **Card layouts**: Good for browseable content
- **List layouts**: Good for scannable, comparable items
- **Grid layouts**: 12-column for flexibility, 4-column for mobile
- **Hero sections**: Large visual + clear CTA above fold
- **F-pattern**: Users scan left-to-right, then down

---

## UI Component Guidelines

### Buttons
```
Primary:   Filled, high contrast - main actions
Secondary: Outlined or muted - alternative actions
Tertiary:  Text only - low-priority actions
Danger:    Red tones - destructive actions

Sizing: 
- Small:  32px height, 12px padding
- Medium: 40px height, 16px padding  
- Large:  48px height, 24px padding
```

### Forms
- Label above input (not placeholder-only)
- Show validation inline, near the error
- Required fields: asterisk or "(required)" text
- Group related fields visually
- Progressive disclosure for complex forms

### Navigation
- **Top nav**: 5-7 items max
- **Sidebar**: Good for apps with many sections
- **Bottom nav (mobile)**: 3-5 items max
- **Breadcrumbs**: For deep hierarchies
- Always show current location

### Cards
- Consistent padding (16-24px)
- Clear visual boundary (border or shadow)
- Single primary action per card
- Image ratio: 16:9 or 4:3 for consistency

---

## Responsive Design

### Breakpoints (Mobile-First)
```css
/* Mobile: 0-639px (default) */
/* Tablet: 640px+ */
@media (min-width: 640px) { }
/* Desktop: 1024px+ */
@media (min-width: 1024px) { }
/* Large: 1280px+ */
@media (min-width: 1280px) { }
```

### Mobile Considerations
- Touch targets: 44x44px minimum
- Thumb-friendly zones for primary actions
- Stack layouts vertically
- Larger text (16px+ base)
- Simplified navigation

---

## UX Principles

### Gestalt Principles
1. **Proximity** - Near items seem related
2. **Similarity** - Similar items seem grouped
3. **Continuity** - Eye follows lines/curves
4. **Closure** - Mind completes incomplete shapes
5. **Figure/Ground** - Distinguish foreground from background

### Interaction Design
- **Feedback**: Every action needs a response
- **Affordance**: Elements should look interactive
- **Consistency**: Same action = same result
- **Error prevention**: Better than error recovery
- **Undo support**: Let users reverse actions

### Fitts's Law
> Time to reach target = f(distance / size)

- Make important buttons larger
- Place frequent actions near cursor/thumb
- Edge/corner positioning is faster to hit

---

## Accessibility (WCAG 2.1)

### Must-Have
- [ ] Color contrast ratios met (4.5:1 text, 3:1 UI)
- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible
- [ ] Alt text for meaningful images
- [ ] Form labels properly associated
- [ ] Error messages descriptive

### Should-Have
- [ ] Skip navigation link
- [ ] Proper heading hierarchy (h1→h2→h3)
- [ ] ARIA labels where needed
- [ ] Reduced motion option
- [ ] Touch targets 44x44px+

---

## Design System Tokens

### Recommended Token Structure
```javascript
const tokens = {
  colors: {
    primary: { 50: '#...', 500: '#...', 900: '#...' },
    neutral: { 50: '#...', 100: '#...', /* ... */ 900: '#...' },
    success: '#...',
    warning: '#...',
    error: '#...',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '24px',
    '2xl': '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '16px',
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
  },
}
```

---

## Using the Full Article Library

For deeper knowledge on specific topics, read the markdown files in `./articles/`:

```bash
# List available articles
ls ./articles/

# Read specific topic
cat ./articles/what-is-ux-design.md
cat ./articles/color-combinations.md
cat ./articles/responsive-website-design.md
```

### Key Articles by Topic

**Starting a new project?**
- `what-is-design-thinking.md` - Design process overview
- `how-to-design-an-app.md` - App design workflow
- `what-is-wireframing.md` - Early-stage planning

**Working on visuals?**
- `color-combinations.md` - 100 color palette examples
- `typography-in-design.md` - Type fundamentals
- `visual-hierarchy.md` - Layout priorities

**Building components?**
- `ui-design-principles.md` - Core UI patterns
- `design-system-examples.md` - System architecture
- `consistency-in-design.md` - Maintaining coherence

**Improving UX?**
- `ux-design-research-methods.md` - Research techniques
- `gestalt-principles.md` - Perception psychology
- `creating-accessible-and-inclusive-design.md` - A11y guide

---

## Scraping More Articles

To fetch the full article library:

```bash
cd figma-design-knowledge
bun run scrape-figma.ts
```

This will download 65+ curated articles covering:
- UI/UX Design Principles
- Prototyping & Wireframing
- Web Design
- Color Theory
- Typography
- Brand & Storytelling
- Research & Strategy
