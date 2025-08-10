<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Briefings</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          AI-generated insights and summaries from your knowledge
        </p>
      </div>
      
      <UButton icon="i-heroicons-plus" @click="generateBriefing">
        Generate Briefing
      </UButton>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UCard
        v-for="briefing in briefings"
        :key="briefing.id"
        class="briefing-card"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ briefing.title }}</h3>
            <UBadge :color="briefing.type === 'daily' ? 'blue' : 'green'" size="xs">
              {{ briefing.type }}
            </UBadge>
          </div>
        </template>
        
        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">{{ briefing.summary }}</p>
          
          <div class="space-y-2">
            <h4 class="font-medium">Key Points:</h4>
            <ul class="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li v-for="point in briefing.keyPoints" :key="point">{{ point }}</li>
            </ul>
          </div>
          
          <div class="flex items-center justify-between text-sm text-gray-500">
            <span>Generated: {{ briefing.generated }}</span>
            <span>{{ briefing.sources }} sources</span>
          </div>
        </div>
        
        <template #footer>
          <div class="flex space-x-2">
            <UButton variant="outline" size="xs" icon="i-heroicons-eye">
              View Full
            </UButton>
            <UButton variant="outline" size="xs" icon="i-heroicons-share">
              Export
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const briefings = [
  {
    id: 1,
    title: 'Daily Knowledge Summary',
    type: 'daily',
    summary: 'Overview of recent notes, tasks, and insights from the past 24 hours.',
    keyPoints: [
      'Completed RAG pipeline implementation research',
      '3 new notes added to AI/ML knowledge base',
      'Updated project timeline for Athena system'
    ],
    generated: '2 hours ago',
    sources: 8
  },
  {
    id: 2,
    title: 'Weekly Project Review',
    type: 'weekly',
    summary: 'Summary of project progress and upcoming milestones.',
    keyPoints: [
      'Athena Phase 1 MVP 75% complete',
      '5 tasks completed, 3 in progress',
      'New requirements identified for collaboration features'
    ],
    generated: '1 day ago',
    sources: 15
  }
]

const generateBriefing = () => {
  // TODO: Implement briefing generation
  console.log('Generating briefing')
}
</script>