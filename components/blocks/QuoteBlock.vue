<template>
  <div class="group py-2">
    <div class="flex">
      <!-- Quote indicator -->
      <div class="w-1 bg-[#37352f] dark:bg-[#ffffffcf] rounded-full mr-4 flex-shrink-0"></div>
      
      <!-- Quote content -->
      <div
        ref="contentEditable"
        contenteditable
        @input="handleInput"
        @keydown="handleKeydown"
        @blur="handleBlur"
        class="flex-1 min-h-[1.5rem] text-[#37352f] dark:text-[#ffffffcf] outline-none leading-relaxed text-lg italic font-medium"
        :placeholder="getPlaceholder()"
      ></div>
    </div>
    
    <!-- Optional attribution -->
    <div v-if="showAttribution" class="mt-2 ml-5">
      <input
        v-model="attribution"
        @input="updateAttribution"
        type="text"
        placeholder="— Source or author"
        class="bg-transparent text-sm text-[#37352f80] dark:text-[#ffffff71] outline-none w-full"
      />
    </div>
    
    <div class="ml-5 mt-1">
      <button
        @click="showAttribution = !showAttribution"
        class="opacity-0 group-hover:opacity-100 text-xs text-[#37352f80] dark:text-[#ffffff71] hover:text-[#37352f] dark:hover:text-[#ffffffcf] transition-all"
      >
        {{ showAttribution ? 'Remove attribution' : 'Add attribution' }}
      </button>
    </div>
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
const showAttribution = ref(false)
const attribution = ref('')

const updateAttribution = () => {
  // Could emit attribution change
  const content = props.modelValue
  const fullContent = attribution.value ? `${content}\n—${attribution.value}` : content
  emit('update:modelValue', fullContent)
}

const handleInput = (e) => {
  const content = e.target.innerText
  emit('update:modelValue', content)
  
  // Handle slash commands
  if (content.trim() === '/') {
    emit('command', 'slash')
  }
}

const handleKeydown = (e) => {
  if (e.key === 'Enter') {
    if (e.shiftKey) {
      // Allow line break in quote
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
  return 'Quote'
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

// Set initial content and parse attribution
onMounted(() => {
  if (contentEditable.value && props.modelValue) {
    // Check if there's attribution in the content
    const parts = props.modelValue.split('\n—')
    if (parts.length === 2) {
      contentEditable.value.innerText = parts[0]
      attribution.value = parts[1]
      showAttribution.value = true
    } else {
      contentEditable.value.innerText = props.modelValue
    }
  }
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (contentEditable.value && newValue) {
    const parts = newValue.split('\n—')
    if (parts.length === 2) {
      if (contentEditable.value.innerText !== parts[0]) {
        contentEditable.value.innerText = parts[0]
      }
      attribution.value = parts[1]
      showAttribution.value = true
    } else if (contentEditable.value.innerText !== newValue) {
      contentEditable.value.innerText = newValue
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

/* Custom focus styles for quote */
[contenteditable]:focus {
  outline: none;
}

/* Ensure proper line height for quotes */
[contenteditable] {
  line-height: 1.6;
}
</style>