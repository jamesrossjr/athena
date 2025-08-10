<template>
  <div class="group py-1 flex items-start space-x-2">
    <button 
      @click="toggleComplete"
      class="mt-1 p-0.5 hover:bg-[#efefef] dark:hover:bg-[#2a2a2a] rounded transition-colors"
    >
      <div class="w-4 h-4 border border-[#37352f80] dark:border-[#ffffff71] rounded flex items-center justify-center"
           :class="{ 'bg-blue-500 border-blue-500': isComplete }">
        <Icon v-if="isComplete" name="heroicons:check" class="h-3 w-3 text-white" />
      </div>
    </button>
    
    <div
      ref="contentEditable"
      contenteditable
      @input="handleInput"
      @keydown="handleKeydown"
      @blur="handleBlur"
      class="flex-1 min-h-[1.5rem] text-[#37352f] dark:text-[#ffffffcf] outline-none leading-relaxed"
      :class="{ 'line-through opacity-60': isComplete }"
      :placeholder="getPlaceholder()"
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
const isComplete = ref(false)

const toggleComplete = () => {
  isComplete.value = !isComplete.value
  // Update the block content to include completion status
  const content = props.modelValue.replace(/^[☐☑]\s*/, '')
  const newContent = (isComplete.value ? '☑ ' : '☐ ') + content
  emit('update:modelValue', newContent)
}

const handleInput = (e) => {
  const content = e.target.innerText
  const prefixedContent = (isComplete.value ? '☑ ' : '☐ ') + content
  emit('update:modelValue', prefixedContent)
  
  // Handle slash commands
  if (content === '/') {
    emit('command', 'slash')
  }
}

const handleKeydown = (e) => {
  if (e.key === 'Enter') {
    if (e.shiftKey) {
      return
    }
    e.preventDefault()
    emit('command', 'newBlock')
  } else if (e.key === 'Backspace' && getTextContent() === '') {
    e.preventDefault()
    emit('command', 'delete')
  } else if (e.key === 'ArrowUp' && getCaretPosition() === 0) {
    emit('command', 'focusPrevious')
  } else if (e.key === 'ArrowDown' && getCaretPosition() === getTextContent().length) {
    emit('command', 'focusNext')
  }
}

const handleBlur = () => {
  // Save content on blur
}

const getPlaceholder = () => {
  return 'To-do item'
}

const getCaretPosition = () => {
  const selection = window.getSelection()
  if (selection.rangeCount === 0) return 0
  const range = selection.getRangeAt(0)
  return range.startOffset
}

const getTextContent = () => {
  return contentEditable.value ? contentEditable.value.innerText : ''
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

// Set initial content and completion status
onMounted(() => {
  if (contentEditable.value && props.modelValue) {
    // Check if the content indicates completion
    isComplete.value = props.modelValue.startsWith('☑')
    // Remove the checkbox prefix for display
    const content = props.modelValue.replace(/^[☐☑]\s*/, '')
    contentEditable.value.innerText = content
  }
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (contentEditable.value && newValue) {
    isComplete.value = newValue.startsWith('☑')
    const content = newValue.replace(/^[☐☑]\s*/, '')
    if (contentEditable.value.innerText !== content) {
      contentEditable.value.innerText = content
    }
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