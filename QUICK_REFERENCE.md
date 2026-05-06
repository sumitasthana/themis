# Themis Design System - Quick Reference

## Colors (Copy-Paste Ready)

```javascript
// Brand
const NAVY = "#0c1f3d";
const NAVY_MID = "#1a3358";
const NAVY_LIGHT = "#e8eef7";
const ORANGE = "#e85d20";

// Status
const GREEN = "#1a7f4b";
const GREEN_LIGHT = "#e6f5ee";
const AMBER = "#b45309";
const AMBER_LIGHT = "#fef3cd";
const RED = "#b91c1c";
const RED_LIGHT = "#fde8e8";
const BLUE = "#1d4ed8";
const BLUE_LIGHT = "#eff4ff";

// Grayscale
const G_50 = "#f9fafb";   // Page background
const G_100 = "#f3f4f6";  // Hover
const G_200 = "#e5e7eb";  // Borders
const G_300 = "#d1d5db";  // Dividers
const G_400 = "#9ca3af";  // Placeholder
const G_500 = "#6b7280";  // Secondary text
const G_600 = "#4b5563";  // Nav inactive
const G_700 = "#374151";  // Body text
const G_800 = "#1f2937";  // Headings
const G_900 = "#111827";  // Emphasis
```

## Common Patterns

### Navigation Button
```jsx
<button
  style={{
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 10px",
    borderRadius: 8,
    fontSize: 13,
    background: isActive ? "#e8eef7" : "transparent",
    color: isActive ? "#0c1f3d" : "#4b5563",
    fontWeight: isActive ? 500 : 400,
    border: "none",
    cursor: "pointer",
    transition: "all 0.15s"
  }}
>
  {label}
</button>
```

### Card
```jsx
<div style={{
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "16px 20px",
  boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)"
}}>
  {content}
</div>
```

### Metric Card
```jsx
<div style={{background:"white",border:"1px solid #e5e7eb",borderRadius:10,padding:"16px 20px"}}>
  <div style={{fontSize:10,fontWeight:500,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>
    {label}
  </div>
  <div style={{fontSize:26,fontWeight:500,color:"#1f2937",letterSpacing:"-0.02em"}}>
    {value}
  </div>
  <div style={{fontSize:11,color:"#9ca3af",fontWeight:300,marginTop:6}}>
    {subtitle}
  </div>
</div>
```

### Badge
```jsx
<span style={{
  display: "inline-flex",
  alignItems: "center",
  fontSize: 10,
  fontWeight: 500,
  padding: "2px 10px",
  borderRadius: 20,
  background: "#fde8e8",  // or GREEN_LIGHT, AMBER_LIGHT, BLUE_LIGHT
  color: "#b91c1c"        // or GREEN, AMBER, BLUE
}}>
  {label}
</span>
```

### Primary Button
```jsx
<button style={{
  padding: "8px 20px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 500,
  background: "#0c1f3d",
  color: "white",
  border: "none",
  cursor: "pointer",
  transition: "all 0.15s"
}}>
  {label}
</button>
```

### Secondary Button
```jsx
<button style={{
  padding: "6px 12px",
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 400,
  background: "transparent",
  color: "#6b7280",
  border: "1px solid #e5e7eb",
  cursor: "pointer",
  transition: "all 0.15s"
}}>
  {label}
</button>
```

### Pill/Toggle
```jsx
<button style={{
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 12px",
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 500,
  background: isActive ? "#e8eef7" : "transparent",
  border: `1px solid ${isActive ? "#0c1f3d" : "#e5e7eb"}`,
  color: isActive ? "#0c1f3d" : "#6b7280",
  cursor: "pointer"
}}>
  <div style={{width:7,height:7,borderRadius:"50%",background:isActive?"#0c1f3d":"#9ca3af"}} />
  {label}
</button>
```

## Typography Scale

```javascript
// Font sizes
text-[9px]   // Tiny labels, uppercase headers
text-[10px]  // Small labels, badges
text-[11px]  // Secondary text, descriptions
text-[12px]  // Tertiary text
text-[13px]  // Body text (default)
text-[14px]  // Section headers
text-[15px]  // Card titles
text-[22px]  // Large metrics
text-[26px]  // Hero metrics

// Font weights
300  // Light - subtle text
400  // Normal - body
500  // Medium - active nav, emphasis
600  // Semibold - headers
700  // Bold - strong emphasis
```

## Spacing

```javascript
// Padding/Margin
px-2.5 / py-1.5  // 10px / 6px  - Compact
px-3 / py-2      // 12px / 8px  - Small
px-4 / py-3      // 16px / 12px - Medium
px-5 / py-4      // 20px / 16px - Large
px-6 / py-6      // 24px / 24px - Extra large

// Gaps
gap-1    // 4px
gap-1.5  // 6px
gap-2    // 8px
gap-3    // 12px
gap-4    // 16px
gap-6    // 24px
```

## Border Radius

```javascript
4px   // Small badges
6px   // Compact buttons
8px   // Nav items, medium buttons
10px  // Cards, large buttons
14px  // Large cards
20px  // Pills, full rounded
```

## Layout Dimensions

```javascript
// Topbar
height: 52px
background: #0c1f3d
padding: 0 24px

// Sidebar
width: 220px
background: white
border-right: 1px solid #e5e7eb

// Main content
background: #f9fafb
padding: 24px (p-6)
```

## Risk Level Colors

```javascript
const RISK_COLORS = {
  CRITICAL: { bg: "#fde8e8", fg: "#b91c1c" },
  HIGH:     { bg: "#fef3cd", fg: "#b45309" },
  MEDIUM:   { bg: "#eff4ff", fg: "#1d4ed8" },
  LOW:      { bg: "#e6f5ee", fg: "#1a7f4b" },
};

// Usage
<Badge 
  style={{
    background: RISK_COLORS[level].bg,
    color: RISK_COLORS[level].fg
  }}
>
  {level}
</Badge>
```

## Status Colors

```javascript
const STATUS_COLORS = {
  CLEAR:     "#1a7f4b",  // Green
  ESCALATE:  "#b91c1c",  // Red
  REVIEW:    "#b45309",  // Amber
  OPEN:      "#1d4ed8",  // Blue
  DRAFT:     "#6d28d9",  // Purple
};
```

## Shadows

```javascript
// Card shadow
boxShadow: "0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)"

// Medium shadow
boxShadow: "0 4px 12px rgba(0,0,0,.08)"

// Large shadow
boxShadow: "0 8px 24px rgba(0,0,0,.12)"
```

## Transitions

```javascript
transition: "all 0.15s"  // Standard
transition: "all 0.2s"   // Slow
transition: "all 0.1s"   // Fast
```

## Common Measurements

```javascript
// Icon sizes
12px  // Tiny
14px  // Small
16px  // Medium
18px  // Large
20px  // Extra large

// Avatar sizes
24px  // Tiny
30px  // Small
36px  // Medium
44px  // Large

// Badge heights
16px  // Small
18px  // Medium
20px  // Large
```

## Responsive Breakpoints

```javascript
sm: 640px   // Small devices
md: 768px   // Medium devices
lg: 1024px  // Large devices
xl: 1280px  // Extra large
```

## Z-Index Layers

```javascript
z-index: 90   // Dropdowns
z-index: 100  // Modals
z-index: 200  // Popovers
z-index: 300  // Toasts
z-index: 999  // Floating buttons
```
