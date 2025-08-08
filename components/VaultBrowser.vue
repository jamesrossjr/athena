<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Vault</h3>
        <UButton variant="ghost" size="xs" icon="i-heroicons-folder-plus" />
      </div>
    </template>
    
    <div class="vault-tree">
      <div
        v-for="item in vaultItems"
        :key="item.id"
        class="vault-tree-item"
        @click="selectItem(item)"
      >
        <div class="flex items-center space-x-2">
          <Icon
            :name="item.type === 'folder' ? 'heroicons:folder' : 'heroicons:document-text'"
            class="h-4 w-4"
            :class="item.type === 'folder' ? 'text-blue-600' : 'text-gray-600'"
          />
          <span class="text-sm">{{ item.name }}</span>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup>
const emit = defineEmits(['select'])

// Mock vault structure
const vaultItems = [
  { id: 1, name: 'Projects', type: 'folder' },
  { id: 2, name: 'Daily Notes', type: 'folder' },
  { id: 3, name: 'Research', type: 'folder' },
  { id: 4, name: 'Meeting Notes', type: 'note' },
  { id: 5, name: 'Ideas', type: 'note' },
  { id: 6, name: 'Todo', type: 'note' }
]

const selectItem = (item) => {
  if (item.type === 'note') {
    emit('select', {
      id: item.id,
      title: item.name,
      content: `# ${item.name}\n\nContent for ${item.name}...`,
      created: new Date(),
      updated: new Date()
    })
  }
}
</script>