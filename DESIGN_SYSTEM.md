# Modern SaaS UI Component Templates

This guide provides reusable templates and patterns for updating remaining admin components to match the new modern SaaS design system.

## Quick Reference

### Color System
```tsx
// Primary - Actions & Highlights
bg-emerald-600, text-emerald-600, border-emerald-300, bg-emerald-100

// Secondary - Neutral
bg-slate-600, text-slate-900, border-slate-300, bg-slate-50

// Status Colors
Success: emerald-600, emerald-100
Warning: amber-600, amber-100
Error: rose-600, rose-100
Info: blue-600, blue-100
```

### Common Components

#### Header Card
```tsx
<div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
  <h2 className="text-3xl font-bold text-slate-900">Page Title</h2>
  <p className="mt-1 text-slate-600">Subtitle or description</p>
</div>
```

#### Filter Panel
```tsx
<div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
    {options.map((option) => (
      <button
        key={option}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          active === option
            ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md"
            : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400"
        }`}
      >
        {option}
      </button>
    ))}
  </div>
</div>
```

#### Data Table Header
```tsx
<div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 bg-slate-50">
    <p className="text-sm font-medium text-slate-600">{count} items</p>
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder="Search..."
        className="w-56 rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
    </div>
  </div>
</div>
```

#### Form Fields
```tsx
// Use the Input component from ui/Input.tsx
import { Input } from "@/components/ui/Input";

<Input
  label="Field Label"
  placeholder="Enter value"
  error={error}
  helper="Helper text"
/>

// OR manual input
<label className="block text-sm font-medium text-slate-700">
  Label
</label>
<input
  type="text"
  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
/>
```

#### Buttons
```tsx
// Primary Action
<button className="rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700 transition-colors">
  Action
</button>

// Secondary
<button className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition-colors">
  Secondary
</button>

// Danger
<button className="rounded-lg bg-rose-600 px-4 py-2.5 font-medium text-white hover:bg-rose-700 transition-colors">
  Delete
</button>
```

#### Status Badges
```tsx
import { Badge } from "@/components/ui/Badge";

// Success
<Badge variant="success">Active</Badge>

// Warning
<Badge variant="warning">Pending</Badge>

// Error
<Badge variant="error">Inactive</Badge>

// Custom
<span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
  <Icon size={14} />
  Custom Badge
</span>
```

#### Alert/Error Messages
```tsx
import { Alert } from "@/components/ui/Alert";

<Alert variant="error" title="Error">
  Something went wrong
</Alert>

<Alert variant="success" title="Success">
  Operation completed
</Alert>
```

#### Modal/Dialog
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
  <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Modal Title</h2>
      </div>
      <button
        onClick={onClose}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
      >
        <X size={18} />
      </button>
    </div>
    {/* Content */}
  </div>
</div>
```

#### Card Grid
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <Card variant="elevated">
    <CardHeader>
      <CardTitle>Title</CardTitle>
      <CardDescription>Description</CardDescription>
    </CardHeader>
    <CardContent>
      {/* Content */}
    </CardContent>
  </Card>
</div>
```

## Component Update Checklist

When updating any component:

- [ ] Replace dark theme colors with new color palette
- [ ] Update card styling (use Card component)
- [ ] Update table styling (rounded corners, soft shadows, new header)
- [ ] Update button styling (gradients, hover states)
- [ ] Update badge/status styling (new colors)
- [ ] Update modal styling (rounded corners, modern shadows)
- [ ] Update form inputs (new Input component)
- [ ] Add proper spacing (4px, 8px, 16px, 24px grid)
- [ ] Update typography (font weights, sizes)
- [ ] Test responsive design
- [ ] Preserve all functionality and API calls

## Files to Update Next

1. **AdminCategoryMaster.tsx** - Category management table
2. **AdminMenuManager.tsx** - Menu items management
3. **AdminTableMaster.tsx** - Table management
4. **AdminCustomer.tsx** - Customer list
5. **AdminSettings.tsx** - Settings form
6. **AdminGuard.tsx** - Guard component styling (if needed)
7. **CartExperience.tsx** - Cart UI
8. **Order.tsx** - Order UI

## Tips for Consistency

1. Always use the new emerald color for primary actions
2. Use slate for text and neutral backgrounds
3. Keep rounded corners consistent (12px or 16px minimum)
4. Use card components instead of custom divs when possible
5. Maintain the 4px grid for spacing
6. Use soft shadows (not heavy/dark shadows)
7. Add smooth transitions on hover (200-300ms)
8. Test on mobile, tablet, and desktop
9. Ensure proper accessibility (contrast, labels, ARIA)
10. Document any custom patterns used

## Testing Checklist

- [ ] All forms submit correctly
- [ ] All buttons trigger intended actions
- [ ] All API calls work as before
- [ ] Responsive design on mobile (375px+)
- [ ] Responsive design on tablet (768px+)
- [ ] Responsive design on desktop (1024px+)
- [ ] Colors meet WCAG contrast requirements
- [ ] Keyboard navigation works
- [ ] Loading states display correctly
- [ ] Error messages display clearly
