<template>
  <div class="group py-2">
    <!-- Language selector -->
    <div class="flex items-center justify-between mb-2">
      <select 
        v-model="language"
        @change="updateLanguage"
        class="text-xs bg-transparent text-[#37352f80] dark:text-[#ffffff71] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded px-2 py-1 outline-none"
      >
        <option value="text">Plain Text</option>
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="html">HTML</option>
        <option value="css">CSS</option>
        <option value="vue">Vue</option>
        <option value="python">Python</option>
        <option value="bash">Bash</option>
        <option value="json">JSON</option>
        <option value="sql">SQL</option>
      </select>
      
      <button
        @click="copyCode"
        class="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#efefef] dark:hover:bg-[#2a2a2a] rounded transition-all text-[#37352f80] dark:text-[#ffffff71]"
      >
        <Icon name="heroicons:clipboard" class="h-4 w-4" />
      </button>
    </div>
    
    <!-- Code content -->
    <div
      ref="contentEditable"
      contenteditable
      @input="handleInput"
      @keydown="handleKeydown"
      @blur="handleBlur"
      class="min-h-[3rem] p-3 bg-[#f7f6f3] dark:bg-[#2a2a2a] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-lg font-mono text-sm text-[#37352f] dark:text-[#ffffffcf] outline-none leading-relaxed whitespace-pre-wrap overflow-x-auto"
      :placeholder="getPlaceholder()"
      spellcheck="false"
      @paste="handlePaste"
    ></div>
  </div>
</template>

<script setup>
const props = defineProps({
  block: {
    type: Object,
    required: true
  },
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'command'])

const contentEditable = ref(null)
const language = ref('javascript')

const updateLanguage = () => {
  // Could emit language change for syntax highlighting
  emit('update:modelValue', props.modelValue)
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.modelValue || '')
    // Could show toast notification here
  } catch (err) {
    console.error('Failed to copy code:', err)
  }
}

const handleInput = (e) => {
  const content = e.target.innerText
  emit('update:modelValue', content)
  
  // Handle slash commands at beginning
  if (content.trim() === '/') {
    emit('command', 'slash')
  }
}

const handleKeydown = (e) => {
  // Handle tab indentation
  if (e.key === 'Tab') {
    e.preventDefault()
    const selection = window.getSelection()
    const range = selection.getRangeAt(0)
    const tabNode = document.createTextNode('  ') // 2 spaces
    range.insertNode(tabNode)
    range.setStartAfter(tabNode)
    range.setEndAfter(tabNode)
    selection.removeAllRanges()
    selection.addRange(range)
    handleInput(e)
    return
  }
  
  if (e.key === 'Enter') {
    if (e.shiftKey) {
      // Allow line break in code
      return
    }
    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd + Enter to create new block
      e.preventDefault()
      emit('command', 'newBlock')
    }
    // Otherwise allow normal line breaks in code
  } else if (e.key === 'Backspace' && props.modelValue === '') {
    e.preventDefault()
    emit('command', 'delete')
  } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && (e.ctrlKey || e.metaKey)) {
    // Only navigate blocks with Ctrl/Cmd modifier
    if (e.key === 'ArrowUp') {
      emit('command', 'focusPrevious')
    } else {
      emit('command', 'focusNext')
    }
  }
}

const handlePaste = (e) => {
  // Handle paste to preserve formatting
  e.preventDefault()
  const paste = e.clipboardData.getData('text')
  const selection = window.getSelection()
  const range = selection.getRangeAt(0)
  range.deleteContents()
  range.insertNode(document.createTextNode(paste))
  range.setStartAfter(range.endContainer)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
  handleInput(e)
}

const handleBlur = () => {
  // Save content on blur
}

const getPlaceholder = () => {
  return 'Type your code...'
}

// Focus the element when needed
const focus = () => {
  nextTick(() => {
    if (contentEditable.value) {
      contentEditable.value.focus()
      // Set cursor to end
      const range = document.createRange()
      const selection = window.getSelection()
      range.selectNodeContents(contentEditable.value)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  })
}

defineExpose({ focus })

// Set initial content
onMounted(() => {
  if (contentEditable.value && props.modelValue) {
    contentEditable.value.innerText = props.modelValue
  }
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (contentEditable.value && contentEditable.value.innerText !== newValue) {
    contentEditable.value.innerText = newValue || ''
  }
})
</script>

<style scoped>
[contenteditable]:empty:before {
  content: attr(placeholder);
  color: #9ca3af;
  pointer-events: none;
  display: block;
}

[contenteditable]:focus:before {
  display: none;
}

/* Dark mode placeholder */
.dark [contenteditable]:empty:before {
  color: #6b7280;
}

/* Ensure consistent font in code blocks */
[contenteditable] {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
}
</style>