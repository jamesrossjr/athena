<script setup lang="ts">
interface Props {
  content?: any
  documentId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [content: any]
}>()

const databaseData = ref(props.content || {
  columns: [
    { id: 1, name: 'Name', type: 'text' },
    { id: 2, name: 'Status', type: 'select' },
    { id: 3, name: 'Date', type: 'date' }
  ],
  rows: [
    { id: 1, data: { Name: 'Sample Item', Status: 'Active', Date: '2024-01-01' } }
  ]
})

function addRow() {
  const newRow = {
    id: Date.now(),
    data: {}
  }
  
  databaseData.value.columns.forEach(col => {
    newRow.data[col.name] = ''
  })
  
  databaseData.value.rows.push(newRow)
  emit('update', databaseData.value)
}

function updateCell(rowId: number, columnName: string, value: string) {
  const row = databaseData.value.rows.find(r => r.id === rowId)
  if (row) {
    row.data[columnName] = value
    emit('update', databaseData.value)
  }
}
</script>

<template>
  <div class="p-6">
    <div class="mb-4 flex justify-between items-center">
      <h2 class="text-xl font-semibold">Database View</h2>
      <UButton @click="addRow" size="sm">Add Row</UButton>
    </div>
    
    <div class="overflow-x-auto">
      <table class="min-w-full border border-gray-300">
        <thead class="bg-gray-50">
          <tr>
            <th
              v-for="column in databaseData.columns"
              :key="column.id"
              class="px-4 py-2 border-b border-gray-300 text-left font-medium"
            >
              {{ column.name }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in databaseData.rows"
            :key="row.id"
            class="hover:bg-gray-50"
          >
            <td
              v-for="column in databaseData.columns"
              :key="column.id"
              class="px-4 py-2 border-b border-gray-200"
            >
              <UInput
                :model-value="row.data[column.name]"
                @update:model-value="updateCell(row.id, column.name, $event)"
                size="sm"
                class="w-full"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <p class="text-gray-500 text-sm mt-2">
      {{ databaseData.rows.length }} rows, {{ databaseData.columns.length }} columns
    </p>
  </div>
</template>