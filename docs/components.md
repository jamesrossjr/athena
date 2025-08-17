# Athena Vue Component Inventory

| Component | Purpose | Props | Emits | Lazy‑Load |
|-----------|---------|-------|-------|-----------|
| AIChat.vue | Chat interface for interacting with AI assistants | – | `messageSent`, `error` | false |
| AsyncGraphVisualizer.vue | Visualizes graphs asynchronously, showing loading state | `graphData` (Object) | `loaded` | true |
| CommandPalette.vue | Global command palette for quick actions | `commands` (Array) | `select` | true |
| GraphVisualizer.vue | Renders interactive graphs synchronously | `data` (Array) | `nodeClicked`, `edgeClicked` | false |
| OnboardingTour.vue | Guided tour for new users | – | `stepChanged`, `completed` | false |
| accessibility/SkipLinks.vue | Provides skip‑link navigation for screen readers | – | – | false |
| ai/DigitalTwin.vue | Displays a digital twin avatar powered by AI | `profile` (Object) | `actionTriggered` | true |
| collaboration/CommentingSystem.vue | Full‑screen commenting overlay for documents | `documentId` (String) | `commentAdded`, `commentDeleted` | false |
| collaboration/CommentThread.vue | Renders a thread of comments | `comments` (Array) | `reply`, `edit`, `delete` | false |
| dashboard/MetricCard.vue | Shows a single KPI metric | `title` (String), `value` (Number) | – | false |
| dashboard/TeamDashboard.vue | Team‑level overview dashboard | – | – | false |
| editors/CollaborativeTextEditor.vue | Rich‑text editor with real‑time collaboration (Yjs) | `docId` (String) | `contentChanged` | false |
| editors/DatabaseEditor.vue | UI for editing database schemas | `schema` (Object) | `schemaSaved` | false |
| editors/TextEditor.vue | Simple plain‑text editor component | `value` (String) | `input` | false |
| editors/WhiteboardEditor.vue | Canvas for drawing and sketching collaboratively | – | `strokeAdded`, `clear` | false |
| governance/TrustCenter.vue | Displays security & compliance information | – | – | false |
| labs/ConversationalInterface.vue | Experimental UI for testing conversational AI | `prompt` (String) | `responseReceived` | true |
| labs/SpatialKnowledgeGraph.vue | Visualizes a spatial knowledge graph | `nodes` (Array), `edges` (Array) | `nodeSelected` | true |
| views/CalendarView.vue | Calendar view for scheduling | `events` (Array) | `dateSelected` | false |
| views/KanbanBoard.vue | Kanban board for task management | `columns` (Array) | `cardMoved` | false |
| views/KanbanColumn.vue | Single column within a Kanban board | `title` (String), `cards` (Array) | – | false |
| views/KanbanTask.vue | Individual task card in Kanban | `task` (Object) | `edit`, `delete` | false |
| views/TimelineView.vue | Timeline visualization of events | `items` (Array) | `itemClicked` | false |