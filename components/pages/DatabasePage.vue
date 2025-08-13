<template>
  <div class="database-page">
    <div class="database-container">
      <!-- Database Header -->
      <div class="database-header">
        <div class="header-left">
          <input 
            v-model="localTitle" 
            @blur="updateTitle"
            class="database-title"
            placeholder="Untitled Database"
          />
          <div class="database-meta">
            <span class="page-type">🗃️ Database</span>
            <span class="record-count">{{ records.length }} records</span>
            <span class="last-updated">{{ formatDate(page.updatedAt) }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button @click="addRecord" class="add-record-button">
            <Icon name="i-heroicons-plus" class="plus-icon" />
            Add Record
          </button>
        </div>
      </div>

      <!-- Database Table -->
      <div class="database-content">
        <div class="table-wrapper">
          <table class="database-table">
            <!-- Table Header -->
            <thead>
              <tr>
                <th class="row-number-header">#</th>
                <th 
                  v-for="column in columns" 
                  :key="column.id"
                  class="column-header"
                >
                  <div class="column-header-content">
                    <span class="column-icon">{{ getColumnIcon(column.content.type) }}</span>
                    <input 
                      v-model="column.content.name"
                      @blur="updateColumn(column)"
                      class="column-name-input"
                      placeholder="Column name"
                    />
                    <div class="column-type">{{ column.content.type }}</div>
                  </div>
                </th>
                <th class="add-column-header">
                  <button @click="addColumn" class="add-column-button">
                    <Icon name="i-heroicons-plus" class="plus-icon" />
                  </button>
                </th>
              </tr>
            </thead>

            <!-- Table Body -->
            <tbody>
              <tr 
                v-for="(record, rowIndex) in records" 
                :key="record.id"
                class="table-row"
              >
                <td class="row-number">{{ rowIndex + 1 }}</td>
                <td 
                  v-for="column in columns" 
                  :key="`${record.id}-${column.id}`"
                  class="table-cell"
                >
                  <DatabaseCell
                    :record="record"
                    :column="column"
                    @update="updateCell"
                  />
                </td>
                <td class="row-actions">
                  <button 
                    @click="deleteRecord(record.id)" 
                    class="delete-row-button"
                    title="Delete record"
                  >
                    <Icon name="i-heroicons-trash" class="delete-icon" />
                  </button>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-if="records.length === 0" class="empty-row">
                <td :colspan="columns.length + 2" class="empty-cell">
                  <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <p>No records yet. Add your first record to get started.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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

// Local state
const localTitle = ref(props.page.title)
const blocks = ref<Block[]>(props.page.blocks || [])

// Computed properties for database structure
const columns = computed(() => 
  blocks.value.filter(block => block.type === 'DATABASE_COLUMN')
    .sort((a, b) => a.position - b.position)
)

const records = computed(() => 
  blocks.value.filter(block => block.type === 'DATABASE_ROW')
    .sort((a, b) => a.position - b.position)
)

// Watch for page changes
watch(() => props.page.blocks, (newBlocks) => {
  if (newBlocks) {
    blocks.value = [...newBlocks]
  }
}, { immediate: true })

// Column type icons
const getColumnIcon = (type: string) => {
  const icons = {
    text: '📝',
    number: '🔢',
    boolean: '☑️',
    date: '📅',
    select: '📋',
    multiselect: '🏷️',
    relation: '🔗'
  }
  return icons[type] || '📝'
}

// Update page title
const updateTitle = async () => {
  if (localTitle.value === props.page.title) return

  try {
    const response = await $fetch(`/api/pages/${props.page.id}`, {
      method: 'PUT',
      body: { title: localTitle.value }
    })

    if (response.success) {
      emit('update', response.data)
    }
  } catch (error) {
    console.error('Failed to update title:', error)
    localTitle.value = props.page.title
  }
}

// Add new column
const addColumn = async () => {
  try {
    const response = await $fetch('/api/blocks', {
      method: 'POST',
      body: {
        pageId: props.page.id,
        type: 'DATABASE_COLUMN',
        content: {
          name: 'New Column',
          type: 'text'
        },
        position: columns.value.length
      }
    })

    if (response.success) {
      blocks.value.push(response.data)
    }
  } catch (error) {
    console.error('Failed to add column:', error)
  }
}

// Update column
const updateColumn = async (column: Block) => {
  try {
    await $fetch(`/api/blocks/${column.id}`, {
      method: 'PUT',
      body: { content: column.content }
    })
  } catch (error) {
    console.error('Failed to update column:', error)
  }
}

// Add new record
const addRecord = async () => {
  try {
    // Create empty cells for all columns
    const cells: Record<string, any> = {}
    columns.value.forEach(column => {
      cells[column.id] = getDefaultValue(column.content.type)
    })

    const response = await $fetch('/api/blocks', {
      method: 'POST',
      body: {
        pageId: props.page.id,
        type: 'DATABASE_ROW',
        content: { cells },
        position: records.value.length
      }
    })

    if (response.success) {
      blocks.value.push(response.data)
    }
  } catch (error) {
    console.error('Failed to add record:', error)
  }
}

// Delete record
const deleteRecord = async (recordId: string) => {
  try {
    await $fetch(`/api/blocks/${recordId}`, {
      method: 'DELETE'
    })

    // Remove from local state
    blocks.value = blocks.value.filter(block => block.id !== recordId)
  } catch (error) {
    console.error('Failed to delete record:', error)
  }
}

// Update cell
const updateCell = async (record: Block, columnId: string, value: any) => {
  try {
    const updatedCells = { ...record.content.cells, [columnId]: value }
    
    const response = await $fetch(`/api/blocks/${record.id}`, {
      method: 'PUT',
      body: { 
        content: { 
          ...record.content, 
          cells: updatedCells 
        } 
      }
    })

    if (response.success) {
      const index = blocks.value.findIndex(b => b.id === record.id)
      if (index > -1) {
        blocks.value[index] = response.data
      }
    }
  } catch (error) {
    console.error('Failed to update cell:', error)
  }
}

// Get default value for column type
const getDefaultValue = (type: string) => {
  switch (type) {
    case 'text': return ''
    case 'number': return 0
    case 'boolean': return false
    case 'date': return null
    case 'select': return null
    case 'multiselect': return []
    default: return ''
  }
}

// Format date helper
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.database-page {
  height: 100%;
  overflow: hidden;
  background: var(--theme-bg-primary);
}

.database-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2rem;
}

.database-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-shrink: 0;
}

.database-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--theme-text-primary);
  background: transparent;
  border: none;
  outline: none;
  margin-bottom: 0.5rem;
  width: 100%;
}

.database-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
}

.page-type {
  font-weight: 500;
}

.add-record-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--theme-accent);
  color: var(--theme-bg-primary);
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-record-button:hover {
  opacity: 0.9;
}

.database-content {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--theme-border);
  border-radius: 0.5rem;
  background: var(--theme-surface);
}

.table-wrapper {
  min-width: 100%;
}

.database-table {
  width: 100%;
  border-collapse: collapse;
}

/* Table Header */
.column-header {
  background: var(--theme-hover);
  border-bottom: 1px solid var(--theme-border);
  border-right: 1px solid var(--theme-border);
  padding: 0;
  min-width: 150px;
}

.column-header-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
}

.column-icon {
  font-size: 0.875rem;
}

.column-name-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.column-type {
  font-size: 0.75rem;
  color: var(--theme-text-secondary);
  text-transform: uppercase;
  font-weight: 500;
}

.row-number-header {
  background: var(--theme-hover);
  border-bottom: 1px solid var(--theme-border);
  border-right: 1px solid var(--theme-border);
  padding: 0.75rem;
  width: 60px;
  text-align: center;
  font-weight: 600;
  color: var(--theme-text-secondary);
}

.add-column-header {
  background: var(--theme-hover);
  border-bottom: 1px solid var(--theme-border);
  padding: 0.75rem;
  width: 60px;
}

.add-column-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: 1px dashed var(--theme-border);
  border-radius: 0.25rem;
  color: var(--theme-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.add-column-button:hover {
  background: var(--theme-surface);
  color: var(--theme-text-primary);
}

/* Table Body */
.table-row {
  border-bottom: 1px solid var(--theme-border);
}

.table-row:hover {
  background: var(--theme-hover);
}

.row-number {
  padding: 0.75rem;
  text-align: center;
  color: var(--theme-text-secondary);
  border-right: 1px solid var(--theme-border);
  background: var(--theme-surface);
}

.table-cell {
  padding: 0;
  border-right: 1px solid var(--theme-border);
  min-width: 150px;
}

.row-actions {
  padding: 0.75rem;
  width: 60px;
  text-align: center;
}

.delete-row-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  color: var(--theme-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.delete-row-button:hover {
  background: #fee2e2;
  color: #dc2626;
}

.delete-icon {
  width: 1rem;
  height: 1rem;
}

/* Empty State */
.empty-row {
  height: 200px;
}

.empty-cell {
  text-align: center;
  color: var(--theme-text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.5;
}

.plus-icon {
  width: 1rem;
  height: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .database-container {
    padding: 1rem;
  }
  
  .database-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .database-title {
    font-size: 1.5rem;
  }
  
  .column-header {
    min-width: 120px;
  }
}
</style>