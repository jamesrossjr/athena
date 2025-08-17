<template>
  <div class="kanban-column flex-shrink-0 w-80">
    <!-- Column Header -->
    <div 
      class="flex items-center justify-between p-3 rounded-t-lg border-b-2"
      :style="{ backgroundColor: column.color + '20', borderBottomColor: column.color }"
    >
      <div class="flex items-center gap-2">
        <div 
          class="w-3 h-3 rounded-full"
          :style="{ backgroundColor: column.color }"
        />
        <h3 class="font-medium text-gray-900">{{ column.name }}</h3>
        <UBadge 
          :label="tasks.length.toString()" 
          :color="tasks.length > (column.taskLimit || 999) ? 'red' : 'gray'"
          variant="subtle"
        />
      </div>
      
      <UDropdown :items="columnActions">
        <UButton variant="ghost" icon="i-heroicons-ellipsis-horizontal" size="xs" />
      </UDropdown>
    </div>

    <!-- Tasks Container -->
    <div 
      ref="tasksContainer"
      class="min-h-[400px] max-h-[600px] overflow-y-auto p-2 bg-gray-50 rounded-b-lg"
      @dragover="handleDragOver"
      @drop="handleDrop"
    >
      <!-- Tasks -->
      <div class="space-y-2">
        <KanbanTask
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          @drag-start="handleTaskDragStart"
          @task-updated="$emit('taskUpdated', task.id, $event)"
          @task-deleted="$emit('taskDeleted', task.id)"
        />
      </div>
      
      <!-- Add Task Button -->
      <div class="mt-2">
        <UButton
          v-if="!showNewTaskForm"
          variant="ghost"
          block
          size="sm"
          class="justify-start text-gray-600 hover:text-gray-900"
          @click="showNewTaskForm = true"
        >
          <template #leading>
            <UIcon name="i-heroicons-plus" />
          </template>
          Add a task
        </UButton>
        
        <!-- Quick Add Task Form -->
        <div v-else class="space-y-2">
          <UTextarea
            v-model="newTaskTitle"
            placeholder="Enter task title..."
            :rows="2"
            size="sm"
            @keydown.enter.prevent="createTask"
            @keydown.escape="cancelNewTask"
          />
          <div class="flex gap-2">
            <UButton size="xs" @click="createTask">Add</UButton>
            <UButton size="xs" variant="ghost" @click="cancelNewTask">Cancel</UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Task {
  id: string
  title: string
  description?: string
  columnId: string
  assigneeId?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  labels: string[]
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

interface Column {
  id: string
  name: string
  color: string
  position: number
  taskLimit?: number
}

const props = defineProps<{
  column: Column
  tasks: Task[]
}>()

const emit = defineEmits<{
  taskMoved: [taskId: string, newColumnId: string]
  taskCreated: [columnId: string, taskData: any]
  taskUpdated: [taskId: string, updates: any]
  taskDeleted: [taskId: string]
}>()

// Reactive state
const showNewTaskForm = ref(false)
const newTaskTitle = ref('')
const tasksContainer = ref<HTMLElement>()
const draggedTaskId = ref<string | null>(null)

// Column actions dropdown
const columnActions = [
  [{
    label: 'Set task limit',
    icon: 'i-heroicons-funnel',
    click: () => setTaskLimit()
  }],
  [{
    label: 'Clear all tasks',
    icon: 'i-heroicons-trash',
    click: () => clearAllTasks()
  }],
  [{
    label: 'Archive column',
    icon: 'i-heroicons-archive-box',
    click: () => archiveColumn()
  }]
]

// Methods
const createTask = () => {
  if (!newTaskTitle.value.trim()) return
  
  const taskData = {
    title: newTaskTitle.value.trim(),
    priority: 'medium' as const,
    labels: [],
    assigneeId: undefined
  }
  
  emit('taskCreated', props.column.id, taskData)
  
  // Reset form
  newTaskTitle.value = ''
  showNewTaskForm.value = false
}

const cancelNewTask = () => {
  newTaskTitle.value = ''
  showNewTaskForm.value = false
}

const handleTaskDragStart = (taskId: string) => {
  draggedTaskId.value = taskId
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  
  if (draggedTaskId.value) {
    emit('taskMoved', draggedTaskId.value, props.column.id)
    draggedTaskId.value = null
  }
}

const setTaskLimit = () => {
  const limit = prompt('Set task limit for this column (leave empty for no limit):')
  if (limit !== null) {
    const numLimit = parseInt(limit) || undefined
    // Emit column update event
    console.log('Setting task limit:', numLimit)
  }
}

const clearAllTasks = () => {
  if (confirm('Are you sure you want to clear all tasks from this column?')) {
    props.tasks.forEach(task => {
      emit('taskDeleted', task.id)
    })
  }
}

const archiveColumn = () => {
  if (confirm('Are you sure you want to archive this column?')) {
    console.log('Archiving column:', props.column.id)
  }
}

// Auto-focus on new task input
watch(showNewTaskForm, (show) => {
  if (show) {
    nextTick(() => {
      const textarea = document.querySelector('textarea')
      textarea?.focus()
    })
  }
})
</script>

<style scoped>
.kanban-column {
  transition: all 0.2s ease;
}

.kanban-column:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>