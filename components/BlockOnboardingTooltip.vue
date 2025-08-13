<template>
  <Teleport to="body">
    <div 
      v-if="isVisible"
      class="onboarding-tooltip"
      :style="{ 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        transform: 'translateX(-50%)'
      }"
      role="tooltip"
      :aria-describedby="`block-${blockIndex}-onboarding`"
    >
      <div class="tooltip-content">
        <div class="tooltip-icon">✨</div>
        <div class="tooltip-text">
          <strong>This is a block.</strong> Drag the handle to move it, or type '/' to change it.
        </div>
        <button 
          class="tooltip-close"
          @click="dismiss"
          :aria-label="'Close onboarding tooltip'"
          title="Got it!"
        >
          ✕
        </button>
      </div>
      <div class="tooltip-arrow"></div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

interface Props {
  blockIndex: number
  targetElement?: HTMLElement
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'dismiss': []
}>()

// State
const isVisible = ref(true)
const position = ref({ top: 0, left: 0 })

// Position the tooltip
function updatePosition() {
  if (!props.targetElement) return
  
  const rect = props.targetElement.getBoundingClientRect()
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
  
  position.value = {
    top: rect.top + scrollTop - 60, // Position above the block
    left: rect.left + scrollLeft + (rect.width / 2) // Center horizontally
  }
}

// Dismiss the tooltip
function dismiss() {
  isVisible.value = false
  // Mark as seen in localStorage
  localStorage.setItem('athena-block-onboarding-seen', 'true')
  emit('dismiss')
}

// Auto-dismiss after 8 seconds
let autoDismissTimer: number

onMounted(() => {
  nextTick(() => {
    updatePosition()
  })
  
  // Auto-dismiss after 8 seconds
  autoDismissTimer = window.setTimeout(() => {
    dismiss()
  }, 8000)
  
  // Update position on scroll/resize
  window.addEventListener('scroll', updatePosition)
  window.addEventListener('resize', updatePosition)
})

onUnmounted(() => {
  if (autoDismissTimer) {
    clearTimeout(autoDismissTimer)
  }
  window.removeEventListener('scroll', updatePosition)
  window.removeEventListener('resize', updatePosition)
})
</script>

<style scoped>
.onboarding-tooltip {
  position: absolute;
  z-index: 9999;
  max-width: 300px;
  pointer-events: auto;
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.tooltip-content {
  background: #1f2937;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: flex-start;
  gap: 8px;
  position: relative;
}

.tooltip-icon {
  font-size: 16px;
  margin-top: 1px;
  flex-shrink: 0;
}

.tooltip-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
}

.tooltip-text strong {
  font-weight: 600;
}

.tooltip-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  opacity: 0.7;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}

.tooltip-close:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

.tooltip-close:focus {
  outline: 2px solid white;
  outline-offset: 2px;
}

.tooltip-arrow {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #1f2937;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .tooltip-content {
    background: black;
    border: 2px solid white;
  }
  
  .tooltip-arrow {
    border-top-color: black;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .onboarding-tooltip {
    animation: none;
  }
  
  @keyframes fadeInUp {
    from, to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
}
</style>