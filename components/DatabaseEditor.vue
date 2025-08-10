<template>
  <div class="database-editor h-full flex flex-col bg-white">
    <!-- Toolbar -->
    <div class="border-b border-gray-200 p-4 flex items-center gap-4 bg-gray-50">
      <div class="flex items-center gap-2">
        <!-- Schema Controls -->
        <button 
          @click="addColumn"
          class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          title="Add Column"
        >
          + Column
        </button>
        
        <button 
          @click="addRecord"
          class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          title="Add Record"
        >
          + Record
        </button>
        
        <div class="h-6 w-px bg-gray-300 mx-2"></div>
        
        <!-- View Controls -->
        <button 
          @click="toggleView('table')"
          :class="[
            'px-3 py-1 text-sm rounded transition-colors',
            currentView === 'table' ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300'
          ]"
        >
          Table
        </button>
        
        <button 
          @click="toggleView('form')"
          :class="[
            'px-3 py-1 text-sm rounded transition-colors',
            currentView === 'form' ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300'
          ]"
        >
          Form
        </button>
        
        <button 
          @click="toggleView('schema')"
          :class="[
            'px-3 py-1 text-sm rounded transition-colors',
            currentView === 'schema' ? 'bg-gray-800 text-white' : 'bg-gray-200 hover:bg-gray-300'
          ]"
        >
          Schema
        </button>
      </div>
      
      <div class="ml-auto flex items-center gap-4">
        <!-- Search -->
        <div class="relative" v-if="currentView === 'table'">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search records..."
            class="pl-8 pr-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg class="absolute left-2 top-2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </div>
        
        <!-- Record Count -->
        <span class="text-sm text-gray-500">
          {{ filteredRecords.length }} records
        </span>
        
        <!-- Export -->
        <button 
          @click="exportData"
          class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Export JSON
        </button>
      </div>
    </div>
    
    <!-- Schema View -->
    <div v-if="currentView === 'schema'" class="flex-1 overflow-auto p-6">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">Database Schema</h2>
        
        <div class="space-y-4">
          <div 
            v-for="(column, index) in schema" 
            :key="`column-${index}`"
            class="bg-gray-50 border border-gray-200 rounded-lg p-4"
          >
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <!-- Column Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Column Name
                </label>
                <input
                  v-model="column.name"
                  @input="updateDatabase"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Column name"
                />
              </div>
              
              <!-- Column Type -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  v-model="column.type"
                  @change="updateDatabase"
                  class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                  <option value="email">Email</option>
                  <option value="url">URL</option>
                </select>
              </div>
              
              <!-- Required -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Options
                </label>
                <div class="flex items-center space-x-4">
                  <label class="flex items-center">
                    <input
                      v-model="column.required"
                      @change="updateDatabase"
                      type="checkbox"
                      class="mr-2"
                    />
                    Required
                  </label>
                  <label class="flex items-center">
                    <input
                      v-model="column.unique"
                      @change="updateDatabase"
                      type="checkbox"
                      class="mr-2"
                    />
                    Unique
                  </label>
                </div>
              </div>
              
              <!-- Actions -->
              <div>
                <button 
                  @click="removeColumn(index)"
                  class="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
          
          <button 
            @click="addColumn"
            class="w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors rounded-lg"
          >
            + Add Column
          </button>
        </div>
      </div>
    </div>
    
    <!-- Table View -->
    <div v-else-if="currentView === 'table'" class="flex-1 overflow-auto">
      <table class="w-full border-collapse">
        <!-- Headers -->
        <thead class="sticky top-0">
          <tr class="bg-gray-100">
            <th class="w-12 border border-gray-300 text-center text-sm font-medium text-gray-700 py-2">
              #
            </th>
            <th 
              v-for="column in schema" 
              :key="`header-${column.name}`"
              class="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 min-w-32"
            >
              <div class="flex items-center justify-between">
                <span>{{ column.name }}</span>
                <span class="text-xs text-gray-500 ml-2">{{ column.type }}</span>
              </div>
            </th>
            <th class="w-20 border border-gray-300 text-center text-sm font-medium text-gray-700 py-2">
              Actions
            </th>
          </tr>
        </thead>
        
        <!-- Data Rows -->
        <tbody>
          <tr 
            v-for="(record, index) in filteredRecords" 
            :key="`record-${index}`"
            class="hover:bg-gray-50"
          >
            <!-- Row Number -->
            <td class="border border-gray-300 bg-gray-50 text-center text-sm text-gray-600 py-2 font-medium">
              {{ index + 1 }}
            </td>
            
            <!-- Data Cells -->
            <td 
              v-for="column in schema" 
              :key="`cell-${index}-${column.name}`"
              class="border border-gray-300 p-0"
            >
              <component 
                :is="getCellComponent(column.type)"
                v-model="record[column.name]"
                :column="column"
                @update="updateDatabase"
                class="w-full px-3 py-2 bg-transparent border-0 outline-none text-sm min-w-32"
              />
            </td>
            
            <!-- Actions -->
            <td class="border border-gray-300 text-center py-2">
              <button 
                @click="deleteRecord(index)"
                class="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete Record"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </td>
          </tr>
          
          <!-- Empty State -->
          <tr v-if="filteredRecords.length === 0">
            <td :colspan="schema.length + 2" class="text-center py-8 text-gray-500">
              {{ searchQuery ? 'No records found matching your search.' : 'No records yet. Add your first record!' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Form View -->
    <div v-else-if="currentView === 'form'" class="flex-1 overflow-auto p-6">
      <div class="max-w-2xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ editingRecord !== null ? 'Edit Record' : 'Add New Record' }}
          </h2>
          
          <div class="flex items-center gap-2">
            <button 
              v-if="editingRecord !== null"
              @click="cancelEdit"
              class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button 
              @click="saveRecord"
              class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {{ editingRecord !== null ? 'Update' : 'Save' }}
            </button>
          </div>
        </div>
        
        <div class="space-y-6">
          <div v-for="column in schema" :key="`form-${column.name}`">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ column.name }}
              <span v-if="column.required" class="text-red-500">*</span>
            </label>
            
            <component 
              :is="getFormComponent(column.type)"
              v-model="formData[column.name]"
              :column="column"
              :class="[
                'w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                column.required && !formData[column.name] ? 'border-red-300' : ''
              ]"
            />
            
            <p v-if="column.required && !formData[column.name]" class="mt-1 text-sm text-red-600">
              This field is required.
            </p>
          </div>
        </div>
        
        <!-- Existing Records List -->
        <div v-if="records.length > 0" class="mt-8">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Existing Records</h3>
          <div class="space-y-2">
            <div 
              v-for="(record, index) in records" 
              :key="`existing-${index}`"
              class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded"
            >
              <div class="flex-1">
                <span class="text-sm text-gray-900">
                  {{ getRecordSummary(record) }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  @click="editRecord(index)"
                  class="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Edit"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </button>
                <button 
                  @click="deleteRecord(index)"
                  class="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
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
  document: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update'])

// Initialize database structure
function initializeDatabase() {
  const savedData = props.document.content
  
  if (savedData && savedData.schema && savedData.records) {
    return {
      schema: savedData.schema.map(col => ({ ...col })),
      records: savedData.records.map(record => ({ ...record }))
    }
  }
  
  // Default schema
  return {
    schema: [
      { name: 'Name', type: 'text', required: true, unique: false },
      { name: 'Email', type: 'email', required: false, unique: true },
      { name: 'Created', type: 'date', required: false, unique: false }
    ],
    records: []
  }
}

const { schema: initialSchema, records: initialRecords } = initializeDatabase()

// State
const schema = ref(initialSchema)
const records = ref(initialRecords)
const currentView = ref('table')
const searchQuery = ref('')
const editingRecord = ref(null)
const formData = ref({})

// Form components
const TextInput = {
  props: ['modelValue', 'column'],
  emits: ['update:modelValue'],
  template: `<input 
    :value="modelValue" 
    @input="$emit('update:modelValue', $event.target.value)"
    :type="column.type === 'email' ? 'email' : column.type === 'url' ? 'url' : 'text'"
    :placeholder="'Enter ' + column.name.toLowerCase()"
  />`
}

const NumberInput = {
  props: ['modelValue', 'column'],
  emits: ['update:modelValue'],
  template: `<input 
    :value="modelValue" 
    @input="$emit('update:modelValue', Number($event.target.value))"
    type="number"
    :placeholder="'Enter ' + column.name.toLowerCase()"
  />`
}

const BooleanInput = {
  props: ['modelValue', 'column'],
  emits: ['update:modelValue'],
  template: `<select :value="modelValue" @change="$emit('update:modelValue', $event.target.value === 'true')">
    <option value="">Select...</option>
    <option value="true">True</option>
    <option value="false">False</option>
  </select>`
}

const DateInput = {
  props: ['modelValue', 'column'],
  emits: ['update:modelValue'],
  template: `<input 
    :value="modelValue" 
    @input="$emit('update:modelValue', $event.target.value)"
    type="date"
  />`
}

// Computed
const filteredRecords = computed(() => {
  if (!searchQuery.value) return records.value
  
  const query = searchQuery.value.toLowerCase()
  return records.value.filter(record => {
    return schema.value.some(column => {
      const value = record[column.name]
      return value && String(value).toLowerCase().includes(query)
    })
  })
})

// Methods
function toggleView(view) {
  currentView.value = view
  if (view === 'form') {
    resetForm()
  }
}

function addColumn() {
  schema.value.push({
    name: `Column ${schema.value.length + 1}`,
    type: 'text',
    required: false,
    unique: false
  })
  
  // Add empty values for this column to all existing records
  records.value.forEach(record => {
    record[`Column ${schema.value.length}`] = ''
  })
  
  updateDatabase()
}

function removeColumn(index) {
  const columnName = schema.value[index].name
  
  // Remove from schema
  schema.value.splice(index, 1)
  
  // Remove from all records
  records.value.forEach(record => {
    delete record[columnName]
  })
  
  updateDatabase()
}

function addRecord() {
  if (currentView.value === 'form') {
    saveRecord()
  } else {
    const newRecord = {}
    schema.value.forEach(column => {
      newRecord[column.name] = getDefaultValue(column.type)
    })
    records.value.push(newRecord)
    updateDatabase()
  }
}

function deleteRecord(index) {
  if (confirm('Are you sure you want to delete this record?')) {
    records.value.splice(index, 1)
    updateDatabase()
  }
}

function editRecord(index) {
  editingRecord.value = index
  formData.value = { ...records.value[index] }
  currentView.value = 'form'
}

function saveRecord() {
  // Validate required fields
  const missingFields = schema.value
    .filter(column => column.required && !formData.value[column.name])
    .map(column => column.name)
  
  if (missingFields.length > 0) {
    alert(`Please fill in required fields: ${missingFields.join(', ')}`)
    return
  }
  
  // Check unique constraints
  for (const column of schema.value) {
    if (column.unique && formData.value[column.name]) {
      const existing = records.value.find((record, index) => 
        index !== editingRecord.value && 
        record[column.name] === formData.value[column.name]
      )
      
      if (existing) {
        alert(`${column.name} must be unique. This value already exists.`)
        return
      }
    }
  }
  
  if (editingRecord.value !== null) {
    // Update existing record
    records.value[editingRecord.value] = { ...formData.value }
  } else {
    // Add new record
    records.value.push({ ...formData.value })
  }
  
  resetForm()
  updateDatabase()
}

function cancelEdit() {
  resetForm()
}

function resetForm() {
  editingRecord.value = null
  formData.value = {}
  
  // Initialize with default values
  schema.value.forEach(column => {
    formData.value[column.name] = getDefaultValue(column.type)
  })
}

function getDefaultValue(type) {
  switch (type) {
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'date':
      return new Date().toISOString().split('T')[0]
    default:
      return ''
  }
}

function getCellComponent(type) {
  switch (type) {
    case 'number':
      return NumberInput
    case 'boolean':
      return BooleanInput
    case 'date':
      return DateInput
    default:
      return TextInput
  }
}

function getFormComponent(type) {
  return getCellComponent(type)
}

function getRecordSummary(record) {
  const firstColumn = schema.value[0]
  const value = record[firstColumn.name]
  return value || 'Untitled Record'
}

function exportData() {
  const data = {
    schema: schema.value,
    records: records.value
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.document.name || 'database'}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function updateDatabase() {
  const content = {
    schema: schema.value,
    records: records.value
  }
  emit('update', { ...props.document, content })
}

// Watch for document changes
watch(() => props.document.content, (newContent) => {
  if (newContent && newContent !== { schema: schema.value, records: records.value }) {
    if (newContent.schema) schema.value = newContent.schema.map(col => ({ ...col }))
    if (newContent.records) records.value = newContent.records.map(record => ({ ...record }))
  }
}, { deep: true })

// Initialize form data
onMounted(() => {
  resetForm()
})

// Auto-save functionality
watch([schema, records], () => {
  updateDatabase()
}, { deep: true, debounce: 500 })
</script>

<style scoped>
/* Table styles */
table {
  border-spacing: 0;
}

th, td {
  border: 1px solid #d1d5db;
}

/* Form styles */
input, select, textarea {
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Custom scrollbar */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>