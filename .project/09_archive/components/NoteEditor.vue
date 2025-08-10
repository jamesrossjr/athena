<template>
  <UCard>
    <template #header>
      <UInput
        v-model="localNote.title"
        placeholder="Note title..."
        variant="none"
        size="lg"
        class="font-semibold"
        @input="handleTitleChange"
      />
    </template>
    
    <div class="note-editor">
      <UTextarea
        v-model="localNote.content"
        placeholder="Start writing your note..."
        :rows="20"
        variant="none"
        resize
        @input="handleContentChange"
      />
    </div>
    
    <template #footer>
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500">
          Last saved: {{ formatDate(localNote.updated) }}
        </div>
        <div class="flex space-x-2">
          <UButton variant="outline" size="xs" @click="insertLink">
            [[Link]]
          </UButton>
          <UButton variant="outline" size="xs" @click="insertBlock">
            ((Block))
          </UButton>
          <UButton size="xs" @click="saveNote">
            Save
          </UButton>
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup>
const props = defineProps(['note'])
const emit = defineEmits(['save'])

const localNote = ref({ ...props.note })

const handleTitleChange = () => {
  localNote.value.updated = new Date()
}

const handleContentChange = () => {
  localNote.value.updated = new Date()
}

const insertLink = () => {
  const textarea = document.querySelector('textarea')
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = localNote.value.content
  localNote.value.content = text.substring(0, start) + '[[]]' + text.substring(end)
}

const insertBlock = () => {
  const textarea = document.querySelector('textarea')
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = localNote.value.content
  localNote.value.content = text.substring(0, start) + '(())' + text.substring(end)
}

const saveNote = () => {
  emit('save', localNote.value)
}

const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

watch(() => props.note, (newNote) => {
  localNote.value = { ...newNote }
}, { deep: true })
</script>