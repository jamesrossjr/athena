<script setup lang="ts">
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

interface Props {
  content?: any
  documentId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [content: any]
}>()

const editorElement = ref<HTMLElement>()
const editor = ref<Editor>()
const isConnected = ref(false)
const collaborators = ref<Set<string>>(new Set())

// Initialize Yjs document
const ydoc = new Y.Doc()

// Create WebSocket provider for real-time sync
let provider: WebsocketProvider

onMounted(async () => {
  if (!editorElement.value) return

  // Connect to WebSocket with document ID
  provider = new WebsocketProvider(
    'ws://localhost:3001',
    `document-${props.documentId}`,
    ydoc
  )

  provider.on('status', (event: { status: string }) => {
    isConnected.value = event.status === 'connected'
  })

  // Get the shared type for the document content
  const yText = ydoc.getText('content')

  // Initialize TipTap editor with collaboration
  editor.value = new Editor({
    element: editorElement.value,
    extensions: [
      StarterKit.configure({
        // Disable the default history extension as we use collaborative undo/redo
        history: false,
      }),
      // Enable collaboration with Yjs
      Collaboration.configure({
        document: ydoc,
        field: 'content',
      }),
      // Enable collaborative cursors with user info
      CollaborationCursor.configure({
        provider,
        user: {
          name: 'Demo User',
          color: getRandomColor(),
        },
      }),
    ],
    content: props.content || '',
    onUpdate: ({ editor }) => {
      // Emit content updates for saving to database
      emit('update', editor.getHTML())
    },
  })

  // Update collaborators count when users join/leave
  provider.awareness.on('change', () => {
    const users = Array.from(provider.awareness.getStates().values())
    collaborators.value = new Set(users.map((user: any) => user.user?.name || 'Anonymous'))
  })
})

onUnmounted(() => {
  editor.value?.destroy()
  provider?.destroy()
})

function getRandomColor() {
  const colors = [
    '#958DF1', '#F98181', '#FBBC88', '#FAF594', '#70CFF8', 
    '#94FADB', '#B9F18D', '#C3E2C2', '#EAAC8B', '#166A56',
    '#D10048', '#FF6B8A', '#FFBE0B', '#FB5607', '#8338EC'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Expose editor instance for parent component
defineExpose({ editor })
</script>

<template>
  <div class="collaborative-editor">
    <!-- Toolbar -->
    <div v-if="editor" class="border-b border-gray-200 p-2 flex items-center gap-2">
      <UButton
        size="sm"
        variant="ghost"
        :class="{ 'bg-gray-100': editor.isActive('bold') }"
        @click="editor.chain().focus().toggleBold().run()"
      >
        <strong>B</strong>
      </UButton>
      
      <UButton
        size="sm"
        variant="ghost"
        :class="{ 'bg-gray-100': editor.isActive('italic') }"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        <em>I</em>
      </UButton>
      
      <UButton
        size="sm"
        variant="ghost"
        :class="{ 'bg-gray-100': editor.isActive('heading', { level: 1 }) }"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      >
        H1
      </UButton>
      
      <UButton
        size="sm"
        variant="ghost"
        :class="{ 'bg-gray-100': editor.isActive('bulletList') }"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        • List
      </UButton>
      
      <div class="flex-1"></div>
      
      <!-- Connection Status -->
      <UBadge :color="isConnected ? 'green' : 'red'" variant="soft" size="sm">
        {{ isConnected ? '🟢 Connected' : '🔴 Disconnected' }}
      </UBadge>
      
      <!-- Collaborators -->
      <UBadge v-if="collaborators.size > 1" color="blue" variant="soft" size="sm">
        {{ collaborators.size - 1 }} other{{ collaborators.size === 2 ? '' : 's' }} editing
      </UBadge>
    </div>
    
    <!-- Editor Content -->
    <div 
      ref="editorElement" 
      class="prose max-w-none p-6 min-h-96 focus:outline-none"
      style="white-space: pre-wrap;"
    ></div>
    
    <!-- Presence Indicators -->
    <div v-if="collaborators.size > 1" class="border-t border-gray-200 p-2">
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <span>Currently editing:</span>
        <div class="flex -space-x-1">
          <div
            v-for="collaborator in Array.from(collaborators).filter(name => name !== 'Demo User')"
            :key="collaborator"
            class="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center border-2 border-white"
            :title="collaborator"
          >
            {{ collaborator.charAt(0).toUpperCase() }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* TipTap Editor Styles */
.ProseMirror {
  outline: none;
}

.ProseMirror h1 {
  font-size: 1.875rem;
  font-weight: bold;
  margin: 1rem 0 0.5rem 0;
}

.ProseMirror h2 {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 1rem 0 0.5rem 0;
}

.ProseMirror p {
  margin: 0.5rem 0;
}

.ProseMirror ul {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.ProseMirror li {
  margin: 0.25rem 0;
}

/* Collaboration cursor styles */
.collaboration-cursor__caret {
  border-left: 1px solid #0D0D0D;
  border-right: 1px solid #0D0D0D;
  margin-left: -1px;
  margin-right: -1px;
  pointer-events: none;
  position: relative;
  word-break: normal;
}

.collaboration-cursor__label {
  border-radius: 3px 3px 3px 0;
  color: #0D0D0D;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  left: -1px;
  line-height: normal;
  padding: 0.1rem 0.3rem;
  position: absolute;
  top: -1.4em;
  user-select: none;
  white-space: nowrap;
}
</style>