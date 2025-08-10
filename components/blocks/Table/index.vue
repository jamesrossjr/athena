<template>
  <div class="table-block-editor">
    <!-- Table Interface -->
    <div class="table-container">
      <!-- Table Header -->
      <div class="table-header">
        <button @click="addColumn" class="table-action-btn">
          <span class="btn-icon">+</span>
          Add Column
        </button>
        <button @click="addRow" class="table-action-btn">
          <span class="btn-icon">+</span>
          Add Row
        </button>
        <select v-model="viewMode" class="table-view-select">
          <option value="table">Table View</option>
          <option value="cards">Card View</option>
          <option value="gallery">Gallery View</option>
        </select>
      </div>

      <!-- Table Grid -->
      <div v-if="viewMode === 'table'" class="table-grid">
        <table class="data-table">
          <thead>
            <tr>
              <th 
                v-for="(column, colIndex) in columns" 
                :key="column.id"
                class="table-header-cell"
                @contextmenu.prevent="showColumnMenu(colIndex, $event)"
              >
                <input 
                  v-model="column.name"
                  @input="updateColumn(colIndex)"
                  class="column-name-input"
                  :placeholder="'Column ' + (colIndex + 1)"
                />
                <select 
                  v-model="column.type" 
                  @change="updateColumn(colIndex)"
                  class="column-type-select"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="select">Select</option>
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="(row, rowIndex) in rows" 
              :key="row.id"
              class="table-row"
              @contextmenu.prevent="showRowMenu(rowIndex, $event)"
            >
              <td 
                v-for="(column, colIndex) in columns" 
                :key="column.id"
                class="table-cell"
              >
                <!-- Text/Number Input -->
                <input 
                  v-if="column.type === 'text' || column.type === 'number'"
                  v-model="row.data[column.id]"
                  @input="updateCell(rowIndex, column.id)"
                  :type="column.type === 'number' ? 'number' : 'text'"
                  class="cell-input"
                  :placeholder="column.type === 'text' ? 'Enter text' : 'Enter number'"
                />
                
                <!-- Date Input -->
                <input 
                  v-else-if="column.type === 'date'"
                  v-model="row.data[column.id]"
                  @input="updateCell(rowIndex, column.id)"
                  type="date"
                  class="cell-input"
                />
                
                <!-- Checkbox Input -->
                <input 
                  v-else-if="column.type === 'checkbox'"
                  v-model="row.data[column.id]"
                  @change="updateCell(rowIndex, column.id)"
                  type="checkbox"
                  class="cell-checkbox"
                />
                
                <!-- Select Input -->
                <select 
                  v-else-if="column.type === 'select'"
                  v-model="row.data[column.id]"
                  @change="updateCell(rowIndex, column.id)"
                  class="cell-select"
                >
                  <option value="">Select...</option>
                  <option 
                    v-for="option in (column.options || [])" 
                    :key="option"
                    :value="option"
                  >
                    {{ option }}
                  </option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Card View -->
      <div v-else-if="viewMode === 'cards'" class="cards-view">
        <div 
          v-for="(row, rowIndex) in rows" 
          :key="row.id"
          class="data-card"
        >
          <div 
            v-for="(column, colIndex) in columns" 
            :key="column.id"
            class="card-field"
          >
            <label class="field-label">{{ column.name || 'Column ' + (colIndex + 1) }}</label>
            <div class="field-value">
              <input 
                v-if="column.type === 'text' || column.type === 'number'"
                v-model="row.data[column.id]"
                @input="updateCell(rowIndex, column.id)"
                :type="column.type === 'number' ? 'number' : 'text'"
                class="cell-input"
              />
              <input 
                v-else-if="column.type === 'date'"
                v-model="row.data[column.id]"
                @input="updateCell(rowIndex, column.id)"
                type="date"
                class="cell-input"
              />
              <input 
                v-else-if="column.type === 'checkbox'"
                v-model="row.data[column.id]"
                @change="updateCell(rowIndex, column.id)"
                type="checkbox"
                class="cell-checkbox"
              />
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
const columns = ref(props.data?.columns || [
  { id: generateId(), name: 'Name', type: 'text' },
  { id: generateId(), name: 'Status', type: 'select', options: ['Todo', 'In Progress', 'Done'] },
  { id: generateId(), name: 'Date', type: 'date' }
])

const rows = ref(props.data?.rows || [
  { id: generateId(), data: {} },
  { id: generateId(), data: {} }
])

const viewMode = ref(props.data?.viewMode || 'table')

// Methods
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function addColumn() {
  const newColumn = {
    id: generateId(),
    name: '',
    type: 'text'
  }
  columns.value.push(newColumn)
  emitUpdate()
}

function addRow() {
  const newRow = {
    id: generateId(),
    data: {}
  }
  rows.value.push(newRow)
  emitUpdate()
}

function updateColumn(colIndex) {
  emitUpdate()
}

function updateCell(rowIndex, columnId) {
  emitUpdate()
}

function showColumnMenu(colIndex, event) {
  // TODO: Implement column context menu
  console.log('Column menu for:', colIndex)
}

function showRowMenu(rowIndex, event) {
  // TODO: Implement row context menu
  console.log('Row menu for:', rowIndex)
}

function emitUpdate() {
  emit('update', {
    columns: toRaw(columns.value),
    rows: toRaw(rows.value),
    viewMode: viewMode.value
  })
}

// Watch for changes
watch([columns, rows, viewMode], () => {
  emitUpdate()
}, { deep: true })
</script>

<style scoped>
.table-block-editor {
  width: 100%;
  height: 100%;
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}

.table-container {
  width: 100%;
  height: 100%;
  padding: 16px 0;
}

.table-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 0 8px;
}

.table-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.table-action-btn:hover {
  background: #e9ecef;
}

.btn-icon {
  font-weight: bold;
}

.table-view-select {
  padding: 8px 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.table-grid {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.table-header-cell {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 12px;
  text-align: left;
  vertical-align: top;
}

.column-name-input {
  width: 100%;
  border: none;
  background: transparent;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  outline: none;
}

.column-type-select {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  font-size: 12px;
  background: white;
}

.table-row {
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background: #f8f9fa;
}

.table-cell {
  border: 1px solid #e9ecef;
  padding: 12px;
  vertical-align: top;
}

.cell-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
  min-width: 120px;
}

.cell-checkbox {
  transform: scale(1.2);
}

.cell-select {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
}

/* Cards View */
.cards-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding: 0 8px;
}

.data-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-field {
  margin-bottom: 12px;
}

.card-field:last-child {
  margin-bottom: 0;
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
}

.field-value {
  width: 100%;
}
</style>