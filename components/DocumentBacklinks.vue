<template>
  <div v-if="backlinks.length > 0" class="document-backlinks">
    <div class="backlinks-header">
      <div class="backlinks-title">
        <span class="backlinks-icon">🔗</span>
        <span>Backlinks</span>
        <span class="backlinks-count">({{ backlinks.length }})</span>
      </div>
      <button 
        @click="isExpanded = !isExpanded"
        class="backlinks-toggle"
        :class="{ 'backlinks-toggle--expanded': isExpanded }"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
    </div>
    
    <div v-if="isExpanded" class="backlinks-content">
      <div 
        v-for="backlink in backlinks"
        :key="backlink.id"
        @click="$emit('navigate-to-page', backlink.id)"
        class="backlink-item"
      >
        <div class="backlink-icon">{{ getDocumentIcon(backlink) }}</div>
        <div class="backlink-info">
          <div class="backlink-title">{{ backlink.title }}</div>
          <div class="backlink-preview" v-if="backlink.preview">{{ backlink.preview }}</div>
          <div class="backlink-meta">
            <span class="backlink-type">{{ backlink.type }}</span>
            <span class="backlink-date">{{ formatDate(backlink.lastModified) }}</span>
          </div>
        </div>
        <div class="backlink-arrow">→</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePageLinks } from '~/composables/usePageLinks'

const props = defineProps({
  documentId: {
    type: String,
    required: true
  },
  documents: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['navigate-to-page'])

// State
const isExpanded = ref(true)
const { getBacklinksForDocument } = usePageLinks()

// Computed
const backlinks = computed(() => {
  const backlinkDocs = getBacklinksForDocument(props.documentId, props.documents)
  
  return backlinkDocs.map(doc => ({
    ...doc,
    preview: generatePreview(doc)
  }))
})

// Methods
function generatePreview(document: any): string {
  let content = ''
  
  // Extract content from blocks
  if (document.blocks && Array.isArray(document.blocks)) {
    for (const block of document.blocks) {
      if (block.content && block.content.includes(`[[`)) {
        // Look for the current document reference
        const currentDoc = props.documents.find((d: any) => d.id === props.documentId)
        if (currentDoc && block.content.toLowerCase().includes((currentDoc as any).title.toLowerCase())) {
          // Extract surrounding context
          const sentences = block.content.split(/[.!?]+/)
          for (const sentence of sentences) {
            if (sentence.toLowerCase().includes((currentDoc as any).title.toLowerCase())) {
              return sentence.trim().substring(0, 100) + (sentence.length > 100 ? '...' : '')
            }
          }
        }
        break
      }
    }
    
    // Fallback to first block content
    const firstTextBlock = document.blocks.find((block: any) => block.content)
    if (firstTextBlock) {
      content = firstTextBlock.content
    }
  } else if (document.content) {
    content = document.content
  }
  
  return content.substring(0, 120) + (content.length > 120 ? '...' : '')
}

function getDocumentIcon(doc: any): string {
  switch (doc.type) {
    case 'pdf': return '📄'
    case 'table': return '📊'
    case 'whiteboard': return '🎨'
    case 'database': return '🗃️'
    case 'page': return '📝'
    default: return '📄'
  }
}

function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return dateObj.toLocaleDateString()
}
</script>

<style scoped>
.document-backlinks {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.app-layout--dark .document-backlinks {
  border-top-color: #374151;
}

.backlinks-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.backlinks-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.app-layout--dark .backlinks-title {
  color: #d1d5db;
}

.backlinks-icon {
  font-size: 18px;
}

.backlinks-count {
  font-size: 14px;
  color: #6b7280;
  font-weight: 400;
}

.app-layout--dark .backlinks-count {
  color: #9ca3af;
}

.backlinks-toggle {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.backlinks-toggle:hover {
  background: #f3f4f6;
  color: #374151;
}

.backlinks-toggle svg {
  width: 16px;
  height: 16px;
  transition: transform 0.15s ease;
}

.backlinks-toggle--expanded svg {
  transform: rotate(180deg);
}

.app-layout--dark .backlinks-toggle:hover {
  background: #374151;
  color: #d1d5db;
}

.backlinks-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.backlink-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.backlink-item:hover {
  background: #f8fafc;
  border-color: #e5e7eb;
}

.app-layout--dark .backlink-item:hover {
  background: #374151;
  border-color: #4b5563;
}

.backlink-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.backlink-info {
  flex: 1;
  min-width: 0;
}

.backlink-title {
  font-size: 15px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
}

.app-layout--dark .backlink-title {
  color: #f9fafb;
}

.backlink-preview {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 8px;
}

.app-layout--dark .backlink-preview {
  color: #9ca3af;
}

.backlink-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #9ca3af;
}

.app-layout--dark .backlink-meta {
  color: #6b7280;
}

.backlink-type {
  text-transform: capitalize;
}

.backlink-arrow {
  font-size: 16px;
  color: #9ca3af;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.backlink-item:hover .backlink-arrow {
  opacity: 1;
}

.app-layout--dark .backlink-arrow {
  color: #6b7280;
}
</style>