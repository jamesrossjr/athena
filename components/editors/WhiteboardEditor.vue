<script setup lang="ts">
interface Props {
  content?: any
  documentId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [content: any]
}>()

const whiteboardData = ref(props.content || { elements: [] })

function addElement(type: string) {
  const newElement = {
    id: Date.now(),
    type,
    x: Math.random() * 400,
    y: Math.random() * 300,
    text: type === 'text' ? 'New text' : '',
    width: 100,
    height: 50
  }
  
  whiteboardData.value.elements.push(newElement)
  emit('update', whiteboardData.value)
}
</script>

<template>
  <div class="p-6">
    <div class="mb-4 flex gap-2">
      <UButton @click="addElement('rectangle')" size="sm">Add Rectangle</UButton>
      <UButton @click="addElement('circle')" size="sm">Add Circle</UButton>
      <UButton @click="addElement('text')" size="sm">Add Text</UButton>
    </div>
    
    <div class="border border-gray-300 rounded-lg bg-white relative h-96 overflow-hidden">
      <div
        v-for="element in whiteboardData.elements"
        :key="element.id"
        class="absolute border border-blue-300 bg-blue-50 p-2 cursor-move"
        :style="{
          left: element.x + 'px',
          top: element.y + 'px',
          width: element.width + 'px',
          height: element.height + 'px'
        }"
      >
        <div v-if="element.type === 'text'" class="text-sm">
          {{ element.text }}
        </div>
        <div v-else-if="element.type === 'rectangle'" class="w-full h-full bg-blue-200 rounded"></div>
        <div v-else-if="element.type === 'circle'" class="w-full h-full bg-green-200 rounded-full"></div>
      </div>
    </div>
    
    <p class="text-gray-500 text-sm mt-2">
      Whiteboard with {{ whiteboardData.elements.length }} elements
    </p>
  </div>
</template>