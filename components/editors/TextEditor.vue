<script setup lang="ts">
interface Props {
  content?: any
  documentId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [content: any]
}>()

const editorContent = ref(props.content || '')

watch(editorContent, (newContent) => {
  emit('update', newContent)
})
</script>

<template>
  <div class="prose max-w-none p-6">
    <h2 class="text-xl font-semibold mb-4">Text Editor</h2>
    <UTextarea
      v-model="editorContent"
      placeholder="Start writing your document..."
      :rows="20"
      class="w-full"
    />
  </div>
</template>