import { readBody } from 'h3'
import { exec } from 'child_process'
import { promises as fs } from 'fs'
import { join } from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { tool, action, data } = body

    switch (tool) {
      case 'git':
        return await handleGitCommand(action, data)
      
      case 'file':
        return await handleFileOperation(action, data)
      
      case 'npm':
        return await handleNpmCommand(action, data)
      
      case 'system':
        return await handleSystemCommand(action, data)
      
      default:
        return {
          success: false,
          error: 'Unknown tool'
        }
    }

  } catch (error) {
    console.error('AI Tools API Error:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

async function handleGitCommand(action: string, data: any) {
  const allowedCommands = ['status', 'add', 'commit', 'push', 'pull', 'branch', 'log']
  
  if (!allowedCommands.includes(action)) {
    return {
      success: false,
      error: 'Git command not allowed'
    }
  }

  try {
    let command = ''
    
    switch (action) {
      case 'status':
        command = 'git status --porcelain'
        break
      case 'add':
        command = `git add ${data.files || '.'}`
        break
      case 'commit':
        command = `git commit -m "${data.message || 'AI-assisted commit'}"`
        break
      case 'push':
        command = 'git push'
        break
      case 'pull':
        command = 'git pull'
        break
      case 'branch':
        command = 'git branch'
        break
      case 'log':
        command = 'git log --oneline -10'
        break
    }

    const { stdout, stderr } = await execAsync(command)
    
    return {
      success: true,
      output: stdout,
      error: stderr,
      command
    }

  } catch (error) {
    return {
      success: false,
      error: error.message,
      command: action
    }
  }
}

async function handleFileOperation(action: string, data: any) {
  const allowedActions = ['read', 'write', 'list', 'mkdir', 'exists']
  
  if (!allowedActions.includes(action)) {
    return {
      success: false,
      error: 'File operation not allowed'
    }
  }

  try {
    let result: any = {}

    switch (action) {
      case 'read':
        if (!data.path) {
          throw new Error('File path required')
        }
        result.content = await fs.readFile(data.path, 'utf-8')
        break
        
      case 'write':
        if (!data.path || data.content === undefined) {
          throw new Error('File path and content required')
        }
        await fs.writeFile(data.path, data.content, 'utf-8')
        result.message = 'File written successfully'
        break
        
      case 'list':
        const dirPath = data.path || '.'
        const files = await fs.readdir(dirPath, { withFileTypes: true })
        result.files = files.map(file => ({
          name: file.name,
          type: file.isDirectory() ? 'directory' : 'file'
        }))
        break
        
      case 'mkdir':
        if (!data.path) {
          throw new Error('Directory path required')
        }
        await fs.mkdir(data.path, { recursive: true })
        result.message = 'Directory created successfully'
        break
        
      case 'exists':
        if (!data.path) {
          throw new Error('File path required')
        }
        try {
          await fs.access(data.path)
          result.exists = true
        } catch {
          result.exists = false
        }
        break
    }

    return {
      success: true,
      ...result
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

async function handleNpmCommand(action: string, data: any) {
  const allowedCommands = ['install', 'run', 'list', 'outdated', 'update']
  
  if (!allowedCommands.includes(action)) {
    return {
      success: false,
      error: 'NPM command not allowed'
    }
  }

  try {
    let command = ''
    
    switch (action) {
      case 'install':
        command = data.package ? `npm install ${data.package}` : 'npm install'
        break
      case 'run':
        if (!data.script) {
          throw new Error('Script name required')
        }
        command = `npm run ${data.script}`
        break
      case 'list':
        command = 'npm list --depth=0'
        break
      case 'outdated':
        command = 'npm outdated'
        break
      case 'update':
        command = data.package ? `npm update ${data.package}` : 'npm update'
        break
    }

    const { stdout, stderr } = await execAsync(command, { timeout: 30000 })
    
    return {
      success: true,
      output: stdout,
      error: stderr,
      command
    }

  } catch (error) {
    return {
      success: false,
      error: error.message,
      command: action
    }
  }
}

async function handleSystemCommand(action: string, data: any) {
  const allowedCommands = ['ps', 'df', 'free', 'uptime']
  
  if (!allowedCommands.includes(action)) {
    return {
      success: false,
      error: 'System command not allowed'
    }
  }

  try {
    let command = ''
    
    switch (action) {
      case 'ps':
        command = process.platform === 'win32' ? 'tasklist' : 'ps aux'
        break
      case 'df':
        command = process.platform === 'win32' ? 'wmic logicaldisk get size,freespace,caption' : 'df -h'
        break
      case 'free':
        command = process.platform === 'win32' ? 'wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value' : 'free -h'
        break
      case 'uptime':
        command = process.platform === 'win32' ? 'systeminfo | find "System Boot Time"' : 'uptime'
        break
    }

    const { stdout, stderr } = await execAsync(command)
    
    return {
      success: true,
      output: stdout,
      error: stderr,
      command
    }

  } catch (error) {
    return {
      success: false,
      error: error.message,
      command: action
    }
  }
}