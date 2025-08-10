# Design System - Athena PKM System

## Overview

The Athena Design System provides a comprehensive set of guidelines, components, and patterns that ensure consistency, accessibility, and scalability across the entire product ecosystem. This system serves as the single source of truth for all design and development decisions.

## Design Philosophy

### Core Principles

#### 1. Paper-Inspired Digital Experience
- **Natural Interactions**: Familiar patterns from physical paper
- **Spatial Organization**: Intuitive content arrangement
- **Tactile Feedback**: Subtle animations and transitions
- **Focus and Clarity**: Minimal distractions, clear hierarchy

#### 2. Accessibility First
- **Universal Design**: Usable by everyone, regardless of ability
- **WCAG 2.1 AA Compliance**: Meeting accessibility standards
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Optimization**: Semantic markup and ARIA labels

#### 3. Performance-Driven
- **Lightweight Components**: Optimized for fast loading
- **Efficient Rendering**: Minimal DOM manipulation
- **Progressive Enhancement**: Core functionality first
- **Responsive by Default**: Adaptive across all devices

#### 4. Scalable Architecture
- **Modular Components**: Reusable, composable elements
- **Design Tokens**: Consistent values across platforms
- **Systematic Naming**: Predictable component structure
- **Version Management**: Controlled evolution and updates

## Visual Foundation

### Color Palette

#### Primary Colors
```css
--color-primary-50: #f0f9ff
--color-primary-100: #e0f2fe
--color-primary-500: #0ea5e9  /* Primary brand color */
--color-primary-600: #0284c7
--color-primary-900: #0c4a6e
```

#### Semantic Colors
```css
--color-success: #059669
--color-warning: #d97706
--color-error: #dc2626
--color-info: #2563eb
```

#### Neutral Colors
```css
--color-neutral-0: #ffffff    /* Pure white */
--color-neutral-50: #f9fafb   /* Light background */
--color-neutral-100: #f3f4f6  /* Card background */
--color-neutral-200: #e5e7eb  /* Border light */
--color-neutral-400: #9ca3af  /* Text muted */
--color-neutral-600: #4b5563  /* Text secondary */
--color-neutral-900: #111827  /* Text primary */
```

#### Dark Mode Colors
```css
--color-neutral-0-dark: #0f172a    /* Dark background */
--color-neutral-50-dark: #1e293b   /* Dark card background */
--color-neutral-100-dark: #334155  /* Dark border */
```

### Typography

#### Font Families
```css
--font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
--font-family-mono: 'JetBrains Mono', 'Fira Code', monospace
--font-family-serif: 'Merriweather', Georgia, serif
```

#### Font Scale
```css
--font-size-xs: 0.75rem     /* 12px */
--font-size-sm: 0.875rem    /* 14px */
--font-size-base: 1rem      /* 16px */
--font-size-lg: 1.125rem    /* 18px */
--font-size-xl: 1.25rem     /* 20px */
--font-size-2xl: 1.5rem     /* 24px */
--font-size-3xl: 1.875rem   /* 30px */
--font-size-4xl: 2.25rem    /* 36px */
```

#### Font Weights
```css
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

#### Line Heights
```css
--line-height-tight: 1.25
--line-height-normal: 1.5
--line-height-relaxed: 1.75
```

### Spacing System

#### Base Unit
```css
--space-unit: 0.25rem  /* 4px base unit */
```

#### Spacing Scale
```css
--space-1: 0.25rem    /* 4px */
--space-2: 0.5rem     /* 8px */
--space-3: 0.75rem    /* 12px */
--space-4: 1rem       /* 16px */
--space-5: 1.25rem    /* 20px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
--space-10: 2.5rem    /* 40px */
--space-12: 3rem      /* 48px */
--space-16: 4rem      /* 64px */
--space-20: 5rem      /* 80px */
```

### Border Radius
```css
--radius-none: 0
--radius-sm: 0.125rem    /* 2px */
--radius-base: 0.25rem   /* 4px */
--radius-md: 0.375rem    /* 6px */
--radius-lg: 0.5rem      /* 8px */
--radius-xl: 0.75rem     /* 12px */
--radius-full: 9999px    /* Circular */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
```

## Component Library

### Core Components

#### Buttons
```vue
<!-- Primary Button -->
<AthenaButton variant="primary" size="medium">
  Create Document
</AthenaButton>

<!-- Secondary Button -->
<AthenaButton variant="secondary" size="medium">
  Cancel
</AthenaButton>

<!-- Button Variants -->
- primary: Main call-to-action
- secondary: Alternative actions
- outline: Subtle emphasis
- ghost: Minimal visual weight
- danger: Destructive actions
```

#### Input Fields
```vue
<!-- Text Input -->
<AthenaInput 
  v-model="value"
  label="Document Title"
  placeholder="Enter title..."
  :required="true"
/>

<!-- Textarea -->
<AthenaTextarea
  v-model="content"
  label="Description"
  rows="4"
/>

<!-- Select Dropdown -->
<AthenaSelect
  v-model="selected"
  label="Document Type"
  :options="documentTypes"
/>
```

#### Navigation
```vue
<!-- Tab Navigation -->
<AthenaTabs v-model="activeTab">
  <AthenaTab key="overview" label="Overview" />
  <AthenaTab key="details" label="Details" />
  <AthenaTab key="settings" label="Settings" />
</AthenaTabs>

<!-- Breadcrumbs -->
<AthenaBreadcrumbs :items="breadcrumbItems" />

<!-- Pagination -->
<AthenaPagination 
  :current-page="currentPage"
  :total-pages="totalPages"
  @page-change="handlePageChange"
/>
```

#### Cards and Containers
```vue
<!-- Content Card -->
<AthenaCard>
  <AthenaCardHeader>
    <AthenaCardTitle>Document Preview</AthenaCardTitle>
  </AthenaCardHeader>
  <AthenaCardContent>
    <!-- Card content -->
  </AthenaCardContent>
</AthenaCard>

<!-- Modal Dialog -->
<AthenaModal v-model="showModal" title="Create Workspace">
  <!-- Modal content -->
</AthenaModal>
```

#### Data Display
```vue
<!-- Table -->
<AthenaTable>
  <AthenaTableHeader>
    <AthenaTableRow>
      <AthenaTableHead>Name</AthenaTableHead>
      <AthenaTableHead>Modified</AthenaTableHead>
      <AthenaTableHead>Size</AthenaTableHead>
    </AthenaTableRow>
  </AthenaTableHeader>
  <AthenaTableBody>
    <!-- Table rows -->
  </AthenaTableBody>
</AthenaTable>

<!-- List -->
<AthenaList>
  <AthenaListItem v-for="item in items" :key="item.id">
    {{ item.name }}
  </AthenaListItem>
</AthenaList>
```

### Specialized Components

#### Editor Components
```vue
<!-- Block Editor -->
<AthenaBlockEditor v-model="content" />

<!-- Slash Command Menu -->
<AthenaSlashMenu 
  :commands="availableCommands"
  @command-select="handleCommand"
/>

<!-- Content Block -->
<AthenaContentBlock
  :type="block.type"
  :content="block.content"
  @update="updateBlock"
/>
```

#### Workspace Components
```vue
<!-- Workspace Switcher -->
<AthenaWorkspaceSwitcher 
  v-model="currentWorkspace"
  :workspaces="userWorkspaces"
/>

<!-- Document Tree -->
<AthenaDocumentTree 
  :documents="workspaceDocuments"
  @document-select="openDocument"
/>

<!-- Tab Bar -->
<AthenaTabBar 
  :tabs="openTabs"
  :active-tab="activeTab"
  @tab-change="switchTab"
  @tab-close="closeTab"
/>
```

## Layout System

### Grid System
```css
/* 12-column grid */
.athena-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-4);
}

.athena-col-1 { grid-column: span 1; }
.athena-col-2 { grid-column: span 2; }
.athena-col-3 { grid-column: span 3; }
/* ... up to col-12 */
```

### Layout Containers
```css
/* Main container */
.athena-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

/* Section container */
.athena-section {
  padding: var(--space-8) 0;
}

/* Card container */
.athena-card-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
}
```

### Responsive Breakpoints
```css
/* Mobile first approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

## Iconography

### Icon System
- **Icon Library**: Lucide icons for consistency
- **Size Variants**: 12px, 16px, 20px, 24px, 32px
- **Style Guidelines**: Consistent stroke width and style
- **Custom Icons**: Document type indicators, workspace icons

### Icon Usage
```vue
<!-- Standard Icon -->
<AthenaIcon name="plus" size="16" />

<!-- Icon Button -->
<AthenaIconButton icon="settings" variant="ghost" />

<!-- Icon with Text -->
<AthenaButton icon="plus" variant="primary">
  Create Document
</AthenaButton>
```

## Animation & Transitions

### Motion Principles
- **Purposeful**: Animations serve a functional purpose
- **Natural**: Smooth, organic movement patterns
- **Fast**: Quick transitions that don't delay users
- **Accessible**: Respects reduced motion preferences

### Transition Values
```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1)
```

### Common Animations
```css
/* Fade in/out */
.fade-enter-active, .fade-leave-active {
  transition: opacity var(--transition-base);
}

/* Slide transitions */
.slide-enter-active, .slide-leave-active {
  transition: transform var(--transition-base);
}

/* Scale animations */
.scale-enter-active, .scale-leave-active {
  transition: transform var(--transition-fast);
}
```

## Accessibility Guidelines

### Color and Contrast
- **Text Contrast**: 4.5:1 minimum for normal text
- **Large Text**: 3:1 minimum for 18px+ or 14px+ bold
- **Non-text Elements**: 3:1 minimum for UI components
- **Color Independence**: Never rely solely on color

### Keyboard Navigation
- **Tab Order**: Logical, predictable sequence
- **Focus Indicators**: Visible focus states
- **Keyboard Shortcuts**: Documented and consistent
- **Skip Links**: Allow bypassing repetitive content

### Screen Reader Support
- **Semantic HTML**: Proper element usage
- **ARIA Labels**: Descriptive labels for complex elements
- **Landmarks**: Clear page structure
- **Live Regions**: Dynamic content announcements

## Design Tokens

### Token Structure
```json
{
  "color": {
    "brand": {
      "primary": {
        "value": "#0ea5e9",
        "type": "color"
      }
    }
  },
  "typography": {
    "font": {
      "family": {
        "base": {
          "value": "Inter, sans-serif",
          "type": "fontFamily"
        }
      }
    }
  },
  "space": {
    "4": {
      "value": "16px",
      "type": "spacing"
    }
  }
}
```

### Token Usage
- **Design Tools**: Figma variables and styles
- **Development**: CSS custom properties
- **Documentation**: Automated style guide generation
- **Maintenance**: Single source of truth updates

---

**Document Owner**: Design System Team  
**Last Updated**: [Date]  
**Version**: 1.0  
**Next Review**: [Date]