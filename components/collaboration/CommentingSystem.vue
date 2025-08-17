<template>
  <div class="commenting-system">
    <!-- Comments Sidebar Toggle -->
    <UButton
      v-if="!isOpen"
      class="fixed right-4 top-1/2 -translate-y-1/2 z-40"
      icon="i-heroicons-chat-bubble-left-right"
      variant="solid"
      color="primary"
      @click="toggleSidebar"
    >
      <UBadge
        v-if="unreadCount > 0"
        :label="unreadCount.toString()"
        color="red"
        class="absolute -top-2 -right-2"
      />
    </UButton>

    <!-- Comments Sidebar -->
    <USlideover v-model="isOpen" side="right" :ui="{ width: 'w-96' }">
      <div class="h-full flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div class="flex items-center gap-3">
            <UIcon name="i-heroicons-chat-bubble-left-right" class="w-5 h-5 text-gray-600" />
            <h3 class="font-semibold text-gray-900">Comments</h3>
            <UBadge 
              :label="comments.length.toString()" 
              variant="subtle" 
            />
          </div>
          
          <div class="flex items-center gap-2">
            <!-- Filter Dropdown -->
            <UDropdown :items="filterOptions">
              <UButton 
                variant="ghost" 
                icon="i-heroicons-funnel"
                :color="hasActiveFilter ? 'primary' : 'gray'"
              />
            </UDropdown>
            
            <!-- Close Button -->
            <UButton 
              variant="ghost" 
              icon="i-heroicons-x-mark" 
              @click="isOpen = false"
            />
          </div>
        </div>

        <!-- Comments List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <!-- No Comments State -->
          <div v-if="filteredComments.length === 0" class="text-center py-8">
            <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p class="text-gray-500 text-sm">No comments yet</p>
            <p class="text-gray-400 text-xs">Start a conversation</p>
          </div>

          <!-- Comment Threads -->
          <div
            v-for="comment in filteredComments"
            :key="comment.id"
            class="comment-thread"
          >
            <CommentThread
              :comment="comment"
              :replies="getReplies(comment.id)"
              :current-user="currentUser"
              @reply="addReply"
              @edit="editComment"
              @delete="deleteComment"
              @resolve="resolveComment"
              @react="addReaction"
              @mention="handleMention"
            />
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="flex justify-center py-4">
            <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
          </div>
        </div>

        <!-- New Comment Form -->
        <div class="border-t border-gray-200 p-4 bg-white">
          <div class="space-y-3">
            <!-- Context Selection -->
            <div v-if="showContextSelector" class="flex items-center gap-2 text-sm text-gray-600">
              <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
              <span>Commenting on: {{ selectedContext.label }}</span>
              <UButton 
                variant="ghost" 
                icon="i-heroicons-x-mark" 
                size="xs"
                @click="clearContext"
              />
            </div>

            <!-- Comment Input -->
            <div class="relative">
              <UTextarea
                v-model="newComment"
                placeholder="Add a comment..."
                :rows="3"
                @keydown="handleKeydown"
                @input="handleInput"
              />
              
              <!-- Mention Suggestions -->
              <div
                v-if="showMentions"
                class="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto"
              >
                <div
                  v-for="(user, index) in mentionSuggestions"
                  :key="user.id"
                  class="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
                  :class="{ 'bg-blue-50': index === selectedMentionIndex }"
                  @click="selectMention(user)"
                >
                  <UAvatar :src="user.avatar" :alt="user.name" size="xs" />
                  <div>
                    <div class="font-medium text-sm">{{ user.name }}</div>
                    <div class="text-xs text-gray-500">{{ user.email }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Comment Actions -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <!-- Priority Selection -->
                <USelectMenu
                  v-model="commentPriority"
                  :options="priorityOptions"
                  size="xs"
                >
                  <template #leading>
                    <div 
                      class="w-2 h-2 rounded-full"
                      :class="getPriorityColor(commentPriority)"
                    />
                  </template>
                </USelectMenu>

                <!-- Attachment Button -->
                <UButton
                  variant="ghost"
                  icon="i-heroicons-paper-clip"
                  size="xs"
                  @click="$refs.fileInput.click()"
                />
                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  class="hidden"
                  @change="handleFileUpload"
                />

                <!-- Emoji Button -->
                <UButton
                  variant="ghost"
                  icon="i-heroicons-face-smile"
                  size="xs"
                  @click="showEmojiPicker = !showEmojiPicker"
                />
              </div>

              <!-- Submit Button -->
              <div class="flex items-center gap-2">
                <UButton
                  v-if="editingComment"
                  variant="ghost"
                  size="xs"
                  @click="cancelEdit"
                >
                  Cancel
                </UButton>
                <UButton
                  :disabled="!newComment.trim()"
                  size="xs"
                  @click="submitComment"
                >
                  {{ editingComment ? 'Update' : 'Comment' }}
                </UButton>
              </div>
            </div>

            <!-- Attachments Preview -->
            <div v-if="attachments.length > 0" class="space-y-2">
              <div
                v-for="(file, index) in attachments"
                :key="index"
                class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
              >
                <UIcon name="i-heroicons-document" class="w-4 h-4 text-gray-500" />
                <span class="text-sm text-gray-700 flex-1">{{ file.name }}</span>
                <UButton
                  variant="ghost"
                  icon="i-heroicons-x-mark"
                  size="xs"
                  @click="removeAttachment(index)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </USlideover>

    <!-- Comment Highlights in Document -->
    <div
      v-for="highlight in commentHighlights"
      :key="highlight.id"
      class="comment-highlight absolute border-2 border-yellow-300 bg-yellow-100 bg-opacity-50 rounded cursor-pointer"
      :style="highlight.style"
      @click="openComment(highlight.commentId)"
    >
      <div class="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
        {{ highlight.commentCount }}
      </div>
    </div>

    <!-- Emoji Picker -->
    <div
      v-if="showEmojiPicker"
      class="fixed bottom-20 right-8 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50"
    >
      <div class="grid grid-cols-8 gap-2">
        <button
          v-for="emoji in commonEmojis"
          :key="emoji"
          class="text-lg hover:bg-gray-100 rounded p-1"
          @click="insertEmoji(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </div>

    <!-- Mention Notifications -->
    <div
      v-if="mentionNotifications.length > 0"
      class="fixed top-4 right-4 space-y-2 z-50"
    >
      <UNotification
        v-for="notification in mentionNotifications"
        :key="notification.id"
        :title="notification.title"
        :description="notification.description"
        :timeout="5000"
        @close="dismissNotification(notification.id)"
      />
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
  contextData?: any
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

interface CommentHighlight {
  id: string
  commentId: string
  commentCount: number
  style: {
    top: string
    left: string
    width: string
    height: string
  }
}

const props = defineProps<{
  documentId: string
  documentType: 'document' | 'whiteboard' | 'database'
}>()

// Reactive state
const isOpen = ref(false)
const loading = ref(false)
const newComment = ref('')
const editingComment = ref<Comment | null>(null)
const commentPriority = ref<'low' | 'medium' | 'high'>('medium')
const selectedContext = ref<any>(null)
const showContextSelector = ref(false)
const attachments = ref<File[]>([])
const showEmojiPicker = ref(false)
const showMentions = ref(false)
const selectedMentionIndex = ref(0)
const currentFilter = ref('all')

// Mock data
const currentUser = ref<User>({
  id: 'current',
  name: 'Current User',
  email: 'current@example.com',
  avatar: 'https://i.pravatar.cc/150?u=current',
  status: 'online'
})

const comments = ref<Comment[]>([
  {
    id: '1',
    content: 'This section needs more detail about the user flow.',
    authorId: 'user1',
    author: {
      id: 'user1',
      name: 'Alice Cooper',
      email: 'alice@example.com',
      avatar: 'https://i.pravatar.cc/150?u=alice',
      status: 'online'
    },
    contextId: 'paragraph-1',
    contextType: 'text',
    priority: 'high',
    isResolved: false,
    mentions: [],
    reactions: [
      {
        id: '1',
        emoji: '👍',
        userId: 'user2',
        user: {
          id: 'user2',
          name: 'Bob Wilson',
          email: 'bob@example.com',
          avatar: 'https://i.pravatar.cc/150?u=bob',
          status: 'online'
        }
      }
    ],
    attachments: [],
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000)
  }
])

const mentionNotifications = ref<any[]>([])
const commentHighlights = ref<CommentHighlight[]>([])

// Constants
const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' }
]

const filterOptions = [
  [{
    label: 'All Comments',
    click: () => currentFilter.value = 'all'
  }],
  [{
    label: 'Unresolved',
    click: () => currentFilter.value = 'unresolved'
  }],
  [{
    label: 'My Comments',
    click: () => currentFilter.value = 'mine'
  }],
  [{
    label: 'Mentions',
    click: () => currentFilter.value = 'mentions'
  }]
]

const commonEmojis = ['👍', '👎', '❤️', '😂', '😮', '😢', '🎉', '🔥']

// Computed properties
const filteredComments = computed(() => {
  let filtered = comments.value.filter(comment => !comment.parentId)
  
  switch (currentFilter.value) {
    case 'unresolved':
      filtered = filtered.filter(comment => !comment.isResolved)
      break
    case 'mine':
      filtered = filtered.filter(comment => comment.authorId === currentUser.value.id)
      break
    case 'mentions':
      filtered = filtered.filter(comment => 
        comment.mentions.includes(currentUser.value.id)
      )
      break
  }
  
  return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
})

const unreadCount = computed(() => {
  // In a real app, this would track which comments the user has seen
  return comments.value.filter(comment => !comment.isResolved).length
})

const hasActiveFilter = computed(() => currentFilter.value !== 'all')

const mentionSuggestions = computed(() => {
  // Mock team members for mentions
  return [
    {
      id: 'user1',
      name: 'Alice Cooper',
      email: 'alice@example.com',
      avatar: 'https://i.pravatar.cc/150?u=alice'
    },
    {
      id: 'user2',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      avatar: 'https://i.pravatar.cc/150?u=bob'
    }
  ]
})

// Methods
const toggleSidebar = () => {
  isOpen.value = !isOpen.value
}

const getReplies = (commentId: string) => {
  return comments.value.filter(comment => comment.parentId === commentId)
}

const submitComment = () => {
  if (!newComment.value.trim()) return

  const comment: Comment = {
    id: Date.now().toString(),
    content: newComment.value.trim(),
    authorId: currentUser.value.id,
    author: currentUser.value,
    contextId: selectedContext.value?.id,
    contextType: selectedContext.value?.type,
    priority: commentPriority.value,
    isResolved: false,
    parentId: editingComment.value?.parentId,
    mentions: extractMentions(newComment.value),
    reactions: [],
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }

  if (editingComment.value) {
    const index = comments.value.findIndex(c => c.id === editingComment.value!.id)
    comments.value[index] = { ...editingComment.value, ...comment, id: editingComment.value.id }
    editingComment.value = null
  } else {
    comments.value.push(comment)
  }

  // Send mention notifications
  comment.mentions.forEach(userId => {
    sendMentionNotification(userId, comment)
  })

  resetForm()
}

const addReply = (parentId: string, content: string) => {
  const reply: Comment = {
    id: Date.now().toString(),
    content,
    authorId: currentUser.value.id,
    author: currentUser.value,
    priority: 'medium',
    isResolved: false,
    parentId,
    mentions: extractMentions(content),
    reactions: [],
    attachments: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }

  comments.value.push(reply)
}

const editComment = (comment: Comment) => {
  editingComment.value = comment
  newComment.value = comment.content
  commentPriority.value = comment.priority
}

const deleteComment = (commentId: string) => {
  comments.value = comments.value.filter(c => c.id !== commentId)
}

const resolveComment = (commentId: string) => {
  const comment = comments.value.find(c => c.id === commentId)
  if (comment) {
    comment.isResolved = true
  }
}

const addReaction = (commentId: string, emoji: string) => {
  const comment = comments.value.find(c => c.id === commentId)
  if (comment) {
    const existingReaction = comment.reactions.find(r => 
      r.userId === currentUser.value.id && r.emoji === emoji
    )
    
    if (existingReaction) {
      comment.reactions = comment.reactions.filter(r => r.id !== existingReaction.id)
    } else {
      comment.reactions.push({
        id: Date.now().toString(),
        emoji,
        userId: currentUser.value.id,
        user: currentUser.value
      })
    }
  }
}

const handleInput = () => {
  const cursorPosition = (event.target as HTMLTextAreaElement).selectionStart
  const text = newComment.value
  const atIndex = text.lastIndexOf('@', cursorPosition)
  
  if (atIndex !== -1 && atIndex === cursorPosition - 1) {
    showMentions.value = true
    selectedMentionIndex.value = 0
  } else {
    showMentions.value = false
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (showMentions.value) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      selectedMentionIndex.value = Math.min(
        selectedMentionIndex.value + 1,
        mentionSuggestions.value.length - 1
      )
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      selectedMentionIndex.value = Math.max(selectedMentionIndex.value - 1, 0)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      selectMention(mentionSuggestions.value[selectedMentionIndex.value])
    } else if (event.key === 'Escape') {
      showMentions.value = false
    }
  } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault()
    submitComment()
  }
}

const selectMention = (user: User) => {
  const cursorPosition = (document.querySelector('textarea') as HTMLTextAreaElement).selectionStart
  const text = newComment.value
  const atIndex = text.lastIndexOf('@', cursorPosition)
  
  newComment.value = text.substring(0, atIndex) + `@${user.name} ` + text.substring(cursorPosition)
  showMentions.value = false
}

const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g
  const mentions = []
  let match
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionedUser = mentionSuggestions.value.find(user => 
      user.name.toLowerCase().includes(match[1].toLowerCase())
    )
    if (mentionedUser) {
      mentions.push(mentionedUser.id)
    }
  }
  
  return mentions
}

const sendMentionNotification = (userId: string, comment: Comment) => {
  const user = mentionSuggestions.value.find(u => u.id === userId)
  if (user) {
    mentionNotifications.value.push({
      id: Date.now().toString(),
      title: `${comment.author.name} mentioned you`,
      description: comment.content.substring(0, 100) + '...'
    })
  }
}

const dismissNotification = (notificationId: string) => {
  mentionNotifications.value = mentionNotifications.value.filter(n => n.id !== notificationId)
}

const handleMention = (userId: string) => {
  const user = mentionSuggestions.value.find(u => u.id === userId)
  if (user) {
    newComment.value += `@${user.name} `
  }
}

const getPriorityColor = (priority: string) => {
  const colors = {
    low: 'bg-gray-400',
    medium: 'bg-blue-400',
    high: 'bg-red-400'
  }
  return colors[priority] || 'bg-gray-400'
}

const insertEmoji = (emoji: string) => {
  newComment.value += emoji
  showEmojiPicker.value = false
}

const handleFileUpload = (event: Event) => {
  const files = Array.from((event.target as HTMLInputElement).files || [])
  attachments.value.push(...files)
}

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}

const clearContext = () => {
  selectedContext.value = null
  showContextSelector.value = false
}

const resetForm = () => {
  newComment.value = ''
  commentPriority.value = 'medium'
  attachments.value = []
  clearContext()
}

const cancelEdit = () => {
  editingComment.value = null
  resetForm()
}

const openComment = (commentId: string) => {
  isOpen.value = true
  // Scroll to comment in sidebar
  nextTick(() => {
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`)
    commentElement?.scrollIntoView({ behavior: 'smooth' })
  })
}

// Expose methods for parent component
defineExpose({
  addContextualComment: (context: any) => {
    selectedContext.value = context
    showContextSelector.value = true
    isOpen.value = true
  },
  highlightSelection: (selection: any) => {
    // Create comment highlight for selected text/element
    const highlight: CommentHighlight = {
      id: Date.now().toString(),
      commentId: '',
      commentCount: 1,
      style: {
        top: selection.top + 'px',
        left: selection.left + 'px',
        width: selection.width + 'px',
        height: selection.height + 'px'
      }
    }
    commentHighlights.value.push(highlight)
  }
})
</script>

<style scoped>
.commenting-system .comment-highlight {
  transition: all 0.2s ease;
}

.commenting-system .comment-highlight:hover {
  background-color: rgba(254, 240, 138, 0.8);
}
</style>