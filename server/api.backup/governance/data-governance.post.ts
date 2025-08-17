import { dataGovernanceEngine } from '~/server/utils/dataGovernance'

interface DataGovernanceRequest {
  action: 'create_policy' | 'approve_policy' | 'create_ediscovery' | 'approve_ediscovery' | 
          'create_retention' | 'configure_residency' | 'generate_compliance_report'
  
  // Policy creation
  policyData?: {
    name: string
    type: 'retention' | 'classification' | 'access' | 'residency' | 'discovery'
    description: string
    rules: any[]
    enforcement: 'strict' | 'advisory' | 'disabled'
    appliesToOrganizations: string[]
    effectiveDate?: string
    expirationDate?: string
    metadata: {
      complianceFrameworks: string[]
      businessJustification: string
      riskLevel: 'high' | 'medium' | 'low'
    }
  }
  
  // Policy approval
  policyId?: string
  
  // eDiscovery request
  eDiscoveryData?: {
    organizationId: string
    legalCase: {
      name: string
      number: string
      jurisdiction: string
      attorney: {
        name: string
        email: string
        barNumber: string
      }
    }
    searchCriteria: {
      keywords: string[]
      dateRange: {
        start: string
        end: string
      }
      custodians: string[]
      dataTypes: string[]
      workspaces: string[]
      includeDeleted: boolean
    }
    priority: 'routine' | 'urgent' | 'emergency'
    dueDate?: string
  }
  
  // Retention schedule
  retentionData?: {
    organizationId: string
    name: string
    dataType: string
    retentionPeriod: number
    retentionBasis: 'creation_date' | 'last_modified' | 'last_accessed' | 'custom'
    disposalMethod: 'soft_delete' | 'hard_delete' | 'archive' | 'anonymize'
    legalHoldExemption: boolean
    businessJustification: string
    complianceRequirement: string[]
    reviewCycle: number
    automaticEnforcement: boolean
    notifications: {
      warningDays: number[]
      recipients: string[]
    }
  }
  
  // Data residency configuration
  residencyData?: {
    organizationId: string
    preferredRegion: string
    allowedRegions: string[]
    restrictedRegions: string[]
    dataTypes: {
      documents: string
      metadata: string
      auditLogs: string
      backups: string
    }
    crossBorderTransfer: {
      enabled: boolean
      approvalRequired: boolean
      encryptionRequired: boolean
      auditRequired: boolean
    }
    complianceFrameworks: string[]
  }
  
  // Compliance report
  organizationId?: string
  framework?: string
  
  // Common fields
  requesterId?: string
  approvalType?: string
  approved?: boolean
}

export default defineEventHandler(async (event) => {
  try {
    // Parse request body
    const body = await readBody(event) as DataGovernanceRequest
    
    // Validate request
    if (!body.action) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Action is required'
      })
    }

    // Extract user from headers (in production, use proper authentication)
    const userId = getHeader(event, 'x-user-id') || 'system'
    
    let result: any

    switch (body.action) {
      case 'create_policy':
        result = await handlePolicyCreation(body.policyData!, userId)
        break
        
      case 'approve_policy':
        result = await handlePolicyApproval(body.policyId!, userId)
        break
        
      case 'create_ediscovery':
        result = await handleEDiscoveryCreation(body.eDiscoveryData!, userId)
        break
        
      case 'approve_ediscovery':
        result = await handleEDiscoveryApproval(
          body.policyId!, // using as requestId
          body.approvalType!,
          userId,
          body.approved!
        )
        break
        
      case 'create_retention':
        result = await handleRetentionCreation(body.retentionData!)
        break
        
      case 'configure_residency':
        result = await handleResidencyConfiguration(body.residencyData!)
        break
        
      case 'generate_compliance_report':
        result = await handleComplianceReport(body.organizationId!, body.framework || 'general')
        break
        
      default:
        throw createError({
          statusCode: 400,
          statusMessage: `Unsupported action: ${body.action}`
        })
    }

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('Data governance API error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Data governance operation failed'
    })
  }
})

async function handlePolicyCreation(policyData: any, createdBy: string): Promise<any> {
  // Validate policy data
  const requiredFields = ['name', 'type', 'description', 'metadata']
  for (const field of requiredFields) {
    if (!policyData[field]) {
      throw createError({
        statusCode: 400,
        statusMessage: `Missing required field: ${field}`
      })
    }
  }

  // Convert date strings to Date objects
  if (policyData.effectiveDate) {
    policyData.effectiveDate = new Date(policyData.effectiveDate)
  }
  if (policyData.expirationDate) {
    policyData.expirationDate = new Date(policyData.expirationDate)
  }

  const policyId = await dataGovernanceEngine.createPolicy(policyData, createdBy)
  
  return {
    policyId,
    name: policyData.name,
    status: 'created',
    message: 'Data governance policy created successfully',
    approvalRequired: policyData.enforcement === 'strict'
  }
}

async function handlePolicyApproval(policyId: string, approvedBy: string): Promise<any> {
  try {
    await dataGovernanceEngine.approvePolicy(policyId, approvedBy)
    
    return {
      policyId,
      status: 'approved',
      approvedBy,
      message: 'Policy approved successfully'
    }
  } catch (error) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Policy not found or approval failed'
    })
  }
}

async function handleEDiscoveryCreation(eDiscoveryData: any, requesterId: string): Promise<any> {
  // Validate eDiscovery data
  const requiredFields = ['organizationId', 'legalCase', 'searchCriteria']
  for (const field of requiredFields) {
    if (!eDiscoveryData[field]) {
      throw createError({
        statusCode: 400,
        statusMessage: `Missing required field: ${field}`
      })
    }
  }

  // Validate legal case information
  if (!eDiscoveryData.legalCase.attorney?.email || !eDiscoveryData.legalCase.attorney?.barNumber) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Complete attorney information is required'
    })
  }

  // Convert date strings
  if (eDiscoveryData.searchCriteria.dateRange) {
    eDiscoveryData.searchCriteria.dateRange.start = new Date(eDiscoveryData.searchCriteria.dateRange.start)
    eDiscoveryData.searchCriteria.dateRange.end = new Date(eDiscoveryData.searchCriteria.dateRange.end)
  }
  if (eDiscoveryData.dueDate) {
    eDiscoveryData.dueDate = new Date(eDiscoveryData.dueDate)
  }

  eDiscoveryData.requesterId = requesterId
  const requestId = await dataGovernanceEngine.createEDiscoveryRequest(eDiscoveryData)
  
  return {
    requestId,
    legalCase: eDiscoveryData.legalCase.name,
    status: 'pending_approval',
    message: 'eDiscovery request submitted for approval',
    estimatedProcessingTime: eDiscoveryData.priority === 'urgent' ? '1-2 business days' : '5-10 business days'
  }
}

async function handleEDiscoveryApproval(
  requestId: string, 
  approvalType: string, 
  approvedBy: string, 
  approved: boolean
): Promise<any> {
  try {
    await dataGovernanceEngine.processEDiscoveryApproval(requestId, approvalType, approvedBy, approved)
    
    return {
      requestId,
      approvalType,
      approved,
      approvedBy,
      status: approved ? 'approved' : 'denied',
      message: `eDiscovery request ${approved ? 'approved' : 'denied'} by ${approvalType} team`
    }
  } catch (error) {
    throw createError({
      statusCode: 404,
      statusMessage: 'eDiscovery request not found or approval failed'
    })
  }
}

async function handleRetentionCreation(retentionData: any): Promise<any> {
  // Validate retention data
  const requiredFields = ['organizationId', 'name', 'dataType', 'retentionPeriod']
  for (const field of requiredFields) {
    if (!retentionData[field]) {
      throw createError({
        statusCode: 400,
        statusMessage: `Missing required field: ${field}`
      })
    }
  }

  // Validate retention period
  if (retentionData.retentionPeriod < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Retention period must be at least 1 day'
    })
  }

  const scheduleId = await dataGovernanceEngine.createRetentionSchedule(retentionData)
  
  return {
    scheduleId,
    name: retentionData.name,
    dataType: retentionData.dataType,
    retentionPeriod: retentionData.retentionPeriod,
    status: 'created',
    message: 'Retention schedule created successfully',
    automaticEnforcement: retentionData.automaticEnforcement
  }
}

async function handleResidencyConfiguration(residencyData: any): Promise<any> {
  // Validate residency data
  const requiredFields = ['organizationId', 'preferredRegion', 'allowedRegions', 'dataTypes']
  for (const field of requiredFields) {
    if (!residencyData[field]) {
      throw createError({
        statusCode: 400,
        statusMessage: `Missing required field: ${field}`
      })
    }
  }

  // Validate that preferred region is in allowed regions
  if (!residencyData.allowedRegions.includes(residencyData.preferredRegion)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Preferred region must be included in allowed regions'
    })
  }

  await dataGovernanceEngine.configureDataResidency(residencyData)
  
  return {
    organizationId: residencyData.organizationId,
    preferredRegion: residencyData.preferredRegion,
    allowedRegions: residencyData.allowedRegions,
    status: 'configured',
    message: 'Data residency configuration updated successfully',
    migrationRequired: false // Would be determined by actual data analysis
  }
}

async function handleComplianceReport(organizationId: string, framework: string): Promise<any> {
  if (!organizationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Organization ID is required'
    })
  }

  const report = await dataGovernanceEngine.generateComplianceReport(organizationId, framework)
  
  return {
    organizationId,
    framework,
    report,
    status: 'generated',
    message: 'Compliance report generated successfully'
  }
}