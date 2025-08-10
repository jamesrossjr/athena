<template>
  <div
    class="tab"
    :class="[
      `tab--${layout}`,
      {
        'tab--active': isActive,
        'tab--pinned': isPinned,
        'tab--hibernated': document?.isHibernated
      }
    ]"
    :title="document?.title"
    draggable="true"
    @click="$emit('click')"
    @dragstart="$emit('dragstart', $event)"
    @dragover="$emit('dragover', $event)"
    @drop="$emit('drop', $event)"
    @contextmenu="$emit('contextmenu', $event)"
  >
    <!-- Tab Icon -->
    <div class="tab__icon">
      <span v-if="isPinned" class="tab__pin-icon">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477V16a1 1 0 11-2 0V6.477L4.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 013 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L7 4.323V3a1 1 0 011-1h2z" />
        </svg>
      </span>
      <span v-else-if="document?.type === 'pdf'" class="text-red-500">📄</span>
      <span v-else-if="document?.type === 'table'" class="text-green-500">📊</span>
      <span v-else-if="document?.type === 'whiteboard'" class="text-purple-500">🎨</span>
      <span v-else-if="document?.type === 'database'" class="text-blue-500">🗃️</span>
      <span v-else class="text-gray-500">📝</span>
    </div>
    
    <!-- Tab Title -->
    <span class="tab__title">
      {{ document?.title || 'Untitled' }}
    </span>
    
    <!-- Hibernation Indicator -->
    <span v-if="document?.isHibernated" class="tab__hibernated">
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </span>
    
    <!-- Close Button -->
    <button
      v-if="!isPinned"
      class="tab__close"
      @click.stop="$emit('close')"
      title="Close tab"
    >
      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Tab, Document } from '~/stores/workspace'

defineProps<{
  tab: Tab
  document?: Document
  isActive: boolean
  isPinned?: boolean
  layout: 'horizontal' | 'vertical'
}>()

defineEmits<{
  click: []
  close: []
  dragstart: [event: DragEvent]
  dragover: [event: DragEvent]
  drop: [event: DragEvent]
  contextmenu: [event: MouseEvent]
}>()
</script>

<style scoped>
.tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.tab:hover {
  background-color: rgb(243 244 246);
}

.dark .tab:hover {
  background-color: rgb(55 65 81);
}

.tab--horizontal {
  min-width: 120px;
  max-width: 200px;
}

.tab--vertical {
  width: 100%;
}

.tab--active {
  background-color: rgb(239 246 255);
  border-bottom: 2px solid rgb(59 130 246);
}

.dark .tab--active {
  background-color: rgba(30, 58, 138, 0.3);
}

.tab--vertical.tab--active {
  border-bottom: 0;
  border-left: 2px solid rgb(59 130 246);
}

.tab--pinned {
  min-width: 40px;
  max-width: 40px;
  justify-content: center;
}

.tab--vertical.tab--pinned {
  min-width: 100%;
  max-width: 100%;
}

.tab--hibernated {
  opacity: 0.6;
}

.tab__icon {
  flex-shrink: 0;
}

.tab__pin-icon {
  color: rgb(59 130 246);
}

.tab__title {
  flex: 1 1 0%;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab--pinned .tab__title {
  display: none;
}

.tab--vertical.tab--pinned .tab__title {
  display: block;
}

.tab__hibernated {
  color: rgb(156 163 175);
}

.dark .tab__hibernated {
  color: rgb(107 114 128);
}

.tab__close {
  opacity: 0;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab:hover .tab__close {
  opacity: 1;
}

.tab__close:hover {
  background-color: rgb(229 231 235);
}

.dark .tab__close:hover {
  background-color: rgb(75 85 99);
}

.tab--active .tab__close {
  opacity: 1;
}
</style>