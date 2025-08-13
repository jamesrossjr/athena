<template>
  <div class="ide-page">
    <div class="ide-header">
      <input 
        v-model="localTitle" 
        @blur="updateTitle"
        class="ide-title"
        placeholder="Untitled IDE"
      />
      <div class="ide-meta">
        <span class="page-type">💻 IDE</span>
        <select v-model="selectedLanguage" class="language-select">
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
        </select>
      </div>
    </div>

    <div class="ide-content">
      <div class="code-editor">
        <div class="editor-tabs">
          <div 
            v-for="file in files" 
            :key="file.id"
            class="editor-tab"
            :class="{ active: activeFile?.id === file.id }"
            @click="setActiveFile(file)"
          >
            {{ file.content.filename }}
            <button @click.stop="closeFile(file.id)" class="close-tab">×</button>
          </div>
          <button @click="addFile" class="add-file-tab">+</button>
        </div>
        
        <div class="editor-area">
          <textarea
            v-if="activeFile"
            v-model="activeFile.content.code"
            @blur="updateFile(activeFile)"
            class="code-textarea"
            :placeholder="`Start coding in ${selectedLanguage}...`"
            spellcheck="false"
          ></textarea>
          <div v-else class="no-file-selected">
            <p>No file selected. Create a new file to start coding.</p>
          </div>
        </div>
      </div>
      
      <div class="output-panel">
        <div class="panel-header">
          <h3>Output</h3>
          <button @click="runCode" class="run-button">▶ Run</button>
        </div>
        <div class="output-content">
          <pre v-if="output" class="output-text">{{ output }}</pre>
          <p v-else class="no-output">Click "Run" to execute your code</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PageWithRelations, Block } from '~/types/unified-data-layer'

interface Props {
  page: PageWithRelations
}

interface Emits {
  update: [page: PageWithRelations]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localTitle = ref(props.page.title)
const selectedLanguage = ref('javascript')
const output = ref('')
const blocks = ref<Block[]>(props.page.blocks || [])

const files = computed(() => 
  blocks.value.filter(block => block.type === 'CODE')
    .sort((a, b) => a.position - b.position)
)

const activeFile = ref<Block | null>(null)

const setActiveFile = (file: Block) => {
  activeFile.value = file
}

const addFile = async () => {
  try {
    const filename = `file${files.value.length + 1}.${getFileExtension(selectedLanguage.value)}`
    const response = await $fetch('/api/blocks', {
      method: 'POST',
      body: {
        pageId: props.page.id,
        type: 'CODE',
        content: {
          filename,
          code: '',
          language: selectedLanguage.value
        },
        position: files.value.length
      }
    })
    
    if (response.success) {
      blocks.value.push(response.data)
      setActiveFile(response.data)
    }
  } catch (error) {
    console.error('Failed to add file:', error)
  }
}

const closeFile = async (fileId: string) => {
  if (activeFile.value?.id === fileId) {
    activeFile.value = null
  }
  blocks.value = blocks.value.filter(block => block.id !== fileId)
  
  try {
    await $fetch(`/api/blocks/${fileId}`, { method: 'DELETE' })
  } catch (error) {
    console.error('Failed to delete file:', error)
  }
}

const updateFile = async (file: Block) => {
  try {
    await $fetch(`/api/blocks/${file.id}`, {
      method: 'PUT',
      body: { content: file.content }
    })
  } catch (error) {
    console.error('Failed to update file:', error)
  }
}

const runCode = () => {
  if (!activeFile.value) return
  
  // Simple mock execution for demo
  const code = activeFile.value.content.code
  if (selectedLanguage.value === 'javascript') {
    try {
      // Note: In production, you'd use a sandboxed environment
      const result = eval(code)
      output.value = result !== undefined ? String(result) : 'Code executed successfully'
    } catch (error) {
      output.value = `Error: ${error.message}`
    }
  } else {
    output.value = `Code execution for ${selectedLanguage.value} is not implemented in this demo.`
  }
}

const getFileExtension = (language: string) => {
  const extensions = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    html: 'html',
    css: 'css'
  }
  return extensions[language] || 'txt'
}

const updateTitle = async () => {
  if (localTitle.value === props.page.title) return
  
  try {
    const response = await $fetch(`/api/pages/${props.page.id}`, {
      method: 'PUT',
      body: { title: localTitle.value }
    })
    if (response.success) emit('update', response.data)
  } catch (error) {
    console.error('Failed to update title:', error)
  }
}

watch(() => props.page.blocks, (newBlocks) => {
  if (newBlocks) {
    blocks.value = [...newBlocks]
    if (!activeFile.value && files.value.length > 0) {
      setActiveFile(files.value[0])
    }
  }
}, { immediate: true })

onMounted(() => {
  if (files.value.length === 0) {
    addFile()
  }
})
</script>

<style scoped>
.ide-page { height: 100%; display: flex; flex-direction: column; background: var(--theme-bg-primary); }
.ide-header { padding: 1rem 2rem; border-bottom: 1px solid var(--theme-border); }
.ide-title { font-size: 1.5rem; font-weight: 600; background: transparent; border: none; outline: none; margin-bottom: 0.5rem; }
.ide-meta { display: flex; gap: 1rem; align-items: center; }
.language-select { padding: 0.25rem 0.5rem; border: 1px solid var(--theme-border); border-radius: 0.25rem; background: var(--theme-surface); }
.ide-content { flex: 1; display: grid; grid-template-columns: 2fr 1fr; overflow: hidden; }
.code-editor { display: flex; flex-direction: column; border-right: 1px solid var(--theme-border); }
.editor-tabs { display: flex; background: var(--theme-hover); border-bottom: 1px solid var(--theme-border); }
.editor-tab { padding: 0.5rem 1rem; cursor: pointer; border-right: 1px solid var(--theme-border); display: flex; align-items: center; gap: 0.5rem; }
.editor-tab.active { background: var(--theme-surface); }
.close-tab { background: none; border: none; cursor: pointer; color: var(--theme-text-secondary); }
.add-file-tab { padding: 0.5rem 1rem; background: none; border: none; cursor: pointer; color: var(--theme-text-secondary); }
.editor-area { flex: 1; }
.code-textarea { width: 100%; height: 100%; padding: 1rem; border: none; outline: none; background: var(--theme-surface); font-family: 'SF Mono', monospace; font-size: 0.875rem; line-height: 1.5; resize: none; }
.no-file-selected { padding: 2rem; text-align: center; color: var(--theme-text-secondary); }
.output-panel { display: flex; flex-direction: column; background: var(--theme-surface); }
.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--theme-border); }
.run-button { padding: 0.5rem 1rem; background: var(--theme-accent); color: white; border: none; border-radius: 0.25rem; cursor: pointer; }
.output-content { flex: 1; padding: 1rem; overflow: auto; }
.output-text { font-family: 'SF Mono', monospace; font-size: 0.875rem; white-space: pre-wrap; }
.no-output { color: var(--theme-text-secondary); font-style: italic; }
</style>