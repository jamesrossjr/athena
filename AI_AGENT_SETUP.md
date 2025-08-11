# Athena AI Agent Setup Guide

Your agentic AI system has been successfully integrated into the Athena digital paper application! This guide will help you get everything running.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install the new AI agent dependencies:
- `ollama` - For local LLM integration
- `chromadb` - For vector memory storage
- `axios` - For HTTP requests
- `ws` - For WebSocket connections
- `chokidar` - For file watching
- `node-cron` - For scheduled tasks

### 2. Install and Setup Ollama

1. **Download Ollama:**
   - Visit https://ollama.ai/download
   - Download and install for your operating system

2. **Start Ollama:**
   ```bash
   ollama serve
   ```

3. **Pull the recommended model:**
   ```bash
   ollama pull llama3.1
   ```

### 3. Start the Application

```bash
npm run dev
```

The AI assistant will automatically initialize when you first open the application.

## 🎯 Features Overview

### Core AI Assistant
- **Conversational Interface**: Chat with your AI assistant directly in the app
- **Voice Interaction**: Push-to-talk and text-to-speech capabilities
- **Contextual Awareness**: Understands your workspace, documents, and activities

### Proactive Intelligence
- **Smart Suggestions**: AI monitors your work and suggests helpful actions
- **Document Management**: Notices unsaved changes and empty documents
- **System Monitoring**: Tracks memory usage, git status, and file changes
- **Workflow Optimization**: Suggests templates, automations, and improvements

### Developer Tools Integration
- **Git Operations**: Status checks, commits, push/pull assistance
- **File System**: Read/write files, directory operations
- **NPM Management**: Package installation, script running
- **System Commands**: Memory monitoring, process management

### Memory System
- **Conversation History**: Remembers past interactions
- **Document Context**: Tracks your document editing patterns
- **Behavioral Learning**: Adapts to your preferences over time
- **Smart Search**: Find relevant past conversations and actions

### Voice Interface
- **Push-to-Talk**: Hold the microphone button to speak
- **Voice Activation**: Say "Hey Jarvis" or "Hey Athena" to activate
- **Text-to-Speech**: AI responses are spoken aloud
- **Multi-language Support**: English, Spanish, French, etc.

## 🎛️ How to Use

### 1. Accessing the AI Assistant

The AI assistant appears as a floating button in the bottom-right corner of your screen:
- **Click** to open the chat interface
- **Ctrl+J** keyboard shortcut to toggle
- **Purple gradient** = AI is ready
- **Pink gradient** = AI is active/thinking

### 2. Chat Interface

- **Type messages** in the input field
- **Press Enter** to send
- **Voice button** for push-to-talk
- **Settings gear** for personality customization

### 3. Voice Interaction

Enable voice in settings, then:
- **Hold the microphone button** and speak
- **Say "Hey Jarvis"** for hands-free activation
- AI will respond with both text and speech

### 4. Proactive Suggestions

The AI will automatically suggest helpful actions:
- **💡 Yellow suggestions** appear when opportunities are detected
- **Click suggestions** to accept them
- AI learns from your preferences

### 5. Personality Customization

Configure your AI assistant:
- **Name**: Jarvis, Athena, or custom name
- **Style**: Professional, Friendly, Casual, Technical
- **Proactiveness**: Low, Medium, High
- **Voice**: Language and speech settings

## 🔧 Configuration

### Environment Variables (Optional)

Create a `.env` file for advanced configuration:

```bash
# AI Configuration
OLLAMA_HOST=http://localhost:11434
AI_MODEL=llama3.1
PROACTIVE_INTERVAL=300000  # 5 minutes

# Voice Configuration
VOICE_ENABLED=true
VOICE_LANGUAGE=en-US
```

### Personality Presets

The AI comes with several personality presets:

- **Jarvis** (Default): Professional, proactive, developer-focused
- **Athena**: Wise, strategic, research-oriented
- **Ada**: Technical, precise, code-focused
- **Nova**: Creative, innovative, design-oriented

## 🛠️ Troubleshooting

### AI Not Connecting

1. **Check Ollama Status:**
   ```bash
   ollama list
   ```

2. **Verify Model Installation:**
   ```bash
   ollama pull llama3.1
   ```

3. **Check Server Logs:**
   Look for connection errors in the browser console

### Voice Not Working

1. **Check Browser Permissions:**
   - Allow microphone access
   - Allow notifications (for voice activation)

2. **Test Speech Recognition:**
   - Try a different browser (Chrome recommended)
   - Check microphone settings in OS

3. **Enable Voice in Settings:**
   - Click the voice toggle in AI settings
   - Select appropriate language

### Memory Issues

1. **Clear AI Memory:**
   - Use "Clear Conversation" in settings
   - Restart the application

2. **Check Server Resources:**
   - Monitor memory usage
   - Restart Ollama if needed

## 🎨 Customization

### Adding Custom Commands

You can extend the AI with custom commands by modifying:
- `server/api/ai/tools.post.ts` - Add new tool integrations
- `stores/aiAgent.ts` - Add new AI capabilities
- `server/api/ai/proactive.post.ts` - Add proactive monitoring

### Styling the Interface

The AI assistant UI is fully customizable:
- Dark/light mode automatically adapts
- CSS variables in `components/AIAssistant.vue`
- Responsive design for mobile/desktop

## 🔐 Privacy & Security

- **Local Processing**: AI runs entirely on your machine
- **No Data Sharing**: Conversations stay private
- **Secure Commands**: Tool execution is sandboxed
- **Memory Control**: Clear history anytime

## 🚀 Advanced Features

### Integration with Workspace

The AI automatically integrates with your workspace:
- **Document Awareness**: Knows about open documents
- **Project Context**: Understands your current project
- **File Monitoring**: Watches for changes and updates
- **Git Integration**: Tracks repository status

### Developer Workflow

Perfect for development workflows:
- **Code Analysis**: Understands your codebase
- **Commit Messages**: Suggests meaningful commits
- **Package Management**: Handles dependencies
- **Testing**: Can run tests and analyze results

### Productivity Features

Enhances your productivity:
- **Template Suggestions**: For empty documents
- **File Organization**: Suggests better structure
- **Automation**: Identifies repetitive tasks
- **Time Management**: Tracks work patterns

## 🎯 Tips for Best Experience

1. **Be Conversational**: Talk to the AI like a colleague
2. **Provide Context**: Mention what you're working on
3. **Use Voice**: Much faster for complex requests
4. **Trust Suggestions**: The AI learns your patterns
5. **Customize Personality**: Match your working style

## 🔮 What's Next?

The AI agent will continue to evolve with:
- **Better Code Understanding**: Advanced code analysis
- **Team Integration**: Multi-user collaboration
- **Custom Plugins**: Extensible architecture
- **Cloud Sync**: Optional cloud memory storage
- **Advanced Automation**: Complex workflow orchestration

---

## 🆘 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify Ollama is running correctly
3. Restart the application
4. Check this guide for troubleshooting steps

Enjoy your new AI-powered development environment! 🎉