<template>
  <div v-if="selectedCommand && shouldShowPreview" class="command-preview">
    <!-- Theme Preview -->
    <div v-if="selectedCommand.id === 'theme-dark'" class="preview-theme dark">
      <div class="preview-window">
        <div class="preview-header">Dark Theme</div>
        <div class="preview-content">
          <div class="preview-text">Your workspace in dark mode</div>
          <div class="preview-blocks">
            <div class="preview-block">Header Block</div>
            <div class="preview-block">Text content would appear like this</div>
            <div class="preview-block todo">✓ Completed task</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="selectedCommand.id === 'theme-light'" class="preview-theme light">
      <div class="preview-window">
        <div class="preview-header">Light Theme</div>
        <div class="preview-content">
          <div class="preview-text">Your workspace in light mode</div>
          <div class="preview-blocks">
            <div class="preview-block">Header Block</div>
            <div class="preview-block">Text content would appear like this</div>
            <div class="preview-block todo">✓ Completed task</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Formatting Preview -->
    <div v-else-if="selectedCommand.id === 'bold'" class="preview-formatting">
      <div class="preview-title">Bold Formatting</div>
      <div class="preview-text">
        Selected text will appear <strong>bold like this</strong>
      </div>
      <div class="preview-shortcut">Shortcut: {{ selectedCommand.shortcut }}</div>
    </div>

    <div v-else-if="selectedCommand.id === 'italic'" class="preview-formatting">
      <div class="preview-title">Italic Formatting</div>
      <div class="preview-text">
        Selected text will appear <em>italic like this</em>
      </div>
      <div class="preview-shortcut">Shortcut: {{ selectedCommand.shortcut }}</div>
    </div>

    <!-- Content Block Preview -->
    <div v-else-if="selectedCommand.id === 'heading'" class="preview-content-block">
      <div class="preview-title">Heading Block</div>
      <div class="preview-block-example">
        <h1 class="preview-heading">Your heading text here</h1>
      </div>
    </div>

    <div v-else-if="selectedCommand.id === 'todo'" class="preview-content-block">
      <div class="preview-title">Todo Block</div>
      <div class="preview-block-example">
        <div class="preview-todo">
          <input type="checkbox" /> Your todo item here
        </div>
        <div class="preview-todo">
          <input type="checkbox" checked /> Completed task
        </div>
      </div>
    </div>

    <div v-else-if="selectedCommand.id === 'bullet-list'" class="preview-content-block">
      <div class="preview-title">Bullet List</div>
      <div class="preview-block-example">
        <ul class="preview-list">
          <li>First bullet point</li>
          <li>Second bullet point</li>
          <li>Third bullet point</li>
        </ul>
      </div>
    </div>

    <!-- Workspace Preview -->
    <div v-else-if="selectedCommand.id === 'new-workspace'" class="preview-workspace">
      <div class="preview-title">New Workspace</div>
      <div class="preview-workspace-structure">
        <div class="workspace-icon">📁</div>
        <div class="workspace-name">My New Workspace</div>
        <div class="workspace-pages">
          <div class="page-item">📄 Getting Started</div>
          <div class="page-item">📋 Tasks</div>
          <div class="page-item">📝 Notes</div>
        </div>
      </div>
    </div>

    <!-- AI Command Preview -->
    <div v-else-if="selectedCommand.category === 'AI & Tools'" class="preview-ai">
      <div class="preview-title">{{ selectedCommand.label }}</div>
      <div class="preview-ai-process">
        <div class="ai-step">1. Analyze selected content</div>
        <div class="ai-step">2. Process with AI</div>
        <div class="ai-step">3. Return enhanced result</div>
      </div>
      <div class="preview-note">
        <span class="note-icon">💡</span>
        AI-powered enhancement using your local Ollama instance
      </div>
    </div>

    <!-- Workflow Preview -->
    <div v-else-if="selectedCommand.category === 'Workflows'" class="preview-workflow">
      <div class="preview-title">{{ selectedCommand.label }}</div>
      <div class="workflow-steps">
        <div class="workflow-step">
          <span class="step-number">1</span>
          <span class="step-description">Create new workflow</span>
        </div>
        <div class="workflow-step">
          <span class="step-number">2</span>
          <span class="step-description">Define command sequence</span>
        </div>
        <div class="workflow-step">
          <span class="step-number">3</span>
          <span class="step-description">Set trigger phrase</span>
        </div>
      </div>
    </div>

    <!-- Default Preview -->
    <div v-else class="preview-default">
      <div class="preview-title">{{ selectedCommand.label }}</div>
      <div class="preview-description">{{ selectedCommand.description }}</div>
      <div v-if="selectedCommand.shortcut" class="preview-shortcut">
        Shortcut: {{ selectedCommand.shortcut }}
      </div>
      <div class="preview-category">{{ selectedCommand.category }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  selectedCommand: any
}

const props = defineProps<Props>()

// Commands that should show visual previews
const previewableCommands = [
  'theme-dark', 'theme-light', 'bold', 'italic', 'heading', 'todo', 
  'bullet-list', 'new-workspace'
]

const shouldShowPreview = computed(() => {
  if (!props.selectedCommand) return false
  
  // Always show preview for AI commands and workflows
  if (props.selectedCommand.category === 'AI & Tools' || 
      props.selectedCommand.category === 'Workflows') {
    return true
  }
  
  // Show preview for specific previewable commands
  return previewableCommands.includes(props.selectedCommand.id)
})
</script>

<style scoped>
.command-preview {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background: #fafbfc;
  min-height: 120px;
  max-height: 200px;
  overflow-y: auto;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.preview-description {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.preview-shortcut {
  font-size: 11px;
  color: #9ca3af;
  font-family: monospace;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

.preview-category {
  font-size: 11px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 8px;
}

/* Theme Preview */
.preview-theme {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-theme.dark {
  background: #1f2937;
  color: #f9fafb;
}

.preview-theme.light {
  background: #ffffff;
  color: #111827;
  border: 1px solid #e5e7eb;
}

.preview-window {
  padding: 12px;
}

.preview-header {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  opacity: 0.8;
}

.preview-content {
  font-size: 11px;
}

.preview-blocks {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-block {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
}

.preview-theme.dark .preview-block {
  background: rgba(255, 255, 255, 0.1);
}

.preview-theme.light .preview-block {
  background: rgba(0, 0, 0, 0.05);
}

.preview-block.todo {
  opacity: 0.7;
}

/* Formatting Preview */
.preview-formatting {
  text-align: center;
}

.preview-text {
  font-size: 13px;
  margin: 12px 0;
  padding: 8px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

/* Content Block Preview */
.preview-content-block {
  text-align: center;
}

.preview-block-example {
  margin: 12px 0;
  padding: 12px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.preview-heading {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.preview-todo {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
  font-size: 13px;
}

.preview-list {
  text-align: left;
  margin: 0;
  padding-left: 20px;
}

.preview-list li {
  margin: 4px 0;
  font-size: 13px;
}

/* Workspace Preview */
.preview-workspace {
  text-align: center;
}

.preview-workspace-structure {
  margin: 12px 0;
  padding: 12px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.workspace-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.workspace-name {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.workspace-pages {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-item {
  font-size: 12px;
  color: #6b7280;
  padding: 4px 8px;
  background: #f9fafb;
  border-radius: 4px;
}

/* AI Preview */
.preview-ai {
  text-align: center;
}

.preview-ai-process {
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ai-step {
  font-size: 12px;
  color: #6b7280;
  padding: 6px 12px;
  background: #eff6ff;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.preview-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: #6b7280;
  margin-top: 8px;
  padding: 6px 12px;
  background: #fef3c7;
  border-radius: 6px;
}

.note-icon {
  font-size: 14px;
}

/* Workflow Preview */
.preview-workflow {
  text-align: center;
}

.workflow-steps {
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.workflow-step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: #6b7280;
  padding: 6px 12px;
  background: #f0fdf4;
  border-radius: 6px;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-description {
  flex: 1;
  text-align: left;
}

/* Default Preview */
.preview-default {
  text-align: center;
}
</style>