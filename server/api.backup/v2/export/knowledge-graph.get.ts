interface JSONLDDocument {
  '@context': {
    '@vocab': string
    'schema': string
    'athena': string
    'dc': string
    'foaf': string
  }
  '@type': string
  '@id': string
  'schema:name': string
  'schema:description'?: string
  'schema:dateCreated': string
  'schema:dateModified': string
  'schema:author': {
    '@type': string
    '@id': string
    'foaf:name': string
  }
  'schema:isPartOf'?: {
    '@type': string
    '@id': string
    'schema:name': string
  }
  'athena:contentType': string
  'athena:version': number
  'athena:wordCount'?: number
  'schema:text'?: string
  'schema:hasPart'?: JSONLDDocument[]
  'schema:mentions'?: Array<{
    '@type': string
    '@id': string
    'schema:name': string
    'athena:relationshipType': string
  }>
  'athena:knowledgeConnections'?: Array<{
    '@type': string
    '@id': string
    'schema:name': string
    'athena:connectionType': 'references' | 'contains' | 'related' | 'cites' | 'builds_on'
    'athena:confidence': number
  }>
}

interface ExportOptions {
  format: 'json-ld' | 'rdf-xml' | 'turtle' | 'csv' | 'markdown'
  includeContent: boolean
  includeConnections: boolean
  includeMetadata: boolean
  workspaceId?: string
  dateRange?: {
    start: string
    end: string
  }
}

export default defineEventHandler(async (event) => {
  try {
    // Authenticate request
    const { userId, scopes } = await authenticateRequest(event)
    
    // Check required scope
    if (!scopes.includes('knowledge-graph:read')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Insufficient permissions - knowledge-graph:read scope required'
      })
    }

    // Parse query parameters
    const query = getQuery(event)
    const options: ExportOptions = {
      format: (query.format as string) || 'json-ld',
      includeContent: query.include_content !== 'false',
      includeConnections: query.include_connections !== 'false',
      includeMetadata: query.include_metadata !== 'false',
      workspaceId: query.workspace_id as string,
      dateRange: query.start_date && query.end_date ? {
        start: query.start_date as string,
        end: query.end_date as string
      } : undefined
    }

    // Validate format
    const supportedFormats = ['json-ld', 'rdf-xml', 'turtle', 'csv', 'markdown']
    if (!supportedFormats.includes(options.format)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Unsupported format. Supported formats: ${supportedFormats.join(', ')}`
      })
    }

    // Get user's knowledge graph data
    const knowledgeGraph = await getUserKnowledgeGraph(userId, options)
    
    // Export in requested format
    const exportData = await exportKnowledgeGraph(knowledgeGraph, options)
    const filename = generateExportFilename(userId, options.format)
    
    // Set appropriate headers
    setResponseHeaders(event, options.format, filename)
    
    return exportData
  } catch (error) {
    console.error('Knowledge graph export error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Export failed'
    })
  }
})

async function getUserKnowledgeGraph(userId: string, options: ExportOptions): Promise<any> {
  // Mock knowledge graph data - in production, query actual database
  const documents = [
    {
      id: 'doc_1',
      title: 'AI Strategy 2024',
      description: 'Comprehensive AI strategy for the upcoming year',
      type: 'document',
      content: 'Our AI strategy focuses on three key areas: automation, personalization, and ethical AI development...',
      workspaceId: 'ws_1',
      workspaceName: 'Strategy Team',
      ownerId: userId,
      ownerName: 'John Doe',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      version: 3,
      wordCount: 1250,
      connections: [
        {
          targetId: 'doc_2',
          targetTitle: 'Machine Learning Infrastructure',
          type: 'references',
          confidence: 0.95
        },
        {
          targetId: 'doc_3',
          targetTitle: 'Ethics in AI',
          type: 'builds_on',
          confidence: 0.88
        }
      ]
    },
    {
      id: 'doc_2',
      title: 'Machine Learning Infrastructure',
      description: 'Technical architecture for ML systems',
      type: 'document',
      content: 'Our ML infrastructure consists of data pipelines, model training systems, and deployment automation...',
      workspaceId: 'ws_1',
      workspaceName: 'Strategy Team',
      ownerId: userId,
      ownerName: 'John Doe',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
      version: 5,
      wordCount: 2100,
      connections: [
        {
          targetId: 'board_1',
          targetTitle: 'System Architecture Diagram',
          type: 'contains',
          confidence: 1.0
        }
      ]
    },
    {
      id: 'board_1',
      title: 'System Architecture Diagram',
      description: 'Visual representation of our system architecture',
      type: 'whiteboard',
      content: { nodes: [], edges: [] },
      workspaceId: 'ws_2',
      workspaceName: 'Engineering Team',
      ownerId: userId,
      ownerName: 'John Doe',
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-16'),
      version: 2,
      connections: []
    }
  ]

  // Apply filters
  let filtered = documents

  if (options.workspaceId) {
    filtered = filtered.filter(doc => doc.workspaceId === options.workspaceId)
  }

  if (options.dateRange) {
    const start = new Date(options.dateRange.start)
    const end = new Date(options.dateRange.end)
    filtered = filtered.filter(doc => 
      doc.updatedAt >= start && doc.updatedAt <= end
    )
  }

  return {
    documents: filtered,
    exportMetadata: {
      userId,
      exportedAt: new Date().toISOString(),
      totalDocuments: filtered.length,
      format: options.format,
      version: '2.0'
    }
  }
}

async function exportKnowledgeGraph(knowledgeGraph: any, options: ExportOptions): Promise<any> {
  switch (options.format) {
    case 'json-ld':
      return exportAsJSONLD(knowledgeGraph, options)
    case 'rdf-xml':
      return exportAsRDFXML(knowledgeGraph, options)
    case 'turtle':
      return exportAsTurtle(knowledgeGraph, options)
    case 'csv':
      return exportAsCSV(knowledgeGraph, options)
    case 'markdown':
      return exportAsMarkdown(knowledgeGraph, options)
    default:
      throw createError({
        statusCode: 400,
        statusMessage: 'Unsupported export format'
      })
  }
}

function exportAsJSONLD(knowledgeGraph: any, options: ExportOptions): any {
  const context = {
    '@vocab': 'https://athena.ai/vocab/',
    'schema': 'https://schema.org/',
    'athena': 'https://athena.ai/vocab/',
    'dc': 'http://purl.org/dc/terms/',
    'foaf': 'http://xmlns.com/foaf/0.1/'
  }

  const documents: JSONLDDocument[] = knowledgeGraph.documents.map(doc => {
    const jsonldDoc: JSONLDDocument = {
      '@context': context,
      '@type': doc.type === 'document' ? 'schema:CreativeWork' : 
               doc.type === 'whiteboard' ? 'schema:VisualArtwork' : 'schema:Dataset',
      '@id': `https://athena.ai/documents/${doc.id}`,
      'schema:name': doc.title,
      'schema:description': doc.description,
      'schema:dateCreated': doc.createdAt.toISOString(),
      'schema:dateModified': doc.updatedAt.toISOString(),
      'schema:author': {
        '@type': 'foaf:Person',
        '@id': `https://athena.ai/users/${doc.ownerId}`,
        'foaf:name': doc.ownerName
      },
      'schema:isPartOf': {
        '@type': 'schema:Organization',
        '@id': `https://athena.ai/workspaces/${doc.workspaceId}`,
        'schema:name': doc.workspaceName
      },
      'athena:contentType': doc.type,
      'athena:version': doc.version
    }

    if (options.includeContent && typeof doc.content === 'string') {
      jsonldDoc['schema:text'] = doc.content
      jsonldDoc['athena:wordCount'] = doc.wordCount
    }

    if (options.includeConnections && doc.connections.length > 0) {
      jsonldDoc['athena:knowledgeConnections'] = doc.connections.map(conn => ({
        '@type': 'athena:KnowledgeConnection',
        '@id': `https://athena.ai/documents/${conn.targetId}`,
        'schema:name': conn.targetTitle,
        'athena:connectionType': conn.type,
        'athena:confidence': conn.confidence
      }))
    }

    return jsonldDoc
  })

  const result = {
    '@context': context,
    '@graph': documents
  }

  if (options.includeMetadata) {
    result['@metadata'] = knowledgeGraph.exportMetadata
  }

  return result
}

function exportAsRDFXML(knowledgeGraph: any, options: ExportOptions): string {
  // Simplified RDF/XML export
  let rdf = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:schema="https://schema.org/"
  xmlns:athena="https://athena.ai/vocab/"
  xmlns:dc="http://purl.org/dc/terms/"
  xmlns:foaf="http://xmlns.com/foaf/0.1/">
`

  knowledgeGraph.documents.forEach(doc => {
    const type = doc.type === 'document' ? 'schema:CreativeWork' : 
                 doc.type === 'whiteboard' ? 'schema:VisualArtwork' : 'schema:Dataset'
    
    rdf += `
  <${type} rdf:about="https://athena.ai/documents/${doc.id}">
    <schema:name>${escapeXML(doc.title)}</schema:name>
    <schema:description>${escapeXML(doc.description)}</schema:description>
    <schema:dateCreated>${doc.createdAt.toISOString()}</schema:dateCreated>
    <schema:dateModified>${doc.updatedAt.toISOString()}</schema:dateModified>
    <athena:contentType>${doc.type}</athena:contentType>
    <athena:version>${doc.version}</athena:version>`

    if (options.includeContent && typeof doc.content === 'string') {
      rdf += `
    <schema:text>${escapeXML(doc.content)}</schema:text>`
    }

    rdf += `
  </${type}>`
  })

  rdf += `
</rdf:RDF>`

  return rdf
}

function exportAsTurtle(knowledgeGraph: any, options: ExportOptions): string {
  let turtle = `@prefix schema: <https://schema.org/> .
@prefix athena: <https://athena.ai/vocab/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .

`

  knowledgeGraph.documents.forEach(doc => {
    turtle += `<https://athena.ai/documents/${doc.id}>
  a schema:CreativeWork ;
  schema:name "${doc.title}" ;
  schema:description "${doc.description}" ;
  schema:dateCreated "${doc.createdAt.toISOString()}" ;
  schema:dateModified "${doc.updatedAt.toISOString()}" ;
  athena:contentType "${doc.type}" ;
  athena:version ${doc.version} .

`
  })

  return turtle
}

function exportAsCSV(knowledgeGraph: any, options: ExportOptions): string {
  const headers = ['id', 'title', 'description', 'type', 'created', 'modified', 'version', 'workspace']
  if (options.includeContent) headers.push('content')
  
  let csv = headers.join(',') + '\n'
  
  knowledgeGraph.documents.forEach(doc => {
    const row = [
      doc.id,
      `"${doc.title.replace(/"/g, '""')}"`,
      `"${doc.description.replace(/"/g, '""')}"`,
      doc.type,
      doc.createdAt.toISOString(),
      doc.updatedAt.toISOString(),
      doc.version,
      `"${doc.workspaceName.replace(/"/g, '""')}"`
    ]
    
    if (options.includeContent) {
      const content = typeof doc.content === 'string' ? doc.content : JSON.stringify(doc.content)
      row.push(`"${content.replace(/"/g, '""')}"`)
    }
    
    csv += row.join(',') + '\n'
  })
  
  return csv
}

function exportAsMarkdown(knowledgeGraph: any, options: ExportOptions): string {
  let markdown = `# Knowledge Graph Export

Generated on: ${new Date().toISOString()}
Total Documents: ${knowledgeGraph.documents.length}

`

  knowledgeGraph.documents.forEach(doc => {
    markdown += `## ${doc.title}

- **Type**: ${doc.type}
- **Created**: ${doc.createdAt.toISOString()}
- **Modified**: ${doc.updatedAt.toISOString()}
- **Version**: ${doc.version}
- **Workspace**: ${doc.workspaceName}

${doc.description}

`

    if (options.includeContent && typeof doc.content === 'string') {
      markdown += `### Content

${doc.content}

`
    }

    if (options.includeConnections && doc.connections.length > 0) {
      markdown += `### Connections

`
      doc.connections.forEach(conn => {
        markdown += `- **${conn.type}**: [${conn.targetTitle}](https://athena.ai/documents/${conn.targetId}) (confidence: ${conn.confidence})\n`
      })
      markdown += '\n'
    }

    markdown += '---\n\n'
  })

  return markdown
}

function setResponseHeaders(event: any, format: string, filename: string): void {
  const mimeTypes = {
    'json-ld': 'application/ld+json',
    'rdf-xml': 'application/rdf+xml',
    'turtle': 'text/turtle',
    'csv': 'text/csv',
    'markdown': 'text/markdown'
  }

  setHeader(event, 'Content-Type', mimeTypes[format] || 'application/json')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  setHeader(event, 'X-Export-Format', format)
  setHeader(event, 'X-Export-Version', '2.0')
}

function generateExportFilename(userId: string, format: string): string {
  const timestamp = new Date().toISOString().split('T')[0]
  const extension = format === 'rdf-xml' ? 'rdf' : 
                   format === 'json-ld' ? 'jsonld' : format
  return `athena-knowledge-graph-${timestamp}.${extension}`
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Authentication function (reused from other API endpoints)
async function authenticateRequest(event: any): Promise<{ userId: string; scopes: string[] }> {
  const authorization = getHeader(event, 'authorization')
  
  if (!authorization?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing or invalid authorization header'
    })
  }

  const token = authorization.slice(7)
  
  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret || 'fallback-secret') as any
    
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Token expired'
      })
    }

    return {
      userId: decoded.sub,
      scopes: decoded.scope.split(' ')
    }
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid token'
    })
  }
}