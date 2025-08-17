<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto p-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Import Your Data</h1>
        <p class="text-gray-600">
          Bring your existing content from other platforms into Athena seamlessly.
        </p>
      </div>

      <!-- Import Options -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Notion Import -->
        <UCard class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">N</span>
              </div>
              <div>
                <h3 class="font-semibold">Notion</h3>
                <p class="text-sm text-gray-500">Import your Notion workspace</p>
              </div>
            </div>
          </template>
          
          <div class="space-y-4">
            <p class="text-sm text-gray-600">
              Import pages, databases, and content from your Notion workspace. Supports markdown export format.
            </p>
            
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Pages and sub-pages</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Database content</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Rich text formatting</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Images and attachments</span>
              </div>
            </div>
            
            <UButton block @click="startImport('notion')">
              Import from Notion
            </UButton>
          </div>
        </UCard>

        <!-- Obsidian Import -->
        <UCard class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">O</span>
              </div>
              <div>
                <h3 class="font-semibold">Obsidian</h3>
                <p class="text-sm text-gray-500">Import your Obsidian vault</p>
              </div>
            </div>
          </template>
          
          <div class="space-y-4">
            <p class="text-sm text-gray-600">
              Import your markdown notes from Obsidian with full link preservation and graph relationships.
            </p>
            
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Markdown files</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Internal links [[]]</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Tags and properties</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Folder structure</span>
              </div>
            </div>
            
            <UButton block @click="startImport('obsidian')">
              Import from Obsidian
            </UButton>
          </div>
        </UCard>

        <!-- Evernote Import -->
        <UCard class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">E</span>
              </div>
              <div>
                <h3 class="font-semibold">Evernote</h3>
                <p class="text-sm text-gray-500">Import your Evernote notebooks</p>
              </div>
            </div>
          </template>
          
          <div class="space-y-4">
            <p class="text-sm text-gray-600">
              Import notebooks and notes from Evernote with full content preservation and organization.
            </p>
            
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Notes and notebooks</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Tags and labels</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Web clipper content</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Attachments</span>
              </div>
            </div>
            
            <UButton block @click="startImport('evernote')">
              Import from Evernote
            </UButton>
          </div>
        </UCard>

        <!-- Google Docs Import -->
        <UCard class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">G</span>
              </div>
              <div>
                <h3 class="font-semibold">Google Docs</h3>
                <p class="text-sm text-gray-500">Import Google Drive documents</p>
              </div>
            </div>
          </template>
          
          <div class="space-y-4">
            <p class="text-sm text-gray-600">
              Connect your Google Drive and import documents, sheets, and presentations directly.
            </p>
            
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Google Docs</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Google Sheets</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Folder organization</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Comments and suggestions</span>
              </div>
            </div>
            
            <UButton block @click="startImport('google-docs')">
              Import from Google Drive
            </UButton>
          </div>
        </UCard>

        <!-- Markdown Import -->
        <UCard class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">MD</span>
              </div>
              <div>
                <h3 class="font-semibold">Markdown Files</h3>
                <p class="text-sm text-gray-500">Upload markdown files</p>
              </div>
            </div>
          </template>
          
          <div class="space-y-4">
            <p class="text-sm text-gray-600">
              Upload individual markdown files or bulk import from a zip archive.
            </p>
            
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Individual .md files</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Bulk zip upload</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Frontmatter support</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Image references</span>
              </div>
            </div>
            
            <UButton block @click="startImport('markdown')">
              Upload Markdown Files
            </UButton>
          </div>
        </UCard>

        <!-- CSV/Excel Import -->
        <UCard class="hover:shadow-lg transition-shadow">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">📊</span>
              </div>
              <div>
                <h3 class="font-semibold">Spreadsheets</h3>
                <p class="text-sm text-gray-500">Import CSV and Excel files</p>
              </div>
            </div>
          </template>
          
          <div class="space-y-4">
            <p class="text-sm text-gray-600">
              Convert your spreadsheets into powerful Athena databases with enhanced functionality.
            </p>
            
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>CSV files</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Excel (.xlsx) files</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Auto-detect data types</span>
              </div>
              <div class="flex items-center gap-2 text-sm">
                <UIcon name="i-heroicons-check" class="w-4 h-4 text-green-500" />
                <span>Multiple sheets</span>
              </div>
            </div>
            
            <UButton block @click="startImport('spreadsheet')">
              Import Spreadsheet
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- Import Instructions -->
      <div class="mt-12 bg-blue-50 rounded-lg p-6">
        <h2 class="text-lg font-semibold text-blue-900 mb-4">How Import Works</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center">
            <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
              1
            </div>
            <h3 class="font-medium text-blue-900 mb-2">Export Your Data</h3>
            <p class="text-sm text-blue-700">
              Export your content from the source platform using their native export feature.
            </p>
          </div>
          
          <div class="text-center">
            <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
              2
            </div>
            <h3 class="font-medium text-blue-900 mb-2">Choose Import Method</h3>
            <p class="text-sm text-blue-700">
              Select the appropriate import option above and upload your exported files.
            </p>
          </div>
          
          <div class="text-center">
            <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
              3
            </div>
            <h3 class="font-medium text-blue-900 mb-2">Review & Organize</h3>
            <p class="text-sm text-blue-700">
              Review imported content and organize it into your Athena workspace structure.
            </p>
          </div>
        </div>
      </div>

      <!-- Support -->
      <div class="mt-8 text-center">
        <p class="text-gray-600 mb-4">
          Need help with importing? Our support team is here to assist you.
        </p>
        <UButton variant="outline" icon="i-heroicons-chat-bubble-left-ellipsis">
          Contact Support
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Import Data - Athena'
})

function startImport(platform: string) {
  const toast = useToast()
  
  // Mock import process
  toast.add({
    title: 'Import Feature Coming Soon',
    description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} import will be available in the next update.`,
    color: 'blue',
    icon: 'i-heroicons-arrow-down-tray'
  })
  
  // In production, this would:
  // 1. Open file picker or OAuth flow
  // 2. Process uploaded files
  // 3. Create documents in Athena
  // 4. Show progress and results
}
</script>