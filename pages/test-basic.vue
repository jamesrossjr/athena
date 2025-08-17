<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold text-gray-900 mb-6">
        Athena - Test Page
      </h1>
      <p class="text-lg text-gray-600 mb-8">
        This is a basic test page to verify the application is working.
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-4">✅ Core Features Working</h2>
          <ul class="space-y-2 text-gray-600">
            <li>• Server running successfully</li>
            <li>• Database connection established</li>
            <li>• API endpoints active</li>
            <li>• Frontend pages loading</li>
          </ul>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-4">🔧 Available APIs</h2>
          <ul class="space-y-2 text-gray-600">
            <li>• <code>/api/test</code> - Health check</li>
            <li>• <code>/api/ai/chat</code> - AI chat</li>
            <li>• <code>/api/ai/summarize</code> - Text summary</li>
            <li>• <code>/api/documents</code> - Document API</li>
          </ul>
        </div>
      </div>
      
      <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <p class="text-blue-800">
          🎉 <strong>Success!</strong> The Athena application is now operational with core functionality working.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
useHead({
  title: 'Test - Athena'
})
</script>