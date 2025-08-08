<template>
  <div class="group py-1">
    <div
      ref="contentEditable"
      contenteditable
      @input="handleInput"
      @keydown="handleKeydown"
      @blur="handleBlur"
      class="min-h-[1.5rem] text-[#37352f] dark:text-[#ffffffcf] outline-none leading-relaxed"
      :class="{
        'text-4xl font-bold mb-2': block.type === 'heading1',
        'text-2xl font-bold mb-1': block.type === 'heading2', 
        'text-xl font-bold mb-1': block.type === 'heading3',
        'text-base': block.type === 'text',
        'pl-4 border-l-4 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 italic': block.type === 'quote',
        'font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm': block.type === 'code'
      }"
      :placeholder="getPlaceholder()"
      v-html="formattedContent"
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

const formattedContent = computed(() => {
  let content = props.modelValue
  
  // Format bullet points
  if (props.block.type === 'bullet' && !content.startsWith('•')) {
    content = '• ' + content.replace(/^[•\-\*]\s*/, '')
  }
  
  // Format numbered lists
  if (props.block.type === 'number' && !content.match(/^\d+\./)) {
    content = '1. ' + content.replace(/^\d+\.\s*/, '')
  }
  
  // Format todos
  if (props.block.type === 'todo' && !content.startsWith('☐')) {
    content = '☐ ' + content.replace(/^[☐☑]\s*/, '')
  }
  
  return content
})

const handleInput = (e) => {
  const content = e.target.innerText
  emit('update:modelValue', content)
  
  // Handle slash commands
  if (content === '/') {
    emit('command', 'slash')
  }
  
  // Handle block transformations
  if (content.startsWith('# ')) {
    emit('command', { type: 'transform', to: 'heading1', content: content.slice(2) })
  } else if (content.startsWith('## ')) {
    emit('command', { type: 'transform', to: 'heading2', content: content.slice(3) })
  } else if (content.startsWith('### ')) {
    emit('command', { type: 'transform', to: 'heading3', content: content.slice(4) })
  } else if (content.startsWith('- ') || content.startsWith('* ')) {
    emit('command', { type: 'transform', to: 'bullet', content: content.slice(2) })
  } else if (content.match(/^1\. /)) {
    emit('command', { type: 'transform', to: 'number', content: content.slice(3) })
  } else if (content.startsWith('[ ] ')) {
    emit('command', { type: 'transform', to: 'todo', content: content.slice(4) })
  } else if (content.startsWith('> ')) {
    emit('command', { type: 'transform', to: 'quote', content: content.slice(2) })
  }
}

const handleKeydown = (e) => {
  if (e.key === 'Enter') {
    if (e.shiftKey) {
      // Allow line break
      return
    }
    e.preventDefault()
    emit('command', 'newBlock')
  } else if (e.key === 'Backspace' && props.modelValue === '') {
    e.preventDefault()
    emit('command', 'delete')
  } else if (e.key === 'ArrowUp' && getCaretPosition() === 0) {
    emit('command', 'focusPrevious')
  } else if (e.key === 'ArrowDown' && getCaretPosition() === props.modelValue.length) {
    emit('command', 'focusNext')
  }
}

const handleBlur = () => {
  // Save content on blur
}

const getPlaceholder = () => {
  const placeholders = {
    text: "Type '/' for commands",
    heading1: 'Heading 1',
    heading2: 'Heading 2', 
    heading3: 'Heading 3',
    bullet: 'List item',
    number: 'List item',
    todo: 'To-do item',
    quote: 'Quote',
    code: 'Code'
  }
  return placeholders[props.block.type] || "Type '/' for commands"
}

const getCaretPosition = () => {
  const selection = window.getSelection()
  if (selection.rangeCount === 0) return 0
  const range = selection.getRangeAt(0)
  return range.startOffset
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
</style>