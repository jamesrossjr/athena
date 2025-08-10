<template>
  <div v-if="isOpen" class="help-modal-overlay" @click.self="$emit('close')">
    <div class="help-modal">
      <div class="help-modal__header">
        <h2 class="help-modal__title">
          <span class="help-modal__icon">❓</span>
          Help & Commands
        </h2>
        <button @click="$emit('close')" class="help-modal__close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="help-modal__content">
        <!-- Navigation Tabs -->
        <div class="help-tabs">
          <button 
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="help-tab"
            :class="{ 'help-tab--active': activeTab === tab.id }"
          >
            <span class="help-tab__icon">{{ tab.icon }}</span>
            {{ tab.title }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="help-content">
          
          <!-- Getting Started -->
          <div v-if="activeTab === 'getting-started'" class="help-section">
            <h3>Getting Started with Athena</h3>
            
            <div class="help-card">
              <h4>🏠 Workspaces</h4>
              <p>Organize your work into separate workspaces for different projects or contexts.</p>
              <ul>
                <li><strong>Create:</strong> Click the workspace dropdown and select "New Workspace"</li>
                <li><strong>Switch:</strong> Use the workspace dropdown to switch between workspaces</li>
                <li><strong>Organize:</strong> Each workspace maintains its own documents and tabs</li>
              </ul>
            </div>

            <div class="help-card">
              <h4>📄 Documents</h4>
              <p>Create different types of documents for various needs:</p>
              <ul>
                <li><strong>Page:</strong> Rich text documents with markdown support</li>
                <li><strong>Table:</strong> Spreadsheet-like data organization</li>
                <li><strong>Database:</strong> Structured data with relations and views</li>
                <li><strong>Whiteboard:</strong> Infinite canvas for visual brainstorming</li>
                <li><strong>PDF:</strong> View and annotate PDF documents</li>
              </ul>
            </div>

            <div class="help-card">
              <h4>🔗 Wiki Links</h4>
              <p>Create connections between your documents:</p>
              <ul>
                <li><strong>Link to pages:</strong> Type <code>[[Page Name]]</code> to create links</li>
                <li><strong>Autocomplete:</strong> Start typing after <code>[[</code> to see suggestions</li>
                <li><strong>Navigation:</strong> Use arrow keys and Enter to select from suggestions</li>
                <li><strong>Backlinks:</strong> See which pages link to your current document</li>
              </ul>
            </div>
          </div>

          <!-- Slash Commands -->
          <div v-if="activeTab === 'slash-commands'" class="help-section">
            <h3>Slash Commands</h3>
            <p>Type <code>/</code> in any document to access quick commands and formatting options.</p>

            <!-- Page Commands -->
            <div class="help-card">
              <h4>📝 Page Commands</h4>
              <div class="command-grid">
                <div class="command-item" v-for="cmd in pageCommands" :key="cmd.id">
                  <div class="command-icon">{{ cmd.icon }}</div>
                  <div class="command-info">
                    <div class="command-title">{{ cmd.title }}</div>
                    <div class="command-desc">{{ cmd.description }}</div>
                    <div v-if="cmd.shortcut" class="command-shortcut">{{ cmd.shortcut }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Table Commands -->
            <div class="help-card">
              <h4>📊 Table Commands</h4>
              <div class="command-grid">
                <div class="command-item" v-for="cmd in tableCommands" :key="cmd.id">
                  <div class="command-icon">{{ cmd.icon }}</div>
                  <div class="command-info">
                    <div class="command-title">{{ cmd.title }}</div>
                    <div class="command-desc">{{ cmd.description }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Database Commands -->
            <div class="help-card">
              <h4>🗃️ Database Commands</h4>
              <div class="command-grid">
                <div class="command-item" v-for="cmd in databaseCommands" :key="cmd.id">
                  <div class="command-icon">{{ cmd.icon }}</div>
                  <div class="command-info">
                    <div class="command-title">{{ cmd.title }}</div>
                    <div class="command-desc">{{ cmd.description }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Keyboard Shortcuts -->
          <div v-if="activeTab === 'shortcuts'" class="help-section">
            <h3>Keyboard Shortcuts</h3>

            <div class="help-card">
              <h4>⌨️ General Shortcuts</h4>
              <div class="shortcut-grid">
                <div class="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>N</kbd>
                  <span>New Document</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>S</kbd>
                  <span>Save Document</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>Z</kbd>
                  <span>Undo</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>Y</kbd>
                  <span>Redo</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>W</kbd>
                  <span>Close Tab</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>T</kbd>
                  <span>New Tab</span>
                </div>
              </div>
            </div>

            <div class="help-card">
              <h4>📝 Text Editing</h4>
              <div class="shortcut-grid">
                <div class="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>B</kbd>
                  <span>Bold</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>I</kbd>
                  <span>Italic</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>U</kbd>
                  <span>Underline</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Tab</kbd>
                  <span>Indent</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Shift</kbd> + <kbd>Tab</kbd>
                  <span>Outdent</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Enter</kbd>
                  <span>New Line/Block</span>
                </div>
              </div>
            </div>

            <div class="help-card">
              <h4>🔗 Wiki Links</h4>
              <div class="shortcut-grid">
                <div class="shortcut-item">
                  <kbd>[</kbd><kbd>[</kbd>
                  <span>Start Wiki Link</span>
                </div>
                <div class="shortcut-item">
                  <kbd>↑</kbd> <kbd>↓</kbd>
                  <span>Navigate Suggestions</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Enter</kbd>
                  <span>Select Suggestion</span>
                </div>
                <div class="shortcut-item">
                  <kbd>Escape</kbd>
                  <span>Close Suggestions</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Templates -->
          <div v-if="activeTab === 'templates'" class="help-section">
            <h3>Templates</h3>
            
            <div class="help-card">
              <h4>📋 Using Templates</h4>
              <p>Templates help you quickly create documents with pre-defined structure and content.</p>
              <ul>
                <li><strong>Save as Template:</strong> Right-click a document and select "Save as Template"</li>
                <li><strong>Use Template:</strong> When creating a new document, select "From Template"</li>
                <li><strong>Template Storage:</strong> Templates are saved per workspace</li>
                <li><strong>Content Preservation:</strong> Templates maintain the original document's structure and formatting</li>
              </ul>
            </div>

            <div class="help-card">
              <h4>💡 Template Ideas</h4>
              <ul>
                <li>Meeting Notes Template</li>
                <li>Project Planning Template</li>
                <li>Daily Journal Template</li>
                <li>Research Notes Template</li>
                <li>Task List Template</li>
                <li>Book Review Template</li>
              </ul>
            </div>
          </div>

          <!-- Tips & Tricks -->
          <div v-if="activeTab === 'tips'" class="help-section">
            <h3>Tips & Tricks</h3>

            <div class="help-card">
              <h4>🚀 Productivity Tips</h4>
              <ul>
                <li><strong>Tab Management:</strong> Use multiple tabs to work on related documents simultaneously</li>
                <li><strong>Tile Layout:</strong> Split your workspace to view multiple documents side-by-side</li>
                <li><strong>Document Types:</strong> Choose the right document type for your content (Page, Table, Database, etc.)</li>
                <li><strong>Wiki Linking:</strong> Build a knowledge graph by linking related concepts and pages</li>
                <li><strong>Templates:</strong> Create templates for recurring document types to save time</li>
              </ul>
            </div>

            <div class="help-card">
              <h4>📝 Writing Tips</h4>
              <ul>
                <li><strong>Headings:</strong> Use heading levels (H1, H2, H3) to create document structure</li>
                <li><strong>Lists:</strong> Use bullet points and numbered lists for better organization</li>
                <li><strong>Code Blocks:</strong> Use code blocks for technical content and preserving formatting</li>
                <li><strong>Quotes:</strong> Highlight important information with quote blocks</li>
                <li><strong>Dividers:</strong> Use dividers to separate sections visually</li>
              </ul>
            </div>

            <div class="help-card">
              <h4>🔧 Advanced Features</h4>
              <ul>
                <li><strong>Backlinks:</strong> Check the backlinks section at the bottom of pages to see connections</li>
                <li><strong>Document Context Menu:</strong> Right-click documents for additional options</li>
                <li><strong>Workspace Isolation:</strong> Each workspace is independent with its own documents</li>
                <li><strong>Auto-save:</strong> Documents are automatically saved as you work</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const activeTab = ref('getting-started')

const tabs = [
  { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
  { id: 'slash-commands', title: 'Commands', icon: '⚡' },
  { id: 'shortcuts', title: 'Shortcuts', icon: '⌨️' },
  { id: 'templates', title: 'Templates', icon: '📋' },
  { id: 'tips', title: 'Tips & Tricks', icon: '💡' }
]

// Command data for different document types
const pageCommands = [
  { id: 'undo', title: 'Undo', description: 'Undo last action', icon: '↶', shortcut: 'Ctrl+Z' },
  { id: 'redo', title: 'Redo', description: 'Redo last action', icon: '↷', shortcut: 'Ctrl+Y' },
  { id: 'heading1', title: 'Heading 1', description: 'Large section heading', icon: 'H₁' },
  { id: 'heading2', title: 'Heading 2', description: 'Medium section heading', icon: 'H₂' },
  { id: 'heading3', title: 'Heading 3', description: 'Small section heading', icon: 'H₃' },
  { id: 'bullet-list', title: 'Bulleted List', description: 'Create a bulleted list', icon: '•' },
  { id: 'number-list', title: 'Numbered List', description: 'Create a numbered list', icon: '1.' },
  { id: 'quote', title: 'Quote', description: 'Capture a quote', icon: '"' },
  { id: 'code', title: 'Code', description: 'Insert code block', icon: '</>' },
  { id: 'divider', title: 'Divider', description: 'Visual divider', icon: '―' },
  { id: 'image', title: 'Insert Image', description: 'Upload or embed an image', icon: '🖼️' },
  { id: 'link', title: 'Insert Link', description: 'Add a link', icon: '🔗' },
]

const tableCommands = [
  { id: 'insert-row-above', title: 'Insert row above', description: 'Add new row above current', icon: '⬆️' },
  { id: 'insert-row-below', title: 'Insert row below', description: 'Add new row below current', icon: '⬇️' },
  { id: 'insert-column-left', title: 'Insert column left', description: 'Add new column to the left', icon: '⬅️' },
  { id: 'insert-column-right', title: 'Insert column right', description: 'Add new column to the right', icon: '➡️' },
  { id: 'delete-row', title: 'Delete row', description: 'Remove current row', icon: '🗑️' },
  { id: 'delete-column', title: 'Delete column', description: 'Remove current column', icon: '🗑️' },
  { id: 'sort-asc', title: 'Sort A-Z', description: 'Sort column ascending', icon: '↑' },
  { id: 'sort-desc', title: 'Sort Z-A', description: 'Sort column descending', icon: '↓' },
  { id: 'column-type', title: 'Change column type', description: 'Set data type for column', icon: '📊' },
]

const databaseCommands = [
  { id: 'new-entry', title: 'Add new entry', description: 'Create new database record', icon: '➕' },
  { id: 'new-view', title: 'Create new view', description: 'Add custom view', icon: '👁️' },
  { id: 'filter', title: 'Filter by property', description: 'Filter database entries', icon: '🔍' },
  { id: 'sort-property', title: 'Sort by property', description: 'Sort database entries', icon: '📋' },
  { id: 'group-by', title: 'Group by property', description: 'Group entries by property', icon: '📂' },
  { id: 'new-property', title: 'Add property', description: 'Create new property/field', icon: '🏷️' },
]
</script>

<style scoped>
.help-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.help-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.app-layout--dark .help-modal {
  background: #1f2937;
  color: #f9fafb;
}

.help-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px 0 32px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 0;
}

.app-layout--dark .help-modal__header {
  border-bottom-color: #374151;
}

.help-modal__title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #111827;
}

.app-layout--dark .help-modal__title {
  color: #f9fafb;
}

.help-modal__icon {
  font-size: 28px;
}

.help-modal__close {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.15s ease;
}

.help-modal__close:hover {
  background: #f3f4f6;
  color: #374151;
}

.app-layout--dark .help-modal__close:hover {
  background: #374151;
  color: #d1d5db;
}

.help-modal__close svg {
  width: 20px;
  height: 20px;
}

.help-modal__content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.help-tabs {
  display: flex;
  padding: 0 32px;
  border-bottom: 1px solid #e5e7eb;
  gap: 4px;
}

.app-layout--dark .help-tabs {
  border-bottom-color: #374151;
}

.help-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s ease;
}

.help-tab:hover {
  color: #374151;
  background: #f9fafb;
}

.help-tab--active {
  color: #2563eb;
  border-bottom-color: #2563eb;
}

.app-layout--dark .help-tab {
  color: #9ca3af;
}

.app-layout--dark .help-tab:hover {
  color: #d1d5db;
  background: #374151;
}

.app-layout--dark .help-tab--active {
  color: #60a5fa;
  border-bottom-color: #60a5fa;
}

.help-tab__icon {
  font-size: 18px;
}

.help-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.help-section h3 {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 24px 0;
}

.app-layout--dark .help-section h3 {
  color: #f9fafb;
}

.help-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}

.app-layout--dark .help-card {
  background: #374151;
  border-color: #4b5563;
}

.help-card h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
}

.app-layout--dark .help-card h4 {
  color: #f3f4f6;
}

.help-card p {
  color: #6b7280;
  margin: 0 0 16px 0;
  line-height: 1.6;
}

.app-layout--dark .help-card p {
  color: #d1d5db;
}

.help-card ul {
  margin: 0;
  padding-left: 20px;
  color: #4b5563;
}

.app-layout--dark .help-card ul {
  color: #e5e7eb;
}

.help-card li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.help-card li strong {
  color: #374151;
}

.app-layout--dark .help-card li strong {
  color: #f9fafb;
}

.command-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.command-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.app-layout--dark .command-item {
  background: #1f2937;
  border-color: #374151;
}

.command-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.app-layout--dark .command-icon {
  background: #4b5563;
}

.command-info {
  flex: 1;
  min-width: 0;
}

.command-title {
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.app-layout--dark .command-title {
  color: #f3f4f6;
}

.command-desc {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.app-layout--dark .command-desc {
  color: #9ca3af;
}

.command-shortcut {
  font-size: 12px;
  color: #9ca3af;
  font-family: monospace;
}

.app-layout--dark .command-shortcut {
  color: #6b7280;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.app-layout--dark .shortcut-item {
  background: #1f2937;
  border-color: #374151;
}

kbd {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  font-family: monospace;
  color: #374151;
}

.app-layout--dark kbd {
  background: #4b5563;
  border-color: #6b7280;
  color: #f3f4f6;
}

.shortcut-item span {
  font-size: 14px;
  color: #6b7280;
}

.app-layout--dark .shortcut-item span {
  color: #9ca3af;
}

code {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 14px;
  font-family: monospace;
  color: #1e293b;
}

.app-layout--dark code {
  background: #475569;
  border-color: #64748b;
  color: #e2e8f0;
}
</style>