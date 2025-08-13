<template>
  <div class="table-page">
    <div class="table-container">
      <div class="table-header">
        <input 
          v-model="localTitle" 
          @blur="updateTitle"
          class="table-title"
          placeholder="Untitled Table"
        />
        <div class="table-meta">
          <span class="page-type">📊 Table</span>
          <span class="cell-count">{{ rows.length }} rows × {{ columns.length }} columns</span>
        </div>
      </div>

      <div class="spreadsheet-container">
        <table class="spreadsheet">
          <thead>
            <tr>
              <th class="row-header"></th>
              <th 
                v-for="(col, index) in columns" 
                :key="col.id"
                class="column-header"
              >
                {{ getColumnLabel(index) }}
              </th>
              <th class="add-column">
                <button @click="addColumn" class="add-button">+</button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in rows" :key="row.id">
              <td class="row-number">{{ rowIndex + 1 }}</td>
              <td 
                v-for="(col, colIndex) in columns" 
                :key="`${row.id}-${col.id}`"
                class="table-cell"
              >
                <input
                  v-model="row.content.cells[col.id]"
                  @blur="updateRow(row)"
                  class="cell-input"
                  type="text"
                />
              </td>
              <td class="row-actions">
                <button @click="deleteRow(row.id)" class="delete-button">×</button>
              </td>
            </tr>
            <tr>
              <td class="add-row" :colspan="columns.length + 2">
                <button @click="addRow" class="add-row-button">+ Add Row</button>
              </td>
            </tr>
          </tbody>
        </table>
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
const blocks = ref<Block[]>(props.page.blocks || [])

const columns = computed(() => 
  blocks.value.filter(block => block.type === 'DATABASE_COLUMN')
    .sort((a, b) => a.position - b.position)
)

const rows = computed(() => 
  blocks.value.filter(block => block.type === 'DATABASE_ROW')
    .sort((a, b) => a.position - b.position)
)

const getColumnLabel = (index: number) => {
  return String.fromCharCode(65 + index) // A, B, C, etc.
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

const addColumn = async () => {
  try {
    const response = await $fetch('/api/blocks', {
      method: 'POST',
      body: {
        pageId: props.page.id,
        type: 'DATABASE_COLUMN',
        content: { name: `Column ${columns.value.length + 1}`, type: 'text' },
        position: columns.value.length
      }
    })
    if (response.success) blocks.value.push(response.data)
  } catch (error) {
    console.error('Failed to add column:', error)
  }
}

const addRow = async () => {
  try {
    const cells: Record<string, any> = {}
    columns.value.forEach(col => { cells[col.id] = '' })
    
    const response = await $fetch('/api/blocks', {
      method: 'POST',
      body: {
        pageId: props.page.id,
        type: 'DATABASE_ROW',
        content: { cells },
        position: rows.value.length
      }
    })
    if (response.success) blocks.value.push(response.data)
  } catch (error) {
    console.error('Failed to add row:', error)
  }
}

const updateRow = async (row: Block) => {
  try {
    await $fetch(`/api/blocks/${row.id}`, {
      method: 'PUT',
      body: { content: row.content }
    })
  } catch (error) {
    console.error('Failed to update row:', error)
  }
}

const deleteRow = async (rowId: string) => {
  try {
    await $fetch(`/api/blocks/${rowId}`, { method: 'DELETE' })
    blocks.value = blocks.value.filter(block => block.id !== rowId)
  } catch (error) {
    console.error('Failed to delete row:', error)
  }
}

watch(() => props.page.blocks, (newBlocks) => {
  if (newBlocks) blocks.value = [...newBlocks]
}, { immediate: true })
</script>

<style scoped>
.table-page { height: 100%; overflow: auto; background: var(--theme-bg-primary); }
.table-container { padding: 2rem; }
.table-title { font-size: 2rem; font-weight: 700; background: transparent; border: none; outline: none; margin-bottom: 0.5rem; width: 100%; }
.table-meta { display: flex; gap: 1rem; font-size: 0.875rem; color: var(--theme-text-secondary); margin-bottom: 2rem; }
.spreadsheet-container { overflow: auto; border: 1px solid var(--theme-border); border-radius: 0.5rem; }
.spreadsheet { width: 100%; border-collapse: collapse; background: var(--theme-surface); }
.column-header, .row-header { background: var(--theme-hover); padding: 0.75rem; border: 1px solid var(--theme-border); font-weight: 600; text-align: center; min-width: 120px; }
.row-number { background: var(--theme-hover); padding: 0.75rem; border: 1px solid var(--theme-border); text-align: center; font-weight: 600; width: 60px; }
.table-cell { padding: 0; border: 1px solid var(--theme-border); }
.cell-input { width: 100%; padding: 0.75rem; border: none; outline: none; background: transparent; }
.add-button, .delete-button { background: transparent; border: none; cursor: pointer; padding: 0.5rem; }
.add-row-button { width: 100%; padding: 1rem; background: transparent; border: none; color: var(--theme-text-secondary); cursor: pointer; }
</style>