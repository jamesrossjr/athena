<template>
  <div class="kanban-page">
    <div class="kanban-header">
      <input 
        v-model="localTitle" 
        @blur="updateTitle"
        class="kanban-title"
        placeholder="Untitled Kanban"
      />
      <div class="kanban-meta">
        <span class="page-type">📋 Kanban</span>
        <span class="task-count">{{ tasks.length }} tasks</span>
      </div>
    </div>

    <div class="kanban-board">
      <div 
        v-for="column in columns" 
        :key="column.id"
        class="kanban-column"
      >
        <div class="column-header">
          <input 
            v-model="column.content.name"
            @blur="updateColumn(column)"
            class="column-title"
          />
          <span class="task-count">{{ getColumnTasks(column.id).length }}</span>
        </div>
        
        <div class="column-content">
          <div 
            v-for="task in getColumnTasks(column.id)" 
            :key="task.id"
            class="task-card"
            draggable="true"
            @dragstart="handleDragStart(task, $event)"
            @dragover.prevent
            @drop="handleDrop(column.id, $event)"
          >
            <textarea
              v-model="task.content.title"
              @blur="updateTask(task)"
              class="task-title"
              placeholder="Task title..."
              rows="2"
            ></textarea>
            
            <div v-if="task.content.description" class="task-description">
              <textarea
                v-model="task.content.description"
                @blur="updateTask(task)"
                class="task-desc-input"
                placeholder="Description..."
                rows="2"
              ></textarea>
            </div>
            
            <div class="task-meta">
              <select 
                v-model="task.content.priority"
                @change="updateTask(task)"
                class="priority-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              
              <button @click="deleteTask(task.id)" class="delete-task">
                <Icon name="i-heroicons-trash" class="delete-icon" />
              </button>
            </div>
          </div>
          
          <button @click="addTask(column.id)" class="add-task-button">
            <Icon name="i-heroicons-plus" class="plus-icon" />
            Add task
          </button>
        </div>
      </div>
      
      <div class="add-column">
        <button @click="addColumn" class="add-column-button">
          <Icon name="i-heroicons-plus" class="plus-icon" />
          Add column
        </button>
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
const draggedTask = ref<Block | null>(null)

const columns = computed(() => 
  blocks.value.filter(block => block.type === 'DATABASE_COLUMN')
    .sort((a, b) => a.position - b.position)
)

const tasks = computed(() => 
  blocks.value.filter(block => block.type === 'DATABASE_ROW')
    .sort((a, b) => a.position - b.position)
)

const getColumnTasks = (columnId: string) => {
  return tasks.value.filter(task => task.content.columnId === columnId)
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
        content: {
          name: 'New Column',
          type: 'kanban'
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

const addTask = async (columnId: string) => {
  try {
    const response = await $fetch('/api/blocks', {
      method: 'POST',
      body: {
        pageId: props.page.id,
        type: 'DATABASE_ROW',
        content: {
          columnId,
          title: '',
          description: '',
          priority: 'medium',
          status: 'todo'
        },
        position: getColumnTasks(columnId).length
      }
    })
    
    if (response.success) {
      blocks.value.push(response.data)
    }
  } catch (error) {
    console.error('Failed to add task:', error)
  }
}

const updateTask = async (task: Block) => {
  try {
    await $fetch(`/api/blocks/${task.id}`, {
      method: 'PUT',
      body: { content: task.content }
    })
  } catch (error) {
    console.error('Failed to update task:', error)
  }
}

const deleteTask = async (taskId: string) => {
  try {
    await $fetch(`/api/blocks/${taskId}`, { method: 'DELETE' })
    blocks.value = blocks.value.filter(block => block.id !== taskId)
  } catch (error) {
    console.error('Failed to delete task:', error)
  }
}

const handleDragStart = (task: Block, event: DragEvent) => {
  draggedTask.value = task
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

const handleDrop = async (columnId: string, event: DragEvent) => {
  event.preventDefault()
  
  if (draggedTask.value && draggedTask.value.content.columnId !== columnId) {
    try {
      const updatedContent = { ...draggedTask.value.content, columnId }
      
      await $fetch(`/api/blocks/${draggedTask.value.id}`, {
        method: 'PUT',
        body: { content: updatedContent }
      })
      
      // Update local state
      const index = blocks.value.findIndex(b => b.id === draggedTask.value!.id)
      if (index > -1) {
        blocks.value[index].content = updatedContent
      }
    } catch (error) {
      console.error('Failed to move task:', error)
    }
  }
  
  draggedTask.value = null
}

watch(() => props.page.blocks, (newBlocks) => {
  if (newBlocks) blocks.value = [...newBlocks]
}, { immediate: true })

onMounted(() => {
  if (columns.value.length === 0) {
    // Create default columns
    const defaultColumns = ['To Do', 'In Progress', 'Done']
    defaultColumns.forEach((name, index) => {
      $fetch('/api/blocks', {
        method: 'POST',
        body: {
          pageId: props.page.id,
          type: 'DATABASE_COLUMN',
          content: { name, type: 'kanban' },
          position: index
        }
      }).then(response => {
        if (response.success) blocks.value.push(response.data)
      })
    })
  }
})
</script>

<style scoped>
.kanban-page { height: 100%; display: flex; flex-direction: column; background: var(--theme-bg-primary); }
.kanban-header { padding: 2rem 2rem 1rem; }
.kanban-title { font-size: 2rem; font-weight: 700; background: transparent; border: none; outline: none; margin-bottom: 0.5rem; width: 100%; }
.kanban-meta { display: flex; gap: 1rem; font-size: 0.875rem; color: var(--theme-text-secondary); }
.kanban-board { flex: 1; display: flex; gap: 1rem; padding: 0 2rem 2rem; overflow-x: auto; }
.kanban-column { min-width: 280px; background: var(--theme-surface); border-radius: 0.75rem; border: 1px solid var(--theme-border); }
.column-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--theme-border); }
.column-title { background: transparent; border: none; outline: none; font-weight: 600; }
.task-count { font-size: 0.875rem; color: var(--theme-text-secondary); background: var(--theme-hover); padding: 0.25rem 0.5rem; border-radius: 0.375rem; }
.column-content { padding: 1rem; }
.task-card { background: var(--theme-bg-primary); border: 1px solid var(--theme-border); border-radius: 0.5rem; padding: 0.75rem; margin-bottom: 0.75rem; cursor: move; }
.task-title { width: 100%; background: transparent; border: none; outline: none; resize: none; font-weight: 500; }
.task-description { margin-top: 0.5rem; }
.task-desc-input { width: 100%; background: transparent; border: none; outline: none; resize: none; font-size: 0.875rem; color: var(--theme-text-secondary); }
.task-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; }
.priority-select { padding: 0.25rem 0.5rem; border: 1px solid var(--theme-border); border-radius: 0.25rem; background: var(--theme-surface); font-size: 0.75rem; }
.delete-task { background: none; border: none; cursor: pointer; color: var(--theme-text-secondary); padding: 0.25rem; border-radius: 0.25rem; }
.delete-task:hover { background: #fee2e2; color: #dc2626; }
.delete-icon { width: 1rem; height: 1rem; }
.add-task-button { width: 100%; padding: 0.75rem; background: transparent; border: 1px dashed var(--theme-border); border-radius: 0.5rem; color: var(--theme-text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.add-task-button:hover { background: var(--theme-hover); }
.add-column { min-width: 280px; display: flex; align-items: center; justify-content: center; }
.add-column-button { padding: 2rem; background: transparent; border: 2px dashed var(--theme-border); border-radius: 0.75rem; color: var(--theme-text-secondary); cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
.plus-icon { width: 1rem; height: 1rem; }
</style>