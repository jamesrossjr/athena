# ADR-001: Database Choice - PostgreSQL vs MongoDB

**Status**: Accepted  
**Date**: August 2025  
**Deciders**: Engineering Team  

## Context and Problem Statement

Athena requires a database that can handle:
- Complex relational data (pages, blocks, links, users)
- JSONB/document storage for flexible content
- Full-text search capabilities
- Real-time collaboration requirements
- Future scalability needs

We need to choose between PostgreSQL (relational) and MongoDB (document-based) as our primary database.

## Decision Drivers

- **Data Integrity**: ACID compliance for collaborative editing
- **Query Flexibility**: Complex joins and aggregations needed
- **JSON Support**: Native support for flexible content storage
- **Full-text Search**: Built-in search capabilities
- **Ecosystem**: Tooling, monitoring, and expertise availability
- **Performance**: Query performance for complex operations
- **Scalability**: Horizontal scaling capabilities

## Considered Options

### Option A: PostgreSQL
- Relational database with excellent JSONB support
- ACID compliance and strong consistency
- Rich query capabilities with SQL
- Built-in full-text search
- Mature ecosystem and tooling

### Option B: MongoDB
- Document-oriented database
- Flexible schema design
- Built-in sharding capabilities
- Native JSON storage
- Good for rapid prototyping

## Decision Outcome

**Chosen option: PostgreSQL**

### Rationale

1. **Data Integrity**: ACID compliance is crucial for collaborative editing where multiple users modify the same content simultaneously.

2. **Query Complexity**: Our linking system requires complex joins between pages, blocks, and links that are easier to express and optimize in SQL.

3. **JSONB Support**: PostgreSQL's JSONB provides the flexibility of document storage while maintaining relational capabilities.

4. **Full-text Search**: Built-in full-text search with GIN indexes provides good performance without additional infrastructure.

5. **Ecosystem Maturity**: Better tooling, monitoring solutions, and developer expertise available.

6. **Future Scalability**: While MongoDB has better built-in sharding, PostgreSQL's read replicas and modern sharding solutions (Citus) provide adequate scalability for our needs.

### Implementation Details

```sql
-- Example schema design leveraging PostgreSQL strengths
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  type TEXT CHECK (type IN ('document', 'database', 'whiteboard', 'kanban')),
  title TEXT NOT NULL,
  content JSONB DEFAULT '[]', -- Flexible content storage
  metadata JSONB DEFAULT '{}',
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || coalesce(content::text, ''))
  ) STORED,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX idx_pages_search ON pages USING GIN (search_vector);

-- JSONB indexes for metadata queries
CREATE INDEX idx_pages_metadata ON pages USING GIN (metadata);
```

## Positive Consequences

- Strong data consistency for collaborative features
- Excellent tooling and monitoring ecosystem
- Familiar SQL interface for complex queries
- JSONB provides document flexibility when needed
- Built-in full-text search reduces infrastructure complexity

## Negative Consequences

- More complex schema changes compared to MongoDB
- Horizontal scaling requires additional planning
- JSON querying syntax less intuitive than MongoDB's
- Potential performance overhead for very large JSON documents

## Compliance

This decision supports our technical requirements:
- Real-time collaboration (ACID compliance)
- Complex linking system (relational queries)
- Flexible content storage (JSONB)
- Search functionality (built-in full-text search)

## Follow-up Actions

1. Set up PostgreSQL with optimized configuration
2. Implement database migration strategy using Prisma
3. Create monitoring and backup procedures
4. Plan for future scaling (read replicas, connection pooling)
5. Establish data retention and archival policies

---

**Related ADRs**
- [ADR-002: Real-time Technology](./002-realtime-technology.md)
- [ADR-005: Search Implementation](./005-search-implementation.md)