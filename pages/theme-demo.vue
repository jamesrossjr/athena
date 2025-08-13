<template>
  <div class="min-h-screen p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold mb-8 text-primary">Athena Theme System Demo</h1>
      
      <!-- Theme Status -->
      <div class="mb-8 p-4 bg-surface border border-default rounded-lg">
        <h2 class="text-xl font-semibold mb-2">Current Theme</h2>
        <p class="text-secondary">
          <strong>Theme:</strong> {{ theme.label }} <span class="ml-2">{{ theme.icon }}</span>
        </p>
        <p class="text-secondary">
          <strong>Layout:</strong> {{ layoutConfig.displayName }} <span class="ml-2">{{ layoutConfig.icon }}</span>
        </p>
        <p class="text-secondary">
          <strong>Status:</strong> {{ themeStatus }}
        </p>
      </div>

      <!-- Theme Controls -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Theme Switcher -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Theme Controls</h3>
          <div class="space-y-2">
            <button
              v-for="themeOption in availableThemes"
              :key="themeOption.name"
              @click="setTheme(themeOption.name)"
              :class="[
                'w-full p-3 rounded-lg border text-left transition-all',
                currentTheme === themeOption.name
                  ? 'border-accent bg-accent-light text-accent'
                  : 'border-default bg-surface hover:bg-surface-secondary'
              ]"
            >
              <div class="flex items-center gap-3">
                <span class="text-xl">{{ themeOption.icon }}</span>
                <div>
                  <div class="font-medium">{{ themeOption.displayName }}</div>
                  <div class="text-sm text-secondary">{{ themeOption.description }}</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Layout Controls -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold">Layout Controls</h3>
          <div class="space-y-2">
            <button
              v-for="layout in availableLayouts"
              :key="layout.name"
              @click="setLayout(layout.name)"
              :class="[
                'w-full p-3 rounded-lg border text-left transition-all',
                currentLayout === layout.name
                  ? 'border-accent bg-accent-light text-accent'
                  : 'border-default bg-surface hover:bg-surface-secondary'
              ]"
            >
              <div class="flex items-center gap-3">
                <span class="text-xl">{{ layout.icon }}</span>
                <div>
                  <div class="font-medium">{{ layout.displayName }}</div>
                  <div class="text-sm text-secondary">{{ layout.description }}</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Theme Demo Content -->
      <div class="space-y-6">
        <h2 class="text-2xl font-semibold">Theme Showcase</h2>
        
        <!-- Typography Demo -->
        <div class="bg-surface border border-default rounded-lg p-6">
          <h3 class="text-xl font-semibold mb-4">Typography</h3>
          <div class="space-y-4">
            <h1 class="text-3xl font-bold text-primary">Heading 1</h1>
            <h2 class="text-2xl font-semibold text-primary">Heading 2</h2>
            <h3 class="text-xl font-medium text-primary">Heading 3</h3>
            <p class="text-primary">
              This is primary text. It's used for main content and should have high contrast.
            </p>
            <p class="text-secondary">
              This is secondary text. It's used for supporting information and descriptions.
            </p>
            <p class="text-muted">
              This is muted text. It's used for less important information and metadata.
            </p>
            <p class="text-accent">
              This is accent text. It's used for links and interactive elements.
            </p>
          </div>
        </div>

        <!-- Interactive Elements -->
        <div class="bg-surface border border-default rounded-lg p-6">
          <h3 class="text-xl font-semibold mb-4">Interactive Elements</h3>
          <div class="space-y-4">
            <div class="flex gap-2 flex-wrap">
              <button class="btn-primary">Primary Button</button>
              <button class="btn-secondary">Secondary Button</button>
              <button class="px-4 py-2 border border-default rounded hover:bg-surface-secondary transition-colors">
                Default Button
              </button>
            </div>
            
            <div class="space-y-2">
              <input
                type="text"
                placeholder="Text input example"
                class="w-full px-3 py-2 border border-default rounded bg-surface text-primary focus:border-accent focus:outline-none"
              />
              <textarea
                placeholder="Textarea example"
                rows="3"
                class="w-full px-3 py-2 border border-default rounded bg-surface text-primary focus:border-accent focus:outline-none"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Card Demo -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-surface border border-default rounded-lg p-4">
            <h4 class="font-semibold text-primary mb-2">Card Example</h4>
            <p class="text-secondary text-sm">
              This is a card component using the current theme colors.
            </p>
          </div>
          <div class="bg-surface-secondary border border-secondary rounded-lg p-4">
            <h4 class="font-semibold text-primary mb-2">Secondary Surface</h4>
            <p class="text-secondary text-sm">
              This card uses the secondary surface color for variety.
            </p>
          </div>
          <div class="bg-surface border border-accent rounded-lg p-4">
            <h4 class="font-semibold text-accent mb-2">Accent Border</h4>
            <p class="text-secondary text-sm">
              This card has an accent border for emphasis.
            </p>
          </div>
        </div>

        <!-- Color Palette Display -->
        <div class="bg-surface border border-default rounded-lg p-6">
          <h3 class="text-xl font-semibold mb-4">Current Theme Colors</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="space-y-2">
              <div class="w-full h-12 rounded border" style="background-color: var(--color-background)"></div>
              <p class="text-sm font-medium">Background</p>
            </div>
            <div class="space-y-2">
              <div class="w-full h-12 rounded border" style="background-color: var(--color-surface)"></div>
              <p class="text-sm font-medium">Surface</p>
            </div>
            <div class="space-y-2">
              <div class="w-full h-12 rounded border" style="background-color: var(--color-accent)"></div>
              <p class="text-sm font-medium">Accent</p>
            </div>
            <div class="space-y-2">
              <div class="w-full h-12 rounded border" style="background-color: var(--color-text)"></div>
              <p class="text-sm font-medium">Text</p>
            </div>
          </div>
        </div>

        <!-- Accessibility Info -->
        <div class="bg-surface border border-default rounded-lg p-6">
          <h3 class="text-xl font-semibold mb-4">Accessibility Features</h3>
          <div class="space-y-2 text-secondary">
            <p>✓ Respects system color scheme preference</p>
            <p>✓ High contrast mode available</p>
            <p>✓ Reduced motion support</p>
            <p>✓ Keyboard navigation friendly</p>
            <p>✓ Screen reader compatible</p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="mt-8 flex gap-2 flex-wrap">
        <button @click="toggleTheme" class="btn-primary">
          Toggle Theme
        </button>
        <button @click="cycleTheme" class="btn-secondary">
          Cycle All Themes
        </button>
        <button @click="cycleLayout" class="btn-secondary">
          Cycle Layouts
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Import theme composable
const {
  currentTheme,
  currentLayout,
  theme,
  layoutConfig,
  availableThemes,
  availableLayouts,
  themeStatus,
  setTheme,
  setLayout,
  toggleTheme,
  cycleTheme,
  cycleLayout
} = useTheme()

// Set page title
useHead({
  title: 'Theme Demo - Athena'
})
</script>

<style scoped>
.btn-primary {
  padding: 1rem 1.5rem;
  background-color: var(--theme-accent);
  color: var(--theme-bg-primary);
  border-radius: 0.375rem;
  transition: background-color 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--theme-accent);
  opacity: 0.8;
}

.btn-secondary {
  padding: 1rem 1.5rem;
  background-color: var(--theme-surface);
  border: 1px solid var(--theme-border);
  color: var(--theme-text-primary);
  border-radius: 0.375rem;
  transition: background-color 0.2s ease;
}

.btn-secondary:hover {
  background-color: var(--theme-hover);
}
</style>