<template>
  <node-view-wrapper class="{{BLOCK_NAME_KEBAB}}-block">
    <div 
      class="block-container"
      :class="{ 
        'is-selected': selected,
        'is-editing': isEditing 
      }"
      @click="handleClick"
    >
      <!-- Block Header (optional) -->
      <div v-if="showHeader" class="block-header">
        <span class="block-icon">{{BLOCK_ICON}}</span>
        <span class="block-label">{{BLOCK_LABEL}}</span>
        <div class="block-actions">
          <button 
            v-if="!isEditing"
            @click.stop="startEdit"
            class="action-btn"
            aria-label="Edit {{BLOCK_NAME}}"
          >
            ✏️
          </button>
          <button 
            @click.stop="deleteBlock"
            class="action-btn"
            aria-label="Delete {{BLOCK_NAME}}"
          >
            🗑️
          </button>
        </div>
      </div>

      <!-- Block Content -->
      <div class="block-content">
        <!-- View Mode -->
        <div v-if="!isEditing" class="view-mode">
          {{BLOCK_VIEW_CONTENT}}
        </div>

        <!-- Edit Mode -->
        <div v-else class="edit-mode">
          {{BLOCK_EDIT_CONTENT}}
          
          <div class="edit-actions">
            <button 
              @click="saveChanges"
              class="btn btn-primary"
            >
              Save
            </button>
            <button 
              @click="cancelEdit"
              class="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Block Footer (optional) -->
      <div v-if="showFooter" class="block-footer">
        {{BLOCK_FOOTER_CONTENT}}
      </div>
    </div>
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import type { {{BLOCK_NAME}}BlockData } from '~/types/blocks/{{BLOCK_NAME_KEBAB}}'

// Props from TipTap
const props = defineProps(nodeViewProps)

// Local state
const isEditing = ref(false)
const localData = ref<{{BLOCK_NAME}}BlockData>({
  {{DEFAULT_DATA}}
})

// Computed properties
const selected = computed(() => props.selected)
const showHeader = computed(() => {{SHOW_HEADER_LOGIC}})
const showFooter = computed(() => {{SHOW_FOOTER_LOGIC}})

// Watch for external data changes
watch(() => props.node.attrs, (newAttrs) => {
  if (!isEditing.value) {
    localData.value = { ...newAttrs }
  }
}, { deep: true })

// Methods
const handleClick = () => {
  if (!isEditing.value) {
    // Focus the block
    props.editor.commands.setNodeSelection(props.getPos())
  }
}

const startEdit = () => {
  isEditing.value = true
  localData.value = { ...props.node.attrs }
}

const saveChanges = () => {
  // Update the node in TipTap
  props.updateAttributes(localData.value)
  
  // Save to database
  saveToDatabase()
  
  isEditing.value = false
}

const cancelEdit = () => {
  localData.value = { ...props.node.attrs }
  isEditing.value = false
}

const deleteBlock = () => {
  if (confirm('Delete this {{BLOCK_NAME}} block?')) {
    props.deleteNode()
  }
}

const saveToDatabase = async () => {
  try {
    // Get block ID from node
    const blockId = props.node.attrs.id
    
    if (blockId) {
      // Update existing block
      await $fetch(`/api/blocks/${blockId}`, {
        method: 'PUT',
        body: {
          content: localData.value
        }
      })
    }
  } catch (error) {
    console.error('Failed to save block:', error)
  }
}

// Lifecycle
onMounted(() => {
  // Initialize from node attributes
  localData.value = { ...props.node.attrs }
})

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (isEditing.value) {
    if (event.key === 'Escape') {
      cancelEdit()
    } else if (event.key === 'Enter' && event.ctrlKey) {
      saveChanges()
    }
  }
}

// Register keyboard listener
if (process.client) {
  window.addEventListener('keydown', handleKeydown)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
}

{{ADDITIONAL_METHODS}}
</script>

<style scoped>
.{{BLOCK_NAME_KEBAB}}-block {
  @apply my-2;
}

.block-container {
  @apply relative rounded-lg border border-gray-200 dark:border-gray-700 
         bg-white dark:bg-gray-800 transition-all duration-200;
}

.block-container.is-selected {
  @apply ring-2 ring-blue-500 border-blue-500;
}

.block-container.is-editing {
  @apply ring-2 ring-green-500 border-green-500;
}

.block-header {
  @apply flex items-center justify-between px-4 py-2 
         border-b border-gray-200 dark:border-gray-700;
}

.block-icon {
  @apply text-lg mr-2;
}

.block-label {
  @apply font-medium text-gray-700 dark:text-gray-300;
}

.block-actions {
  @apply flex gap-2;
}

.action-btn {
  @apply p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
         transition-colors cursor-pointer;
}

.block-content {
  @apply p-4;
}

.view-mode {
  @apply cursor-pointer;
}

.edit-mode {
  @apply space-y-4;
}

.edit-actions {
  @apply flex gap-2 justify-end mt-4;
}

.btn {
  @apply px-4 py-2 rounded font-medium transition-colors;
}

.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.btn-secondary {
  @apply bg-gray-200 dark:bg-gray-700 text-gray-700 
         dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600;
}

.block-footer {
  @apply px-4 py-2 border-t border-gray-200 dark:border-gray-700 
         text-sm text-gray-500 dark:text-gray-400;
}

{{ADDITIONAL_STYLES}}
</style>