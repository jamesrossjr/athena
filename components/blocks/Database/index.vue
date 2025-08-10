<template>
  <div class="database-block-editor">
    <!-- Database Interface ---->
    <div class="database-container">
      <!-- Database Header -->
      <div class="database-header">
        <div class="header-actions">
          <button @click="addRecord" class="db-action-btn">
            <span class="btn-icon">+</span>
            New Record
          </button>
          <button @click="addField" class="db-action-btn">
            <span class="btn-icon">⚏</span>
            Add Field
          </button>
          <select v-model="viewMode" class="db-view-select">
            <option value="table">Table</option>
            <option value="cards">Cards</option>
            <option value="gallery">Gallery</option>
            <option value="kanban">Kanban</option>
          </select>
          <button @click="toggleFilters" class="db-action-btn" :class="{ 'active': showFilters }">
            <span class="btn-icon">⚙</span>
            Filter
          </button>
        </div>
      </div>

      <!-- Filter Panel -->
      <div v-if="showFilters" class="filter-panel">
        <div class="filter-controls">
          <select v-model="filterField" class="filter-select">
            <option value="">Select field to filter...</option>
            <option v-for="field in fields" :key="field.id" :value="field.id">
              {{ field.name }}
            </option>
          </select>
          <select v-if="filterField" v-model="filterOperator" class="filter-select">
            <option value="equals">Equals</option>
            <option value="contains">Contains</option>
            <option value="starts_with">Starts with</option>
            <option value="greater_than">Greater than</option>
            <option value="less_than">Less than</option>
          </select>
          <input 
            v-if="filterField" 
            v-model="filterValue" 
            @input="applyFilters"
            class="filter-input"
            placeholder="Filter value..."
          />
          <button v-if="filterField" @click="clearFilters" class="clear-filter-btn">Clear</button>
        </div>
      </div>

      <!-- Table View -->
      <div v-if="viewMode === 'table'" class="table-view">
        <div class="table-scroll">
          <table class="database-table">
            <thead>
              <tr>
                <th 
                  v-for="field in fields" 
                  :key="field.id"
                  class="table-header"
                  @click="sortByField(field.id)"
                  :class="{ 'sorted': sortField === field.id }"
                >
                  <div class="header-content">
                    <input 
                      v-model="field.name"
                      @input="updateField(field.id)"
                      class="field-name-input"
                      :placeholder="'Field ' + fields.indexOf(field) + 1"
                    />
                    <select 
                      v-model="field.type" 
                      @change="updateField(field.id)"
                      class="field-type-select"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="boolean">Checkbox</option>
                      <option value="select">Select</option>
                      <option value="multi-select">Multi-select</option>
                      <option value="url">URL</option>
                      <option value="email">Email</option>
                      <option value="file">File</option>
                    </select>
                    <span v-if="sortField === field.id" class="sort-indicator">
                      {{ sortDirection === 'asc' ? '↑' : '↓' }}
                    </span>
                  </div>
                </th>
                <th class="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="record in filteredRecords" 
                :key="record.id"
                class="table-row"
              >
                <td v-for="field in fields" :key="field.id" class="table-cell">
                  <component 
                    :is="getCellComponent(field.type)"
                    v-model="record.data[field.id]"
                    :field="field"
                    @input="updateRecord(record.id, field.id)"
                  />
                </td>
                <td class="actions-cell">
                  <button @click="deleteRecord(record.id)" class="delete-btn">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cards View -->
      <div v-else-if="viewMode === 'cards'" class="cards-view">
        <div class="records-grid">
          <div 
            v-for="record in filteredRecords" 
            :key="record.id"
            class="record-card"
          >
            <div class="card-header">
              <span class="card-id">{{ record.id.slice(-6) }}</span>
              <button @click="deleteRecord(record.id)" class="card-delete-btn">×</button>
            </div>
            <div class="card-fields">
              <div 
                v-for="field in fields" 
                :key="field.id"
                class="card-field"
              >
                <label class="field-label">{{ field.name || 'Untitled' }}</label>
                <component 
                  :is="getCellComponent(field.type)"
                  v-model="record.data[field.id]"
                  :field="field"
                  @input="updateRecord(record.id, field.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gallery View -->
      <div v-else-if="viewMode === 'gallery'" class="gallery-view">
        <div class="gallery-grid">
          <div 
            v-for="record in filteredRecords" 
            :key="record.id"
            class="gallery-item"
          >
            <div class="gallery-image">
              <div v-if="getImageField(record)" class="image-container">
                <img :src="record.data[getImageField(record).id]" :alt="getRecordTitle(record)" />
              </div>
              <div v-else class="placeholder-image">📄</div>
            </div>
            <div class="gallery-info">
              <h3 class="gallery-title">{{ getRecordTitle(record) }}</h3>
              <p class="gallery-subtitle">{{ getRecordSubtitle(record) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Kanban View -->
      <div v-else-if="viewMode === 'kanban'" class="kanban-view">
        <div class="kanban-columns">
          <div 
            v-for="status in kanbanStatuses" 
            :key="status"
            class="kanban-column"
          >
            <div class="column-header">
              <h3>{{ status }}</h3>
              <span class="record-count">{{ getRecordsByStatus(status).length }}</span>
            </div>
            <div class="column-records">
              <div 
                v-for="record in getRecordsByStatus(status)" 
                :key="record.id"
                class="kanban-card"
                @click="selectRecord(record.id)"
              >
                <h4>{{ getRecordTitle(record) }}</h4>
                <p>{{ getRecordSubtitle(record) }}</p>
                <div class="card-meta">
                  <span class="record-id">{{ record.id.slice(-6) }}</span>
                  <button @click.stop="deleteRecord(record.id)" class="delete-btn">×</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  blockId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update'])

// State
const fields = ref(props.data?.fields || [
  { id: generateId(), name: 'Title', type: 'text' },
  { id: generateId(), name: 'Status', type: 'select', options: ['Todo', 'In Progress', 'Done'] },
  { id: generateId(), name: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
  { id: generateId(), name: 'Date Created', type: 'date' }
])

const records = ref(props.data?.records || [
  { id: generateId(), data: { [fields.value[0].id]: 'Sample Record 1', [fields.value[1].id]: 'Todo' } },
  { id: generateId(), data: { [fields.value[0].id]: 'Sample Record 2', [fields.value[1].id]: 'In Progress' } }
])

const viewMode = ref(props.data?.viewMode || 'table')
const sortField = ref('')
const sortDirection = ref('asc')
const showFilters = ref(false)
const filterField = ref('')
const filterOperator = ref('equals')
const filterValue = ref('')

// Computed
const filteredRecords = computed(() => {
  let filtered = [...records.value]
  
  if (filterField.value && filterValue.value) {
    filtered = filtered.filter(record => {
      const value = record.data[filterField.value]
      if (!value) return false
      
      switch (filterOperator.value) {
        case 'equals':
          return value.toString().toLowerCase() === filterValue.value.toLowerCase()
        case 'contains':
          return value.toString().toLowerCase().includes(filterValue.value.toLowerCase())
        case 'starts_with':
          return value.toString().toLowerCase().startsWith(filterValue.value.toLowerCase())
        case 'greater_than':
          return parseFloat(value) > parseFloat(filterValue.value)
        case 'less_than':
          return parseFloat(value) < parseFloat(filterValue.value)
        default:
          return true
      }
    })
  }
  
  if (sortField.value) {
    filtered.sort((a, b) => {
      const aVal = a.data[sortField.value] || ''
      const bVal = b.data[sortField.value] || ''
      
      let comparison = 0
      if (aVal > bVal) comparison = 1
      if (aVal < bVal) comparison = -1
      
      return sortDirection.value === 'asc' ? comparison : -comparison
    })
  }
  
  return filtered
})

const kanbanStatuses = computed(() => {
  const statusField = fields.value.find(f => f.name.toLowerCase().includes('status'))
  return statusField?.options || ['Todo', 'In Progress', 'Done']
})

// Methods
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function addRecord() {
  const newRecord = {
    id: generateId(),
    data: {}
  }
  records.value.push(newRecord)
  emitUpdate()
}

function addField() {
  const newField = {
    id: generateId(),
    name: '',
    type: 'text'
  }
  fields.value.push(newField)
  emitUpdate()
}

function updateField(fieldId) {
  emitUpdate()
}

function updateRecord(recordId, fieldId) {
  emitUpdate()
}

function deleteRecord(recordId) {
  const index = records.value.findIndex(r => r.id === recordId)
  if (index !== -1) {
    records.value.splice(index, 1)
    emitUpdate()
  }
}

function sortByField(fieldId) {
  if (sortField.value === fieldId) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = fieldId
    sortDirection.value = 'asc'
  }
}

function toggleFilters() {
  showFilters.value = !showFilters.value
}

function applyFilters() {
  // Filters are applied automatically through computed property
}

function clearFilters() {
  filterField.value = ''
  filterOperator.value = 'equals'
  filterValue.value = ''
}

function getCellComponent(fieldType) {
  return 'input' // Simplified for now - would use custom components
}

function getImageField(record) {
  return fields.value.find(f => f.type === 'file' || f.type === 'url')
}

function getRecordTitle(record) {
  const titleField = fields.value[0]
  return record.data[titleField.id] || 'Untitled'
}

function getRecordSubtitle(record) {
  const subtitleField = fields.value[1]
  return record.data[subtitleField?.id] || ''
}

function getRecordsByStatus(status) {
  const statusField = fields.value.find(f => f.name.toLowerCase().includes('status'))
  if (!statusField) return []
  
  return filteredRecords.value.filter(record => 
    record.data[statusField.id] === status
  )
}

function selectRecord(recordId) {
  // TODO: Implement record selection/editing
  console.log('Selected record:', recordId)
}

function emitUpdate() {
  emit('update', {
    fields: toRaw(fields.value),
    records: toRaw(records.value),
    viewMode: viewMode.value,
    sortField: sortField.value,
    sortDirection: sortDirection.value
  })
}

// Watch for changes
watch([fields, records, viewMode], () => {
  emitUpdate()
}, { deep: true })
</script>

<style scoped>
.database-block-editor {
  width: 100%;
  height: 100%;
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

.database-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.database-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.db-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.db-action-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.db-action-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.btn-icon {
  font-size: 16px;
}

.db-view-select {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.filter-panel {
  padding: 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select, .filter-input {
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
}

.clear-filter-btn {
  padding: 6px 10px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

/* Table View */
.table-view {
  flex: 1;
  overflow: hidden;
}

.table-scroll {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.database-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.table-header {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  cursor: pointer;
  position: sticky;
  top: 0;
  z-index: 10;
}

.table-header:hover {
  background: #f3f4f6;
}

.table-header.sorted {
  background: #eff6ff;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  position: relative;
}

.field-name-input {
  width: 100%;
  border: none;
  background: transparent;
  font-weight: 600;
  font-size: 14px;
  outline: none;
}

.field-type-select {
  width: 100%;
  padding: 2px 6px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 12px;
  background: white;
}

.sort-indicator {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 12px;
  color: #3b82f6;
}

.table-row {
  border-bottom: 1px solid #e5e7eb;
}

.table-row:hover {
  background: #f9fafb;
}

.table-cell {
  border: 1px solid #e5e7eb;
  padding: 12px;
  vertical-align: top;
}

.actions-header, .actions-cell {
  width: 80px;
  text-align: center;
}

.delete-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  color: #ef4444;
}

.delete-btn:hover {
  background: #fef2f2;
}

/* Cards View */
.cards-view {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.records-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.record-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 12px;
}

.card-id {
  font-size: 12px;
  color: #6b7280;
  font-family: monospace;
}

.card-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #9ca3af;
  padding: 2px;
}

.card-delete-btn:hover {
  color: #ef4444;
}

.card-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

/* Gallery View */
.gallery-view {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.gallery-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.gallery-image {
  aspect-ratio: 16/9;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-image {
  font-size: 48px;
  color: #9ca3af;
}

.gallery-info {
  padding: 12px;
}

.gallery-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1f2937;
}

.gallery-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* Kanban View */
.kanban-view {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.kanban-columns {
  display: flex;
  gap: 16px;
  min-height: 100%;
}

.kanban-column {
  flex: 1;
  min-width: 280px;
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.column-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1f2937;
}

.record-count {
  background: #e5e7eb;
  color: #6b7280;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.column-records {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kanban-card {
  background: white;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.kanban-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.kanban-card h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: #1f2937;
}

.kanban-card p {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.record-id {
  font-size: 10px;
  color: #9ca3af;
  font-family: monospace;
}
</style>