# Themis Design System (Based on ReconX/Kratos)

## Color Palette

### Primary Colors
- **Navy**: `#0c1f3d` - Primary brand color, topbar, buttons
- **Navy Mid**: `#1a3358` - Hover states
- **Navy Light**: `#e8eef7` - Active nav items, selected states
- **Orange**: `#e85d20` - Accent color for ReconX branding (use sparingly)

### Status Colors
- **Green**: `#1a7f4b` - Success, active, healthy
- **Green Light**: `#e6f5ee` - Success backgrounds
- **Amber**: `#b45309` - Warning, attention needed
- **Amber Light**: `#fef3cd` - Warning backgrounds
- **Red**: `#b91c1c` - Error, critical, escalate
- **Red Light**: `#fde8e8` - Error backgrounds
- **Blue**: `#1d4ed8` - Info, links
- **Blue Light**: `#eff4ff` - Info backgrounds
- **Purple**: `#6d28d9` - Special states
- **Purple Light**: `#f0ebff` - Purple backgrounds
- **Teal**: `#0f766e` - Skills, reference nodes
- **Teal Light**: `#f0fdfa` - Teal backgrounds

### Grayscale (g-*)
- `g-50`: `#f9fafb` - Page background
- `g-100`: `#f3f4f6` - Hover background
- `g-200`: `#e5e7eb` - Borders
- `g-300`: `#d1d5db` - Dividers
- `g-400`: `#9ca3af` - Placeholder text
- `g-500`: `#6b7280` - Secondary text
- `g-600`: `#4b5563` - Nav text (inactive)
- `g-700`: `#374151` - Body text
- `g-800`: `#1f2937` - Headings
- `g-900`: `#111827` - Emphasis

## Typography

### Fonts
- **Sans**: `'DM Sans', system-ui, sans-serif` - Body text
- **Mono**: `'DM Mono', 'JetBrains Mono', monospace` - Code, IDs, metrics

### Font Sizes (Tailwind classes)
- `text-[9px]` - Tiny labels, uppercase headers
- `text-[10px]` - Small labels, badges
- `text-[11px]` - Secondary text, descriptions
- `text-[12px]` - Tertiary text
- `text-[13px]` - Body text (default)
- `text-[14px]` - Section headers
- `text-[15px]` - Card titles
- `text-[16px]` - Emphasis
- `text-[22px]` - Large metrics
- `text-[26px]` - Hero metrics

### Font Weights
- `font-light` (300) - Subtle text, descriptions
- `font-normal` (400) - Body text
- `font-medium` (500) - Active nav, emphasis
- `font-semibold` (600) - Headers
- `font-bold` (700) - Strong emphasis

## Layout

### Topbar
- Height: `52px`
- Background: `#0c1f3d` (navy)
- Border: `1px solid rgba(255,255,255,.06)`
- Padding: `px-6`
- Text color: White
- Brand format: "Platform Name · Powered by [Product]X"

### Sidebar
- Width: `220px`
- Background: White
- Border: `border-r border-g-200`
- Sections separated by: `border-t border-g-100`

### Main Content
- Background: `#f9fafb` (g-50)
- Padding: `p-6`
- Max width: `max-w-[960px] mx-auto` (for focused content)

### Cards
- Class: `.card`
- Background: White
- Border: `1px solid #e5e7eb` (g-200)
- Border radius: `10px`
- Shadow: `0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)`

## Components

### Navigation Items
```jsx
<button
  className="w-full flex items-center gap-2 py-[7px] px-2.5 rounded-md text-[13px] text-left transition-all"
  style={{
    background: isActive ? '#e8eef7' : 'transparent',
    color: isActive ? '#0c1f3d' : '#4b5563',
    fontWeight: isActive ? 500 : 400,
  }}
>
  {label}
</button>
```

### Metric Cards
```jsx
<div className="card px-4 py-4">
  <div className="text-[10px] font-medium text-g-400 uppercase tracking-wider mb-2">
    {label}
  </div>
  <div className="text-[26px] font-medium leading-none tracking-tight" style={{ color: color || '#1f2937' }}>
    {value}
  </div>
  <div className="text-[11px] text-g-400 mt-1.5 font-light">{sub}</div>
</div>
```

### Badges
- **Green**: `bg-status-green-light text-status-green`
- **Amber**: `bg-status-amber-light text-status-amber`
- **Red**: `bg-status-red-light text-status-red`
- **Blue**: `bg-status-blue-light text-status-blue`
- Size: `text-[10px] font-medium px-2.5 py-0.5 rounded-full`

### Buttons

**Primary (Navy)**
```jsx
<button
  className="rounded-lg px-5 py-2 text-[13px] font-medium transition-all hover:opacity-90"
  style={{ backgroundColor: '#0c1f3d', color: '#fff' }}
>
  {label}
</button>
```

**Secondary**
```jsx
<button
  className="text-[11px] px-2.5 py-1 rounded-md border border-g-200 text-g-600 hover:bg-g-50"
>
  {label}
</button>
```

### Pills (Regulation/Scope Selector)
```jsx
<button
  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all"
  style={{
    background: isActive ? '#e8eef7' : 'transparent',
    border: `1px solid ${isActive ? '#0c1f3d' : '#e5e7eb'}`,
    color: isActive ? '#0c1f3d' : '#6b7280',
  }}
>
  <div className="w-[7px] h-[7px] rounded-full" style={{ background: dotColor }} />
  {label}
</button>
```

### Status Indicators
```jsx
// Running indicator
<div className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
  style={{
    background: 'rgba(232,93,32,.18)',
    border: '1px solid #e85d20',
    color: '#fff',
  }}
>
  <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: '#e85d20' }} />
  Running
</div>
```

## Animations

### Keyframes
```css
@keyframes rx-fadein {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
```

### Usage
- Fade in: `animation: rx-fadein 0.3s ease-out`
- Pulse dot: `animate-pulse-dot`

## Spacing

### Padding/Margin Scale
- `px-2.5` / `py-1.5` - Compact buttons
- `px-3` / `py-2` - Small buttons
- `px-4` / `py-3` - Cards, medium buttons
- `px-5` / `py-4` - Large buttons
- `px-6` / `py-6` - Page padding

### Gaps
- `gap-1` - Tight (4px)
- `gap-1.5` - Compact (6px)
- `gap-2` - Small (8px)
- `gap-3` - Medium (12px)
- `gap-4` - Large (16px)
- `gap-6` - Extra large (24px)

## Border Radius
- Default: `10px` (rounded-[10px])
- Small: `6px` (rounded-sm)
- Large: `14px` (rounded-lg)
- Full: `9999px` (rounded-full) - Pills, badges

## Scrollbar
```css
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
```

## Design Principles

1. **Clean & Professional** - Enterprise-grade financial software
2. **Information Density** - Maximize useful data per screen
3. **Subtle Hierarchy** - Use size, weight, and color sparingly
4. **Consistent Spacing** - 4px grid system
5. **Accessible Colors** - WCAG AA contrast ratios
6. **Responsive** - Mobile-first, scales to desktop
7. **Performance** - Minimal animations, fast renders

## Themis-Specific Adaptations

### Brand Colors
- Keep Navy (`#0c1f3d`) as primary
- Replace "ReconX" orange with Themis-specific accent if needed
- Use status colors for alert risk levels:
  - **CRITICAL**: Red (`#b91c1c`)
  - **HIGH**: Amber (`#b45309`)
  - **MEDIUM**: Blue (`#1d4ed8`)
  - **LOW**: Green (`#1a7f4b`)

### Alert Risk Badges
```jsx
const riskColor = {
  CRITICAL: { bg: '#fde8e8', fg: '#b91c1c' },
  HIGH: { bg: '#fef3cd', fg: '#b45309' },
  MEDIUM: { bg: '#eff4ff', fg: '#1d4ed8' },
  LOW: { bg: '#e6f5ee', fg: '#1a7f4b' },
};
```

### Navigation Structure
- **Briefing** (home/dashboard)
- **Alerts** (main alert queue)
- **Cases** (escalated investigations)
- **SAR** (SAR filing)
- **Customers** (customer profiles)
- **Model Governance** (ML models)
- **Platform Workbench** (agent studio, skills library)

### Topbar
```
"AML Intelligence Platform Built for INCEDO · Powered by Themis"
```
