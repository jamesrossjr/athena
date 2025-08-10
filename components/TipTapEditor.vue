<template>
  <div class="tiptap-editor-wrapper">
    <!-- Editor Toolbar -->
    <div v-if="editor" class="editor-toolbar flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
      <!-- Column Controls -->
      <div class="flex items-center gap-1 border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
        <button
          @click="createColumns"
          :disabled="isInColumn"
          class="toolbar-btn"
          :class="{ 'opacity-50 cursor-not-allowed': isInColumn }"
          title="Create Columns (Shift+Tab)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
          </svg>
        </button>

        <button
          v-if="isInColumnContainer"
          @click="addColumn"
          class="toolbar-btn"
          title="Add Column"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </button>

        <button
          v-if="isInColumn"
          @click="splitColumn"
          class="toolbar-btn"
          title="Split Column (Cmd+Shift+Right)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
        </button>

        <button
          v-if="isInColumn"
          @click="mergeColumns"
          class="toolbar-btn"
          title="Merge with Next Column (Cmd+Shift+Left)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 17l-4-4m0 0l-4 4m4-4v12m0-16l4-4m-4 4l-4-4"/>
          </svg>
        </button>
      </div>

      <!-- Other toolbar buttons -->
      <button
        @click="editor.commands.toggleBold()"
        :class="{ 'is-active': editor.isActive('bold') }"
        class="toolbar-btn"
        title="Bold (Cmd+B)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/>
        </svg>
      </button>

      <button
        @click="editor.commands.toggleItalic()"
        :class="{ 'is-active': editor.isActive('italic') }"
        class="toolbar-btn"
        title="Italic (Cmd+I)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 4l4 16M6 8h12M4 16h12"/>
        </svg>
      </button>

      <!-- Heading buttons -->
      <div class="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-2 ml-2">
        <button
          v-for="level in [1, 2, 3]"
          :key="level"
          @click="editor.commands.toggleHeading({ level })"
          :class="{ 'is-active': editor.isActive('heading', { level }) }"
          class="toolbar-btn text-xs"
          :title="`Heading ${level}`"
        >
          H{{ level }}
        </button>
      </div>
    </div>

    <!-- Editor Content -->
    <div class="editor-content">
      <editor-content :editor="editor" />
    </div>

    <!-- Status Bar -->
    <div v-if="editor" class="status-bar text-xs text-gray-500 p-2 border-t border-gray-200 dark:border-gray-700">
      <span v-if="isInColumn" class="inline-flex items-center gap-1">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
        </svg>
        In Column Layout
      </span>
      <span class="ml-4">
        Press Shift+Tab to create columns | Cmd+Shift+← → to merge/split columns
      </span>
    </div>
  </div>
</template>

<script setup>
import { EditorContent } from '@tiptap/vue-3'
import { computed } from 'vue'
import { useTipTapEditor, editorCommands } from '../composables/useTipTapEditor.js'

const props = defineProps({
  content: {
    type: String,
    default: ''
  },
  editable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:content'])

// Initialize editor
const { editor } = useTipTapEditor(props.content, {
  editable: props.editable,
  onUpdate: (content) => {
    emit('update:content', content)
  }
})

// Computed properties for toolbar states
const isInColumn = computed(() => {
  return editor.value ? editorCommands.isInColumn(editor.value) : false
})

const isInColumnContainer = computed(() => {
  return editor.value ? editorCommands.isInColumnContainer(editor.value) : false
})

// Methods
function createColumns() {
  if (editor.value) {
    editorCommands.createColumns(editor.value)
  }
}

function addColumn() {
  if (editor.value) {
    editorCommands.addColumn(editor.value)
  }
}

function splitColumn() {
  if (editor.value) {
    editorCommands.splitColumn(editor.value)
  }
}

function mergeColumns() {
  if (editor.value) {
    editorCommands.mergeColumns(editor.value)
  }
}
</script>

<style scoped>
.tiptap-editor-wrapper {
  @apply border border-gray-200 rounded-lg overflow-hidden;
}

.editor-toolbar {
  @apply bg-gray-50 dark:bg-gray-800;
}

.toolbar-btn {
  @apply p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150;
}

.toolbar-btn.is-active {
  @apply bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400;
}

.editor-content {
  @apply p-6 min-h-[200px];
}

.status-bar {
  @apply bg-gray-50 dark:bg-gray-800;
}

/* TipTap Editor Styles */
.editor-content :deep(.ProseMirror) {
  @apply focus:outline-none;
}

.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  @apply text-gray-400;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

/* Column styling is handled by tiptap-columns.css */
</style>