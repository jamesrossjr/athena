# 🎨 Athena Design System

**Version**: 1.0  
**Last Updated**: August 2025  
**Owner**: Design Team  
**Status**: Active Development  

## Design Philosophy

Athena's design philosophy centers on **Invisible Intelligence** - creating an interface so intuitive that the technology disappears, allowing users to focus entirely on their thoughts and work. Our design system embodies simplicity, consistency, and contextual intelligence.

### Core Principles

#### 1. Invisible Interface
The interface should never distract from the content. Every element serves a purpose and enhances the user's ability to think and create.

#### 2. Contextual Intelligence
The interface adapts to what the user is doing, surfacing relevant tools and hiding unnecessary complexity.

#### 3. Seamless Transformation
Content should flow effortlessly between different page types (document → database → whiteboard) without jarring interface changes.

#### 4. Collaborative Clarity
When multiple users are present, the interface clearly indicates presence and activity without overwhelming the primary content.

#### 5. Progressive Disclosure
Advanced features are available when needed but hidden by default, maintaining interface simplicity.

## Visual Identity

### Brand Colors

#### Primary Palette
```scss
// Primary Brand Colors
$athena-blue: #2563eb;        // Primary action color
$athena-blue-light: #3b82f6;  // Hover states
$athena-blue-dark: #1d4ed8;   // Active states

// Secondary Colors
$athena-purple: #7c3aed;      // AI features
$athena-green: #059669;       // Success states
$athena-amber: #d97706;       // Warning states
$athena-red: #dc2626;         // Error states
```

#### Neutral Palette
```scss
// Neutral Grays
$gray-50: #f9fafb;   // Background light
$gray-100: #f3f4f6;  // Background medium
$gray-200: #e5e7eb;  // Borders light
$gray-300: #d1d5db;  // Borders medium
$gray-400: #9ca3af;  // Text muted
$gray-500: #6b7280;  // Text secondary
$gray-600: #4b5563;  // Text primary light
$gray-700: #374151;  // Text primary
$gray-800: #1f2937;  // Text primary dark
$gray-900: #111827;  // Text primary darkest
```

#### Semantic Colors
```scss
// Status Colors
$success: #10b981;
$warning: #f59e0b;
$error: #ef4444;
$info: #3b82f6;

// Background Variants
$bg-primary: #ffffff;
$bg-secondary: #f9fafb;
$bg-tertiary: #f3f4f6;
$bg-inverse: #111827;
```

### Typography

#### Font Family
```scss
// Primary typeface - Inter
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

$font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;

// Monospace for code
$font-family-mono: 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', 'Fira Code', monospace;
```

#### Type Scale
```scss
// Font sizes following a modular scale (1.125 - major second)
$text-xs: 0.75rem;    // 12px
$text-sm: 0.875rem;   // 14px
$text-base: 1rem;     // 16px
$text-lg: 1.125rem;   // 18px
$text-xl: 1.25rem;    // 20px
$text-2xl: 1.5rem;    // 24px
$text-3xl: 1.875rem;  // 30px
$text-4xl: 2.25rem;   // 36px
$text-5xl: 3rem;      // 48px
$text-6xl: 3.75rem;   // 60px
```

#### Font Weights
```scss
$font-light: 300;
$font-normal: 400;
$font-medium: 500;
$font-semibold: 600;
$font-bold: 700;
```

#### Line Heights
```scss
$leading-tight: 1.25;
$leading-snug: 1.375;
$leading-normal: 1.5;
$leading-relaxed: 1.625;
$leading-loose: 2;
```

### Spacing System

```scss
// Spacing scale based on 0.25rem (4px) increments
$space-0: 0;
$space-1: 0.25rem;   // 4px
$space-2: 0.5rem;    // 8px
$space-3: 0.75rem;   // 12px
$space-4: 1rem;      // 16px
$space-5: 1.25rem;   // 20px
$space-6: 1.5rem;    // 24px
$space-8: 2rem;      // 32px
$space-10: 2.5rem;   // 40px
$space-12: 3rem;     // 48px
$space-16: 4rem;     // 64px
$space-20: 5rem;     // 80px
$space-24: 6rem;     // 96px
$space-32: 8rem;     // 128px
```

### Border Radius

```scss
$radius-none: 0;
$radius-sm: 0.125rem;   // 2px
$radius-base: 0.25rem;  // 4px
$radius-md: 0.375rem;   // 6px
$radius-lg: 0.5rem;     // 8px
$radius-xl: 0.75rem;    // 12px
$radius-2xl: 1rem;      // 16px
$radius-full: 9999px;   // Circular
```

### Shadows

```scss
// Elevation system
$shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
$shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
$shadow-base: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
$shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
$shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
$shadow-xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

// Special shadows
$shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
$shadow-glow: 0 0 0 3px rgba(37, 99, 235, 0.1);
```

## Component Library

### Buttons

#### Primary Button
```vue
<template>
  <button 
    class="btn btn-primary"
    :class="[
      `btn-${size}`,
      { 'btn-loading': loading, 'btn-disabled': disabled }
    ]"
    :disabled="disabled || loading"
  >
    <Icon v-if="loading" name="spinner" class="animate-spin" />
    <Icon v-else-if="icon" :name="icon" />
    <slot />
  </button>
</template>

<style scoped>
.btn {
  @apply inline-flex items-center justify-center font-medium transition-all duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply bg-athena-blue text-white hover:bg-athena-blue-light focus:ring-athena-blue;
}

.btn-sm { @apply px-3 py-1.5 text-sm; }
.btn-md { @apply px-4 py-2 text-base; }
.btn-lg { @apply px-6 py-3 text-lg; }

.btn-loading { @apply opacity-75 cursor-not-allowed; }
.btn-disabled { @apply opacity-50 cursor-not-allowed; }
</style>
```

#### Button Variants
- **Primary**: Main actions (Create, Save, Submit)
- **Secondary**: Secondary actions (Cancel, Edit)
- **Ghost**: Subtle actions (Close, Minimize)
- **Danger**: Destructive actions (Delete, Remove)

### Inputs

#### Text Input
```vue
<template>
  <div class="input-group">
    <label v-if="label" class="input-label">{{ label }}</label>
    <div class="input-wrapper">
      <Icon v-if="icon" :name="icon" class="input-icon" />
      <input
        v-model="value"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        class="input"
        :class="[
          { 'input-error': error, 'input-disabled': disabled, 'pl-10': icon }
        ]"
      />
    </div>
    <p v-if="error" class="input-error-text">{{ error }}</p>
    <p v-else-if="hint" class="input-hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
         focus:ring-2 focus:ring-athena-blue focus:border-athena-blue
         transition-colors duration-200;
}

.input-error {
  @apply border-red-300 focus:ring-red-500 focus:border-red-500;
}

.input-disabled {
  @apply bg-gray-100 cursor-not-allowed opacity-75;
}

.input-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.input-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4;
}

.input-wrapper {
  @apply relative;
}

.input-error-text {
  @apply mt-1 text-sm text-red-600;
}

.input-hint {
  @apply mt-1 text-sm text-gray-500;
}
</style>
```

### Command Palette

```vue
<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog @close="close" class="command-palette-dialog">
      <TransitionChild
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
        <TransitionChild
          enter="ease-out duration-200"
          enter-from="opacity-0 scale-95"
          enter-to="opacity-100 scale-100"
          leave="ease-in duration-150"
          leave-from="opacity-100 scale-100"
          leave-to="opacity-0 scale-95"
        >
          <DialogPanel class="command-palette-panel">
            <!-- Search Input -->
            <div class="command-search">
              <Icon name="search" class="search-icon" />
              <input
                v-model="query"
                placeholder="Type a command or describe what you want to do..."
                class="search-input"
                @keydown="handleKeydown"
              />
              <div class="ai-indicator" v-if="isAiEnabled">
                <Icon name="sparkles" class="text-athena-purple" />
              </div>
            </div>

            <!-- AI Interpretation -->
            <div v-if="aiInterpretation" class="ai-interpretation">
              <div class="ai-header">
                <Icon name="robot" class="text-athena-purple" />
                <span>I understand you want to:</span>
              </div>
              <div class="ai-steps">
                <div v-for="step in aiInterpretation.steps" :key="step.id" class="ai-step">
                  {{ step.description }}
                </div>
              </div>
              <div class="ai-confidence">
                Confidence: {{ aiInterpretation.confidence }}%
              </div>
              <div class="ai-actions">
                <button class="btn btn-primary btn-sm" @click="executeAiCommand">
                  Execute
                </button>
                <button class="btn btn-secondary btn-sm" @click="modifyAiCommand">
                  Modify
                </button>
              </div>
            </div>

            <!-- Command Results -->
            <div class="command-results">
              <div v-if="quickActions.length" class="command-section">
                <h3 class="section-title">Quick Actions</h3>
                <div class="quick-actions-grid">
                  <button
                    v-for="action in quickActions"
                    :key="action.id"
                    class="quick-action"
                    @click="executeCommand(action)"
                  >
                    <Icon :name="action.icon" />
                    <span>{{ action.name }}</span>
                  </button>
                </div>
              </div>

              <div v-if="filteredCommands.length" class="command-section">
                <h3 class="section-title">Commands</h3>
                <div class="command-list">
                  <div
                    v-for="(command, index) in filteredCommands"
                    :key="command.id"
                    class="command-item"
                    :class="{ 'command-item-selected': selectedIndex === index }"
                    @click="executeCommand(command)"
                  >
                    <Icon :name="command.icon" class="command-icon" />
                    <div class="command-content">
                      <div class="command-name">{{ command.name }}</div>
                      <div class="command-description">{{ command.description }}</div>
                    </div>
                    <div class="command-shortcut" v-if="command.shortcut">
                      {{ command.shortcut }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<style scoped>
.command-palette-panel {
  @apply mx-auto max-w-2xl transform divide-y divide-gray-100 overflow-hidden 
         rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 
         transition-all;
}

.command-search {
  @apply relative flex items-center px-4 py-4;
}

.search-icon {
  @apply h-5 w-5 text-gray-400 mr-3;
}

.search-input {
  @apply flex-1 border-0 bg-transparent text-lg text-gray-800 placeholder-gray-400 
         focus:outline-none focus:ring-0;
}

.ai-indicator {
  @apply flex items-center px-3;
}

.ai-interpretation {
  @apply p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100;
}

.ai-header {
  @apply flex items-center text-sm font-medium text-purple-700 mb-2;
}

.ai-steps {
  @apply space-y-1 mb-3;
}

.ai-step {
  @apply text-sm text-gray-700 pl-6 relative;
}

.ai-step::before {
  @apply absolute left-0 top-1 w-1 h-1 bg-purple-400 rounded-full;
  content: '';
}

.ai-confidence {
  @apply text-xs text-purple-600 mb-3;
}

.ai-actions {
  @apply flex space-x-2;
}

.command-results {
  @apply max-h-96 overflow-y-auto;
}

.command-section {
  @apply p-4;
}

.section-title {
  @apply text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3;
}

.quick-actions-grid {
  @apply grid grid-cols-3 gap-2;
}

.quick-action {
  @apply flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 
         transition-colors duration-150 text-center;
}

.quick-action svg {
  @apply w-6 h-6 text-gray-600 mb-1;
}

.quick-action span {
  @apply text-xs text-gray-700;
}

.command-list {
  @apply space-y-1;
}

.command-item {
  @apply flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer
         transition-colors duration-150;
}

.command-item-selected {
  @apply bg-athena-blue text-white;
}

.command-icon {
  @apply w-5 h-5 text-gray-500 mr-3;
  
  .command-item-selected & {
    @apply text-white;
  }
}

.command-content {
  @apply flex-1 min-w-0;
}

.command-name {
  @apply text-sm font-medium text-gray-900;
  
  .command-item-selected & {
    @apply text-white;
  }
}

.command-description {
  @apply text-xs text-gray-500 truncate;
  
  .command-item-selected & {
    @apply text-blue-100;
  }
}

.command-shortcut {
  @apply text-xs text-gray-400 font-mono;
  
  .command-item-selected & {
    @apply text-blue-100;
  }
}
</style>
```

## Layout System

### Grid System
```scss
// 12-column responsive grid
.grid {
  display: grid;
  gap: $space-4;
  
  &.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  &.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  &.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  &.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  &.grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  &.grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }
}

// Container system
.container {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 $space-4;
  
  @media (min-width: 640px) { max-width: 640px; }
  @media (min-width: 768px) { max-width: 768px; }
  @media (min-width: 1024px) { max-width: 1024px; }
  @media (min-width: 1280px) { max-width: 1280px; }
  @media (min-width: 1536px) { max-width: 1536px; }
}
```

### App Shell Layout
```vue
<template>
  <div class="app-shell">
    <!-- Command Palette (Global) -->
    <CommandPalette 
      :is-open="commandPaletteOpen" 
      @close="commandPaletteOpen = false" 
    />
    
    <!-- AI Chat (Global) -->
    <GlobalAiChat 
      :is-open="aiChatOpen" 
      @close="aiChatOpen = false" 
    />
    
    <!-- Main Content Area -->
    <main class="main-content">
      <slot />
    </main>
    
    <!-- Status Bar -->
    <StatusBar class="status-bar" />
  </div>
</template>

<style scoped>
.app-shell {
  @apply min-h-screen bg-gray-50 flex flex-col;
}

.main-content {
  @apply flex-1 flex flex-col;
}

.status-bar {
  @apply h-6 bg-gray-100 border-t border-gray-200;
}
</style>
```

## Responsive Design

### Breakpoints
```scss
$breakpoints: (
  'sm': 640px,   // Mobile landscape
  'md': 768px,   // Tablet portrait
  'lg': 1024px,  // Tablet landscape / Small desktop
  'xl': 1280px,  // Desktop
  '2xl': 1536px  // Large desktop
);

// Media query mixins
@mixin mobile-only {
  @media (max-width: #{map-get($breakpoints, 'sm') - 1px}) {
    @content;
  }
}

@mixin tablet-up {
  @media (min-width: #{map-get($breakpoints, 'md')}) {
    @content;
  }
}

@mixin desktop-up {
  @media (min-width: #{map-get($breakpoints, 'lg')}) {
    @content;
  }
}
```

### Mobile-First Approach
```scss
// Example responsive component
.document-editor {
  // Mobile styles (default)
  padding: $space-4;
  font-size: $text-sm;
  
  // Tablet and up
  @include tablet-up {
    padding: $space-6;
    font-size: $text-base;
  }
  
  // Desktop and up
  @include desktop-up {
    padding: $space-8;
    font-size: $text-lg;
  }
}
```

## Animation & Transitions

### Motion Principles
1. **Purposeful**: Every animation serves a functional purpose
2. **Responsive**: Animations respond to user input and system changes
3. **Natural**: Movements feel physics-based and realistic
4. **Efficient**: Smooth 60fps performance across devices

### Transition System
```scss
// Duration scale
$duration-75: 75ms;
$duration-100: 100ms;
$duration-150: 150ms;
$duration-200: 200ms;
$duration-300: 300ms;
$duration-500: 500ms;
$duration-700: 700ms;
$duration-1000: 1000ms;

// Easing functions
$ease-linear: linear;
$ease-in: cubic-bezier(0.4, 0, 1, 1);
$ease-out: cubic-bezier(0, 0, 0.2, 1);
$ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

// Common transitions
.transition-all { transition: all $duration-150 $ease-in-out; }
.transition-colors { transition: color $duration-150 $ease-in-out, background-color $duration-150 $ease-in-out; }
.transition-opacity { transition: opacity $duration-150 $ease-in-out; }
.transition-transform { transition: transform $duration-150 $ease-in-out; }
```

### Vue Transitions
```vue
<template>
  <!-- Fade transition -->
  <Transition name="fade" mode="out-in">
    <component :is="currentComponent" />
  </Transition>
  
  <!-- Slide transition -->
  <Transition name="slide-up" appear>
    <div class="modal-content">
      Content here
    </div>
  </Transition>
</template>

<style scoped>
/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity $duration-200 $ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide up transition */
.slide-up-enter-active {
  transition: all $duration-300 $ease-out;
}

.slide-up-leave-active {
  transition: all $duration-200 $ease-in;
}

.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
```

## Accessibility

### Focus Management
```scss
// Focus ring system
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-athena-blue focus:ring-offset-2;
}

.focus-ring-inset {
  @apply focus:outline-none focus:ring-2 focus:ring-athena-blue focus:ring-inset;
}

// High contrast mode support
@media (prefers-contrast: high) {
  .focus-ring {
    @apply focus:ring-4 focus:ring-black;
  }
}
```

### Color Contrast
All color combinations meet WCAG 2.1 AA standards:
- Normal text: 4.5:1 contrast ratio minimum
- Large text: 3:1 contrast ratio minimum
- UI components: 3:1 contrast ratio minimum

### Screen Reader Support
```vue
<template>
  <!-- Semantic HTML structure -->
  <main role="main" aria-label="Document editor">
    <h1 class="sr-only">{{ pageTitle }}</h1>
    
    <!-- Skip navigation link -->
    <a href="#main-content" class="skip-link">
      Skip to main content
    </a>
    
    <!-- Command palette button -->
    <button
      aria-label="Open command palette"
      aria-keyshortcuts="Control+K"
      @click="openCommandPalette"
    >
      <Icon name="command" aria-hidden="true" />
    </button>
    
    <!-- Content area with proper landmarks -->
    <section id="main-content" aria-label="Page content">
      <slot />
    </section>
  </main>
</template>

<style scoped>
.sr-only {
  @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
}

.skip-link {
  @apply absolute top-0 left-0 bg-athena-blue text-white p-2 rounded
         transform -translate-y-full focus:translate-y-0 z-50;
}
</style>
```

## Dark Mode

### Color Tokens
```scss
// CSS custom properties for theme switching
:root {
  --color-bg-primary: #{$bg-primary};
  --color-bg-secondary: #{$bg-secondary};
  --color-text-primary: #{$gray-900};
  --color-text-secondary: #{$gray-600};
  --color-border: #{$gray-200};
}

[data-theme="dark"] {
  --color-bg-primary: #1f2937;
  --color-bg-secondary: #111827;
  --color-text-primary: #f9fafb;
  --color-text-secondary: #d1d5db;
  --color-border: #374151;
}

// Usage in components
.card {
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}
```

### Theme Toggle
```vue
<template>
  <button
    @click="toggleTheme"
    class="theme-toggle"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <Icon :name="isDark ? 'sun' : 'moon'" />
  </button>
</template>

<script setup>
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const toggleTheme = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>
```

## Performance Guidelines

### CSS Performance
1. **Minimize reflows**: Use `transform` and `opacity` for animations
2. **Layer management**: Use `will-change` sparingly
3. **Critical CSS**: Inline critical styles, lazy load non-critical
4. **Purge unused CSS**: Remove unused Tailwind classes in production

### Component Performance
1. **Lazy loading**: Load components only when needed
2. **Virtual scrolling**: For large lists and tables
3. **Memoization**: Cache expensive computations
4. **Bundle splitting**: Code splitting by route and feature

---

**Related Documents**
- [Component Library](./01_COMPONENT_LIBRARY.md)
- [User Research](./01_user_research/README.md)
- [Interaction Patterns](./02_interaction_patterns.md)
- [Brand Guidelines](./03_brand_guidelines.md)