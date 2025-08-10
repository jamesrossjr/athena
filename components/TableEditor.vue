<template>
  <div class="table-editor h-full flex flex-col bg-white">
    <!-- Toolbar -->
    <div class="border-b border-gray-200 p-4 flex items-center gap-4 bg-gray-50">
      <div class="flex items-center gap-2">
        <!-- Row/Column Controls -->
        <button 
          @click="addRow"
          class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          title="Add Row"
        >
          + Row
        </button>
        
        <button 
          @click="addColumn"
          class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          title="Add Column"
        >
          + Column
        </button>
        
        <div class="h-6 w-px bg-gray-300 mx-2"></div>
        
        <button 
          @click="deleteRow"
          :disabled="selectedRow === null || tableData.length <= 1"
          class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          title="Delete Selected Row"
        >
          Delete Row
        </button>
        
        <button 
          @click="deleteColumn"
          :disabled="selectedColumn === null || headers.length <= 1"
          class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          title="Delete Selected Column"
        >
          Delete Column
        </button>
      </div>
      
      <div class="ml-auto flex items-center gap-4">
        <!-- Table Size -->
        <span class="text-sm text-gray-500">
          {{ tableData.length }} rows × {{ headers.length }} columns
        </span>
        
        <!-- Export Options -->
        <button 
          @click="exportCSV"
          class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Export CSV
        </button>
      </div>
    </div>
    
    <!-- Table Container -->
    <div class="flex-1 overflow-auto">
      <div class="min-w-full">
        <table class="w-full border-collapse">
          <!-- Headers -->
          <thead>
            <tr>
              <!-- Row Number Header -->
              <th class="w-12 border border-gray-300 bg-gray-100 text-center text-sm font-medium text-gray-700 py-2">
                #
              </th>
              <!-- Column Headers -->
              <th 
                v-for="(header, colIndex) in headers" 
                :key="`header-${colIndex}`"
                class="border border-gray-300 bg-gray-100 min-w-32 relative"
                :class="{ 'bg-blue-100': selectedColumn === colIndex }"
                @click="selectColumn(colIndex)"
              >
                <input
                  v-model="headers[colIndex]"
                  @input="updateTable"
                  @click.stop
                  class="w-full px-2 py-2 bg-transparent text-sm font-medium text-gray-700 text-center border-0 outline-none"
                  :placeholder="`Column ${colIndex + 1}`"
                />
              </th>
            </tr>
          </thead>
          
          <!-- Data Rows -->
          <tbody>
            <tr 
              v-for="(row, rowIndex) in tableData" 
              :key="`row-${rowIndex}`"
              :class="{ 'bg-blue-50': selectedRow === rowIndex }"
              @click="selectRow(rowIndex)"
            >
              <!-- Row Number -->
              <td class="border border-gray-300 bg-gray-50 text-center text-sm text-gray-600 py-2 font-medium">
                {{ rowIndex + 1 }}
              </td>
              
              <!-- Data Cells -->
              <td 
                v-for="(cell, colIndex) in row" 
                :key="`cell-${rowIndex}-${colIndex}`"
                class="border border-gray-300 p-0"
                :class="{ 
                  'bg-blue-100': selectedColumn === colIndex,
                  'bg-blue-200': selectedRow === rowIndex && selectedColumn === colIndex
                }"
              >
                <input
                  v-model="row[colIndex]"
                  @input="updateTable"
                  @click.stop
                  @focus="selectCell(rowIndex, colIndex)"
                  @keydown="handleKeydown($event, rowIndex, colIndex)"
                  class="w-full px-2 py-2 bg-transparent text-sm border-0 outline-none min-w-32"
                  :placeholder="headers[colIndex] || `Col ${colIndex + 1}`"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Context Menu -->
    <div 
      v-if="showContextMenu" 
      :style="{ top: contextMenuY + 'px', left: contextMenuX + 'px' }"
      class="fixed bg-white border border-gray-300 rounded shadow-lg py-2 z-50"
      @click.stop
    >
      <button 
        @click="insertRowAbove"
        class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        Insert Row Above
      </button>
      <button 
        @click="insertRowBelow"
        class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        Insert Row Below
      </button>
      <hr class="my-1 border-gray-200">
      <button 
        @click="insertColumnLeft"
        class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        Insert Column Left
      </button>
      <button 
        @click="insertColumnRight"
        class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        Insert Column Right
      </button>
      <hr class="my-1 border-gray-200">
      <button 
        @click="clearCell"
        class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors text-red-600"
      >
        Clear Cell
      </button>
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

// Initialize table data
const initializeTable = () => {
  const savedData = props.document.content
  
  if (savedData && savedData.headers && savedData.data) {
    return {
      headers: [...savedData.headers],
      data: savedData.data.map(row => [...row])
    }
  }
  
  // Default 5x5 table
  return {
    headers: ['Column 1', 'Column 2', 'Column 3', 'Column 4', 'Column 5'],
    data: Array(5).fill(null).map(() => Array(5).fill(''))
  }
}

const { headers: initialHeaders, data } = initializeTable()
const tableData = ref(data)
const headerData = ref(initialHeaders)

// Use computed to keep reactivity
const headers = computed({
  get: () => headerData.value,
  set: (value) => {
    headerData.value = value
    updateTable()
  }
})

// Selection state
const selectedRow = ref(null)
const selectedColumn = ref(null)
const selectedCellRow = ref(null)
const selectedCellCol = ref(null)

// Context menu
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)

// Methods
function updateTable() {
  const content = {
    headers: headerData.value,
    data: tableData.value
  }
  emit('update', { ...props.document, content })
}

function addRow() {
  const newRow = Array(headerData.value.length).fill('')
  tableData.value.push(newRow)
  updateTable()
}

function addColumn() {
  const newHeader = `Column ${headerData.value.length + 1}`
  headerData.value.push(newHeader)
  
  tableData.value.forEach(row => {
    row.push('')
  })
  
  updateTable()
}

function deleteRow() {
  if (selectedRow.value !== null && tableData.value.length > 1) {
    tableData.value.splice(selectedRow.value, 1)
    selectedRow.value = null
    updateTable()
  }
}

function deleteColumn() {
  if (selectedColumn.value !== null && headerData.value.length > 1) {
    headerData.value.splice(selectedColumn.value, 1)
    
    tableData.value.forEach(row => {
      row.splice(selectedColumn.value, 1)
    })
    
    selectedColumn.value = null
    updateTable()
  }
}

function selectRow(rowIndex) {
  selectedRow.value = rowIndex
  selectedColumn.value = null
}

function selectColumn(colIndex) {
  selectedColumn.value = colIndex
  selectedRow.value = null
}

function selectCell(rowIndex, colIndex) {
  selectedCellRow.value = rowIndex
  selectedCellCol.value = colIndex
  selectedRow.value = null
  selectedColumn.value = null
}

function handleKeydown(event, rowIndex, colIndex) {
  switch (event.key) {
    case 'Tab':
      event.preventDefault()
      if (event.shiftKey) {
        // Move to previous cell
        if (colIndex > 0) {
          focusCell(rowIndex, colIndex - 1)
        } else if (rowIndex > 0) {
          focusCell(rowIndex - 1, headerData.value.length - 1)
        }
      } else {
        // Move to next cell
        if (colIndex < headerData.value.length - 1) {
          focusCell(rowIndex, colIndex + 1)
        } else if (rowIndex < tableData.value.length - 1) {
          focusCell(rowIndex + 1, 0)
        }
      }
      break
      
    case 'Enter':
      event.preventDefault()
      if (rowIndex < tableData.value.length - 1) {
        focusCell(rowIndex + 1, colIndex)
      }
      break
      
    case 'ArrowUp':
      if (rowIndex > 0) {
        focusCell(rowIndex - 1, colIndex)
      }
      break
      
    case 'ArrowDown':
      if (rowIndex < tableData.value.length - 1) {
        focusCell(rowIndex + 1, colIndex)
      }
      break
      
    case 'ArrowLeft':
      if (event.target.selectionStart === 0 && colIndex > 0) {
        focusCell(rowIndex, colIndex - 1)
      }
      break
      
    case 'ArrowRight':
      if (event.target.selectionEnd === event.target.value.length && colIndex < headerData.value.length - 1) {
        focusCell(rowIndex, colIndex + 1)
      }
      break
  }
}

function focusCell(rowIndex, colIndex) {
  nextTick(() => {
    const cell = document.querySelector(`tr:nth-child(${rowIndex + 1}) td:nth-child(${colIndex + 2}) input`)
    if (cell) {
      cell.focus()
      cell.select()
    }
  })
}

function showContextMenuAt(event) {
  event.preventDefault()
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  showContextMenu.value = true
}

function hideContextMenu() {
  showContextMenu.value = false
}

function insertRowAbove() {
  if (selectedCellRow.value !== null) {
    const newRow = Array(headerData.value.length).fill('')
    tableData.value.splice(selectedCellRow.value, 0, newRow)
    updateTable()
  }
  hideContextMenu()
}

function insertRowBelow() {
  if (selectedCellRow.value !== null) {
    const newRow = Array(headerData.value.length).fill('')
    tableData.value.splice(selectedCellRow.value + 1, 0, newRow)
    updateTable()
  }
  hideContextMenu()
}

function insertColumnLeft() {
  if (selectedCellCol.value !== null) {
    headerData.value.splice(selectedCellCol.value, 0, `Column ${headerData.value.length + 1}`)
    
    tableData.value.forEach(row => {
      row.splice(selectedCellCol.value, 0, '')
    })
    
    updateTable()
  }
  hideContextMenu()
}

function insertColumnRight() {
  if (selectedCellCol.value !== null) {
    headerData.value.splice(selectedCellCol.value + 1, 0, `Column ${headerData.value.length + 1}`)
    
    tableData.value.forEach(row => {
      row.splice(selectedCellCol.value + 1, 0, '')
    })
    
    updateTable()
  }
  hideContextMenu()
}

function clearCell() {
  if (selectedCellRow.value !== null && selectedCellCol.value !== null) {
    tableData.value[selectedCellRow.value][selectedCellCol.value] = ''
    updateTable()
  }
  hideContextMenu()
}

function exportCSV() {
  const csvContent = [
    headerData.value.join(','),
    ...tableData.value.map(row => row.map(cell => 
      cell.includes(',') || cell.includes('"') ? `"${cell.replace(/"/g, '""')}"` : cell
    ).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.document.name || 'table'}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// Event listeners
onMounted(() => {
  document.addEventListener('click', hideContextMenu)
  document.addEventListener('contextmenu', showContextMenuAt)
})

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu)
  document.removeEventListener('contextmenu', showContextMenuAt)
})

// Watch for document changes
watch(() => props.document.content, (newContent) => {
  if (newContent && newContent !== { headers: headerData.value, data: tableData.value }) {
    if (newContent.headers) headerData.value = [...newContent.headers]
    if (newContent.data) tableData.value = newContent.data.map(row => [...row])
  }
}, { deep: true })
</script>

<style scoped>
/* Custom scrollbar for table container */
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

/* Table cell input focus styles */
td input:focus {
  background-color: #eff6ff;
  outline: 2px solid #3b82f6;
}

/* Selection styles */
.bg-blue-50 {
  background-color: #eff6ff;
}

.bg-blue-100 {
  background-color: #dbeafe;
}

.bg-blue-200 {
  background-color: #bfdbfe;
}
</style>