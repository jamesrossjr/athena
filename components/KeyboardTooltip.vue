<template>
  <div
    class="keyboard-tooltip-wrapper"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
    @focus="showTooltip"
    @blur="hideTooltip"
  >
    <slot />
    
    <Teleport to="body">
      <div
        v-if="isVisible && (shortcut || description)"
        class="keyboard-tooltip"
        :style="tooltipStyle"
        role="tooltip"
        :id="tooltipId"
      >
        <div class="tooltip-content">
          <span v-if="description" class="tooltip-description">{{ description }}</span>
          <kbd v-if="shortcut" class="tooltip-shortcut">{{ shortcut }}</kbd>
        </div>
        <div class="tooltip-arrow" :class="`arrow-${arrowPosition}`"></div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue'

interface Props {
  shortcut?: string
  description?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

const props = withDefaults(defineProps<Props>(), {
  position: 'top',
  delay: 800
})

// State
const isVisible = ref(false)
const tooltipPosition = ref({ top: 0, left: 0 })
const arrowPosition = ref('top')
const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`

let showTimer: number
let hideTimer: number

// Computed tooltip style
const tooltipStyle = computed(() => ({
  position: 'absolute',
  top: `${tooltipPosition.value.top}px`,
  left: `${tooltipPosition.value.left}px`,
  zIndex: 10000
}))

// Show tooltip
function showTooltip(event: Event) {
  clearTimeout(hideTimer)
  
  showTimer = window.setTimeout(() => {
    updateTooltipPosition(event.currentTarget as HTMLElement)
    isVisible.value = true
  }, props.delay)
}

// Hide tooltip
function hideTooltip() {
  clearTimeout(showTimer)
  
  hideTimer = window.setTimeout(() => {
    isVisible.value = false
  }, 100)
}

// Update tooltip position
function updateTooltipPosition(target: HTMLElement) {
  const rect = target.getBoundingClientRect()
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
  
  const tooltipWidth = 200 // Estimated width
  const tooltipHeight = 40 // Estimated height
  const offset = 8
  
  let top = 0
  let left = 0
  let arrow = props.position
  
  switch (props.position) {
    case 'top':
      top = rect.top + scrollTop - tooltipHeight - offset
      left = rect.left + scrollLeft + (rect.width / 2) - (tooltipWidth / 2)
      arrow = 'bottom'
      break
    case 'bottom':
      top = rect.bottom + scrollTop + offset
      left = rect.left + scrollLeft + (rect.width / 2) - (tooltipWidth / 2)
      arrow = 'top'
      break
    case 'left':
      top = rect.top + scrollTop + (rect.height / 2) - (tooltipHeight / 2)
      left = rect.left + scrollLeft - tooltipWidth - offset
      arrow = 'right'
      break
    case 'right':
      top = rect.top + scrollTop + (rect.height / 2) - (tooltipHeight / 2)
      left = rect.right + scrollLeft + offset
      arrow = 'left'
      break
  }
  
  // Keep tooltip within viewport
  const padding = 8
  if (left < padding) {
    left = padding
  } else if (left + tooltipWidth > window.innerWidth - padding) {
    left = window.innerWidth - tooltipWidth - padding
  }
  
  if (top < padding) {
    top = padding
  }
  
  tooltipPosition.value = { top, left }
  arrowPosition.value = arrow
}

onUnmounted(() => {
  clearTimeout(showTimer)
  clearTimeout(hideTimer)
})
</script>

<style scoped>
.keyboard-tooltip-wrapper {
  display: contents;
}

.keyboard-tooltip {
  position: absolute;
  pointer-events: none;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.tooltip-content {
  background: #1f2937;
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 250px;
}

.tooltip-description {
  font-weight: 500;
}

.tooltip-shortcut {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  padding: 2px 6px;
  font-family: ui-monospace, 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
}

.arrow-top {
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #1f2937;
}

.arrow-bottom {
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid #1f2937;
}

.arrow-left {
  top: 50%;
  left: 100%;
  transform: translateY(-50%);
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 6px solid #1f2937;
}

.arrow-right {
  top: 50%;
  right: 100%;
  transform: translateY(-50%);
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid #1f2937;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .tooltip-content {
    background: black;
    border: 2px solid white;
  }
  
  .tooltip-shortcut {
    background: white;
    color: black;
    border-color: white;
  }
  
  .arrow-top {
    border-top-color: black;
  }
  
  .arrow-bottom {
    border-bottom-color: black;
  }
  
  .arrow-left {
    border-left-color: black;
  }
  
  .arrow-right {
    border-right-color: black;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .keyboard-tooltip {
    animation: none;
  }
  
  @keyframes fadeIn {
    from, to {
      opacity: 1;
      transform: scale(1);
    }
  }
}
</style>