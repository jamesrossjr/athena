<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto p-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Template Library</h1>
        <p class="text-gray-600">
          Get started quickly with professionally designed templates for common use cases.
        </p>
      </div>

      <!-- Categories -->
      <div class="mb-8">
        <div class="flex flex-wrap gap-3">
          <UButton
            v-for="category in categories"
            :key="category"
            :variant="selectedCategory === category ? 'solid' : 'outline'"
            size="sm"
            @click="selectedCategory = category"
          >
            {{ category }}
          </UButton>
        </div>
      </div>

      <!-- Templates Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard
          v-for="template in filteredTemplates"
          :key="template.id"
          class="hover:shadow-lg transition-shadow cursor-pointer"
          @click="previewTemplate(template)"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <div class="text-2xl">{{ template.icon }}</div>
              <div class="flex-1">
                <h3 class="font-semibold">{{ template.name }}</h3>
                <p class="text-sm text-gray-500">{{ template.category }}</p>
              </div>
            </div>
          </template>
          
          <p class="text-gray-600 mb-4 text-sm">{{ template.description }}</p>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UBadge :color="getTypeColor(template.type)" variant="soft" size="sm">
                {{ template.type }}
              </UBadge>
              <span class="text-xs text-gray-500">{{ template.estimatedTime }}</span>
            </div>
            <UButton
              size="sm"
              :loading="creatingTemplates.has(template.id)"
              @click.stop="createFromTemplate(template)"
            >
              Use Template
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Empty State -->
      <div v-if="filteredTemplates.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">📋</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No templates found</h3>
        <p class="text-gray-600 mb-6">
          Try selecting a different category or check back later for new templates.
        </p>
        <UButton @click="selectedCategory = 'All'" variant="outline">
          View All Templates
        </UButton>
      </div>

      <!-- Template Preview Modal -->
      <UModal v-model="showPreviewModal" :ui="{ width: 'max-w-4xl' }">
        <UCard v-if="selectedTemplate">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="text-2xl">{{ selectedTemplate.icon }}</div>
                <div>
                  <h2 class="text-xl font-semibold">{{ selectedTemplate.name }}</h2>
                  <p class="text-gray-500">{{ selectedTemplate.category }} Template</p>
                </div>
              </div>
              <UButton
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="showPreviewModal = false"
              />
            </div>
          </template>
          
          <div class="space-y-6">
            <div>
              <h3 class="font-medium mb-2">Description</h3>
              <p class="text-gray-600">{{ selectedTemplate.description }}</p>
            </div>
            
            <div>
              <h3 class="font-medium mb-2">What's Included</h3>
              <ul class="space-y-2">
                <li
                  v-for="feature in selectedTemplate.features"
                  :key="feature"
                  class="flex items-center gap-2"
                >
                  <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                  <span class="text-sm">{{ feature }}</span>
                </li>
              </ul>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4">
              <h3 class="font-medium mb-2">Preview</h3>
              <div class="bg-white border border-gray-200 rounded p-4 min-h-32">
                <div class="text-sm text-gray-600">{{ selectedTemplate.preview }}</div>
              </div>
            </div>
          </div>
          
          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton variant="ghost" @click="showPreviewModal = false">
                Cancel
              </UButton>
              <UButton
                :loading="creatingTemplates.has(selectedTemplate.id)"
                @click="createFromTemplate(selectedTemplate)"
              >
                Use This Template
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Template {
  id: string
  name: string
  description: string
  category: string
  type: 'PAGE' | 'WHITEBOARD' | 'DATABASE'
  icon: string
  estimatedTime: string
  features: string[]
  preview: string
  content: any
}

useHead({
  title: 'Templates - Athena'
})

const selectedCategory = ref('All')
const creatingTemplates = ref(new Set<string>())
const showPreviewModal = ref(false)
const selectedTemplate = ref<Template | null>(null)

const categories = ['All', 'Project Management', 'Meeting Notes', 'Content Planning', 'Personal', 'Engineering']

const templates: Template[] = [
  {
    id: 'project-roadmap',
    name: 'Project Roadmap',
    description: 'Plan and track your project milestones with a visual timeline',
    category: 'Project Management',
    type: 'PAGE',
    icon: '🗺️',
    estimatedTime: '5 min setup',
    features: ['Milestone tracking', 'Progress indicators', 'Team assignment', 'Timeline view'],
    preview: '# Project Roadmap\n\n## Q1 2024\n- [ ] Project kickoff\n- [ ] Requirements gathering\n\n## Q2 2024\n- [ ] Development phase\n- [ ] Testing and QA',
    content: {
      title: 'Project Roadmap',
      sections: ['Goals', 'Timeline', 'Milestones', 'Resources']
    }
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structured template for capturing meeting discussions and action items',
    category: 'Meeting Notes',
    type: 'PAGE',
    icon: '📝',
    estimatedTime: '2 min setup',
    features: ['Attendee list', 'Agenda items', 'Action items', 'Next steps'],
    preview: '# Meeting Notes - [Date]\n\n## Attendees\n- John Doe\n- Jane Smith\n\n## Agenda\n1. Project updates\n2. Budget review\n\n## Action Items\n- [ ] John to review proposal\n- [ ] Jane to schedule follow-up',
    content: {
      title: 'Meeting Notes',
      template: 'meeting-notes-structured'
    }
  },
  {
    id: 'content-calendar',
    name: 'Content Calendar',
    description: 'Plan and schedule your content creation with a comprehensive calendar',
    category: 'Content Planning',
    type: 'DATABASE',
    icon: '📅',
    estimatedTime: '10 min setup',
    features: ['Content scheduling', 'Status tracking', 'Platform management', 'Analytics'],
    preview: 'Content Calendar with columns: Title, Type, Platform, Publish Date, Status, Assignee',
    content: {
      columns: [
        { name: 'Title', type: 'text' },
        { name: 'Content Type', type: 'select' },
        { name: 'Platform', type: 'select' },
        { name: 'Publish Date', type: 'date' },
        { name: 'Status', type: 'select' },
        { name: 'Assignee', type: 'text' }
      ]
    }
  },
  {
    id: 'daily-journal',
    name: 'Daily Journal',
    description: 'Reflect on your day with guided prompts and gratitude practice',
    category: 'Personal',
    type: 'PAGE',
    icon: '📔',
    estimatedTime: '3 min setup',
    features: ['Daily prompts', 'Mood tracking', 'Gratitude section', 'Goal reflection'],
    preview: '# Daily Journal - [Date]\n\n## How am I feeling today?\n\n## What am I grateful for?\n1. \n2. \n3. \n\n## Today\'s priorities\n- [ ] \n- [ ] \n- [ ] \n\n## Reflection\n',
    content: {
      title: 'Daily Journal',
      template: 'daily-journal-guided'
    }
  },
  {
    id: 'sprint-planning',
    name: 'Sprint Planning',
    description: 'Agile sprint planning template with story estimation and capacity planning',
    category: 'Engineering',
    type: 'DATABASE',
    icon: '⚡',
    estimatedTime: '15 min setup',
    features: ['Story points', 'Sprint capacity', 'Task breakdown', 'Progress tracking'],
    preview: 'Sprint Planning board with user stories, estimates, and assignments',
    content: {
      columns: [
        { name: 'User Story', type: 'text' },
        { name: 'Story Points', type: 'number' },
        { name: 'Assignee', type: 'text' },
        { name: 'Status', type: 'select' },
        { name: 'Epic', type: 'text' }
      ]
    }
  },
  {
    id: 'brainstorm-board',
    name: 'Brainstorm Board',
    description: 'Visual brainstorming space with sticky notes and idea clustering',
    category: 'Project Management',
    type: 'WHITEBOARD',
    icon: '💡',
    estimatedTime: '5 min setup',
    features: ['Sticky notes', 'Idea clustering', 'Voting system', 'Action items'],
    preview: 'Whiteboard with sections for Ideas, Themes, and Next Steps',
    content: {
      elements: [
        { type: 'text', content: 'Ideas', x: 50, y: 50 },
        { type: 'text', content: 'Themes', x: 250, y: 50 },
        { type: 'text', content: 'Next Steps', x: 450, y: 50 }
      ]
    }
  },
  {
    id: 'personal-crm',
    name: 'Personal CRM',
    description: 'Track relationships, networking contacts, and follow-up tasks',
    category: 'Personal',
    type: 'DATABASE',
    icon: '👥',
    estimatedTime: '12 min setup',
    features: ['Contact management', 'Interaction history', 'Follow-up reminders', 'Relationship strength'],
    preview: 'Contact database with relationship tracking and interaction logs',
    content: {
      columns: [
        { name: 'Name', type: 'text' },
        { name: 'Company', type: 'text' },
        { name: 'Role', type: 'text' },
        { name: 'Last Contact', type: 'date' },
        { name: 'Relationship', type: 'select' },
        { name: 'Notes', type: 'text' }
      ]
    }
  },
  {
    id: 'okr-tracker',
    name: 'OKR Tracker',
    description: 'Track Objectives and Key Results with progress monitoring',
    category: 'Project Management',
    type: 'DATABASE',
    icon: '🎯',
    estimatedTime: '8 min setup',
    features: ['Objective hierarchy', 'Progress tracking', 'Quarterly planning', 'Performance metrics'],
    preview: 'OKR tracking system with objectives, key results, and progress indicators',
    content: {
      columns: [
        { name: 'Objective', type: 'text' },
        { name: 'Key Result', type: 'text' },
        { name: 'Progress', type: 'number' },
        { name: 'Owner', type: 'text' },
        { name: 'Quarter', type: 'select' }
      ]
    }
  }
]

const filteredTemplates = computed(() => {
  if (selectedCategory.value === 'All') {
    return templates
  }
  return templates.filter(template => template.category === selectedCategory.value)
})

function getTypeColor(type: string) {
  switch (type) {
    case 'PAGE': return 'blue'
    case 'WHITEBOARD': return 'green'
    case 'DATABASE': return 'purple'
    default: return 'gray'
  }
}

function previewTemplate(template: Template) {
  selectedTemplate.value = template
  showPreviewModal.value = true
}

async function createFromTemplate(template: Template) {
  creatingTemplates.value.add(template.id)
  
  try {
    // Create document from template
    const response = await $fetch('/api/documents/create', {
      method: 'POST',
      body: {
        title: template.name,
        type: template.type,
        content: template.content,
        workspaceId: 'demo-workspace-id' // In production, this would be the current workspace
      }
    })
    
    const toast = useToast()
    toast.add({
      title: 'Template Created',
      description: `${template.name} has been created successfully!`,
      color: 'green'
    })
    
    // Navigate to the new document
    await navigateTo(`/document/${response.id}`)
    showPreviewModal.value = false
  } catch (error) {
    console.error('Template creation failed:', error)
    const toast = useToast()
    toast.add({
      title: 'Creation Failed',
      description: 'Failed to create document from template. Please try again.',
      color: 'red'
    })
  } finally {
    creatingTemplates.value.delete(template.id)
  }
}
</script>