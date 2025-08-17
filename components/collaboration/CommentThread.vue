<template>
  <div class="comment-thread">
    <!-- Main Comment -->
    <div 
      class="comment bg-white rounded-lg border border-gray-200 p-4 mb-3"
      :class="{ 'border-l-4 border-l-red-400': comment.priority === 'high' }"
      :data-comment-id="comment.id"
    >
      <!-- Comment Header -->
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center gap-3">
          <UAvatar 
            :src="comment.author.avatar" 
            :alt="comment.author.name" 
            size="sm"
            :ui="getStatusIndicator(comment.author.status)"
          />
          <div>
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900">{{ comment.author.name }}</span>
              <div 
                class="w-2 h-2 rounded-full"
                :class="getPriorityColor(comment.priority)"
                :title="`${comment.priority} priority`"
              />
            </div>
            <div class="text-xs text-gray-500">
              {{ formatDate(comment.createdAt) }}
              <span v-if="comment.updatedAt > comment.createdAt"> • edited</span>
            </div>
          </div>
        </div>

        <!-- Comment Actions -->
        <UDropdown :items="commentActions" :popper="{ placement: 'bottom-end' }">
          <UButton variant="ghost" icon="i-heroicons-ellipsis-horizontal" size="xs" />
        </UDropdown>
      </div>

      <!-- Comment Context -->
      <div 
        v-if="comment.contextId" 
        class="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200"
      >
        <div class="flex items-center gap-2 text-blue-800 text-xs">
          <UIcon name="i-heroicons-map-pin" class="w-3 h-3" />
          <span>{{ getContextLabel(comment.contextType) }}</span>
        </div>
      </div>

      <!-- Comment Content -->
      <div class="mb-3">
        <div 
          v-if="!isEditing"
          class="prose prose-sm max-w-none"
          v-html="renderContent(comment.content)"
        />
        <UTextarea
          v-else
          v-model="editContent"
          :rows="3"
          @keydown.ctrl.enter="saveEdit"
          @keydown.escape="cancelEdit"
        />
      </div>

      <!-- Attachments -->
      <div v-if="comment.attachments.length > 0" class="mb-3">
        <div class="flex flex-wrap gap-2">
          <div
            v-for="attachment in comment.attachments"
            :key="attachment.id"
            class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border"
          >
            <UIcon 
              :name="getFileIcon(attachment.type)" 
              class="w-4 h-4 text-gray-500" 
            />
            <span class="text-sm text-gray-700">{{ attachment.name }}</span>
            <UButton
              variant="ghost"
              icon="i-heroicons-arrow-down-tray"
              size="xs"
              @click="downloadAttachment(attachment)"
            />
          </div>
        </div>
      </div>

      <!-- Comment Footer -->
      <div class="flex items-center justify-between">
        <!-- Reactions -->
        <div class="flex items-center gap-2">
          <div
            v-for="reactionGroup in groupedReactions"
            :key="reactionGroup.emoji"
            class="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
            :class="{ 'bg-blue-100 text-blue-800': reactionGroup.userReacted }"
            @click="toggleReaction(reactionGroup.emoji)"
          >
            <span class="text-sm">{{ reactionGroup.emoji }}</span>
            <span class="text-xs font-medium">{{ reactionGroup.count }}</span>
          </div>

          <!-- Add Reaction Button -->
          <UDropdown :items="reactionOptions">
            <UButton
              variant="ghost"
              icon="i-heroicons-face-smile"
              size="xs"
              class="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </UDropdown>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2">
          <UButton
            v-if="isEditing"
            variant="ghost"
            size="xs"
            @click="cancelEdit"
          >
            Cancel
          </UButton>
          <UButton
            v-if="isEditing"
            size="xs"
            @click="saveEdit"
          >
            Save
          </UButton>
          <UButton
            v-else
            variant="ghost"
            size="xs"
            @click="showReplyForm = !showReplyForm"
          >
            <template #leading>
              <UIcon name="i-heroicons-chat-bubble-left" />
            </template>
            Reply
          </UButton>
          <UButton
            v-if="!comment.isResolved"
            variant="ghost"
            size="xs"
            color="green"
            @click="$emit('resolve', comment.id)"
          >
            <template #leading>
              <UIcon name="i-heroicons-check" />
            </template>
            Resolve
          </UButton>
        </div>
      </div>
    </div>

    <!-- Reply Form -->
    <div 
      v-if="showReplyForm" 
      class="ml-6 mb-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
    >
      <div class="flex gap-3">
        <UAvatar 
          :src="currentUser.avatar" 
          :alt="currentUser.name" 
          size="sm" 
        />
        <div class="flex-1">
          <UTextarea
            v-model="replyContent"
            placeholder="Write a reply..."
            :rows="2"
            @keydown.ctrl.enter="submitReply"
          />
          <div class="flex justify-end gap-2 mt-2">
            <UButton 
              variant="ghost" 
              size="xs" 
              @click="showReplyForm = false"
            >
              Cancel
            </UButton>
            <UButton 
              size="xs" 
              :disabled="!replyContent.trim()"
              @click="submitReply"
            >
              Reply
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Replies -->
    <div v-if="replies.length > 0" class="ml-6 space-y-3">
      <div
        v-for="reply in replies"
        :key="reply.id"
        class="comment bg-white rounded-lg border border-gray-100 p-3"
      >
        <!-- Reply Header -->
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center gap-2">
            <UAvatar 
              :src="reply.author.avatar" 
              :alt="reply.author.name" 
              size="xs"
              :ui="getStatusIndicator(reply.author.status)"
            />
            <div>
              <span class="font-medium text-gray-900 text-sm">{{ reply.author.name }}</span>
              <div class="text-xs text-gray-500">
                {{ formatDate(reply.createdAt) }}
              </div>
            </div>
          </div>

          <UDropdown :items="getReplyActions(reply)" :popper="{ placement: 'bottom-end' }">
            <UButton variant="ghost" icon="i-heroicons-ellipsis-horizontal" size="xs" />
          </UDropdown>
        </div>

        <!-- Reply Content -->
        <div class="mb-2">
          <div 
            class="prose prose-sm max-w-none text-sm"
            v-html="renderContent(reply.content)"
          />
        </div>

        <!-- Reply Reactions -->
        <div v-if="reply.reactions.length > 0" class="flex items-center gap-1">
          <div
            v-for="reactionGroup in getGroupedReactions(reply)"
            :key="reactionGroup.emoji"
            class="flex items-center gap-1 px-1 py-0.5 bg-gray-100 rounded-full text-xs cursor-pointer hover:bg-gray-200"
            :class="{ 'bg-blue-100 text-blue-800': reactionGroup.userReacted }"
            @click="toggleReplyReaction(reply.id, reactionGroup.emoji)"
          >
            <span>{{ reactionGroup.emoji }}</span>
            <span class="font-medium">{{ reactionGroup.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Resolved State -->
    <div 
      v-if="comment.isResolved" 
      class="ml-6 p-3 bg-green-50 rounded-lg border border-green-200"
    >
      <div class="flex items-center gap-2 text-green-800">
        <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
        <span class="text-sm font-medium">Comment resolved</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Comment {
  id: string
  content: string
  authorId: string
  author: User
  contextId?: string
  contextType?: 'text' | 'element' | 'line'
  priority: 'low' | 'medium' | 'high'
  isResolved: boolean
  parentId?: string
  mentions: string[]
  reactions: Reaction[]
  attachments: Attachment[]
  createdAt: Date
  updatedAt: Date
}

interface User {
  id: string
  name: string
  email: string
  avatar: string
  status: 'online' | 'offline' | 'away'
}

interface Reaction {
  id: string
  emoji: string
  userId: string
  user: User
}

interface Attachment {
  id: string
  name: string
  url: string
  type: string
  size: number
}

const props = defineProps<{
  comment: Comment
  replies: Comment[]
  currentUser: User
}>()

const emit = defineEmits<{
  reply: [parentId: string, content: string]
  edit: [comment: Comment]
  delete: [commentId: string]
  resolve: [commentId: string]
  react: [commentId: string, emoji: string]
  mention: [userId: string]
}>()

// Reactive state
const showReplyForm = ref(false)
const replyContent = ref('')
const isEditing = ref(false)
const editContent = ref('')

// Comment actions
const commentActions = computed(() => [
  [{
    label: 'Edit',
    icon: 'i-heroicons-pencil',
    click: () => startEdit()
  }],
  [{
    label: 'Copy link',
    icon: 'i-heroicons-link',
    click: () => copyCommentLink()
  }],
  [{
    label: 'Delete',
    icon: 'i-heroicons-trash',
    click: () => deleteComment()
  }]
])

const reactionOptions = [
  [
    { label: '👍', click: () => emit('react', props.comment.id, '👍') },
    { label: '👎', click: () => emit('react', props.comment.id, '👎') },
    { label: '❤️', click: () => emit('react', props.comment.id, '❤️') },
    { label: '😂', click: () => emit('react', props.comment.id, '😂') }
  ]
]

// Computed properties
const groupedReactions = computed(() => {
  const groups = new Map()
  
  props.comment.reactions.forEach(reaction => {
    if (!groups.has(reaction.emoji)) {
      groups.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: 0,
        users: [],
        userReacted: false
      })
    }
    
    const group = groups.get(reaction.emoji)
    group.count++
    group.users.push(reaction.user)
    
    if (reaction.userId === props.currentUser.id) {
      group.userReacted = true
    }
  })
  
  return Array.from(groups.values())
})

// Methods
const formatDate = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const renderContent = (content: string) => {
  // Process mentions
  return content.replace(/@(\w+)/g, '<span class="text-blue-600 font-medium">@$1</span>')
}

const getPriorityColor = (priority: string) => {
  const colors = {
    low: 'bg-gray-400',
    medium: 'bg-blue-400',
    high: 'bg-red-400'
  }
  return colors[priority] || 'bg-gray-400'
}

const getStatusIndicator = (status: string) => {
  const indicators = {
    online: { wrapper: 'relative', ring: 'ring-2 ring-green-400' },
    away: { wrapper: 'relative', ring: 'ring-2 ring-yellow-400' },
    offline: { wrapper: 'relative', ring: 'ring-2 ring-gray-400' }
  }
  return indicators[status] || indicators.offline
}

const getContextLabel = (contextType?: string) => {
  const labels = {
    text: 'Text selection',
    element: 'Page element',
    line: 'Line comment'
  }
  return labels[contextType] || 'General comment'
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return 'i-heroicons-photo'
  if (type.includes('pdf')) return 'i-heroicons-document-text'
  if (type.includes('video/')) return 'i-heroicons-video-camera'
  return 'i-heroicons-document'
}

const toggleReaction = (emoji: string) => {
  emit('react', props.comment.id, emoji)
}

const submitReply = () => {
  if (replyContent.value.trim()) {
    emit('reply', props.comment.id, replyContent.value.trim())
    replyContent.value = ''
    showReplyForm.value = false
  }
}

const startEdit = () => {
  isEditing.value = true
  editContent.value = props.comment.content
}

const saveEdit = () => {
  if (editContent.value.trim()) {
    emit('edit', {
      ...props.comment,
      content: editContent.value.trim(),
      updatedAt: new Date()
    })
    isEditing.value = false
  }
}

const cancelEdit = () => {
  isEditing.value = false
  editContent.value = ''
}

const deleteComment = () => {
  if (confirm('Are you sure you want to delete this comment?')) {
    emit('delete', props.comment.id)
  }
}

const copyCommentLink = () => {
  const link = `${window.location.href}#comment-${props.comment.id}`
  navigator.clipboard.writeText(link)
  
  // Show toast notification
  const toast = useToast()
  toast.add({
    title: 'Link copied',
    description: 'Comment link copied to clipboard'
  })
}

const downloadAttachment = (attachment: Attachment) => {
  // Create download link
  const link = document.createElement('a')
  link.href = attachment.url
  link.download = attachment.name
  link.click()
}

const getReplyActions = (reply: Comment) => [
  [{
    label: 'Edit',
    icon: 'i-heroicons-pencil',
    click: () => emit('edit', reply)
  }],
  [{
    label: 'Delete',
    icon: 'i-heroicons-trash',
    click: () => emit('delete', reply.id)
  }]
]

const getGroupedReactions = (reply: Comment) => {
  const groups = new Map()
  
  reply.reactions.forEach(reaction => {
    if (!groups.has(reaction.emoji)) {
      groups.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: 0,
        userReacted: false
      })
    }
    
    const group = groups.get(reaction.emoji)
    group.count++
    
    if (reaction.userId === props.currentUser.id) {
      group.userReacted = true
    }
  })
  
  return Array.from(groups.values())
}

const toggleReplyReaction = (replyId: string, emoji: string) => {
  emit('react', replyId, emoji)
}
</script>

<style scoped>
.comment {
  transition: all 0.2s ease;
}

.comment:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}
</style>