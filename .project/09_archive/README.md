# Archive Directory

This directory contains unused components and pages that have been removed from the active codebase but preserved for potential future reference or restoration.

## Archive Date: 2025-01-10

## Reason for Archiving
These components and pages were identified as unused in the current implementation of the ATHENA digital paper application. They were moved here to:
- Reduce codebase complexity
- Improve build times
- Maintain cleaner project structure
- Preserve code for potential future use

## Archived Components

### UI Components
- **AIAssistant.vue** - AI assistant chat interface component
- **AppBreadcrumb.vue** - Breadcrumb navigation component
- **AppSearch.vue** - Global search component
- **AppSidebar.vue** - Application sidebar navigation
- **AppUserMenu.vue** - User profile dropdown menu
- **ChatInterface.vue** - Chat/messaging interface
- **CommandPalette.vue** - Command palette for quick actions
- **GraphView.vue** - Graph/network visualization component
- **NoteEditor.vue** - Simple note editing component
- **VaultBrowser.vue** - File vault browser interface
- **Tab.vue** - Individual tab component
- **TabBar.vue** - Tab bar navigation component
- **WorkspaceContainer.vue** - Workspace management container

### Block Components
- **blocks/CodeBlock.vue** - Code block with syntax highlighting
- **blocks/DividerBlock.vue** - Visual divider block
- **blocks/QuoteBlock.vue** - Quote/blockquote component
- **blocks/TextBlock.vue** - Basic text block
- **blocks/TodoBlock.vue** - Todo/checklist block

## Archived Pages

### Feature Pages
- **briefings/** - Briefings management page
- **chat/** - Chat application page
- **projects/** - Projects management page
- **vault/** - Document vault page

### Test Pages
- **test-login.vue** - Login testing page

## Active Components (Still in Use)

The following components remain active in the application:
- PaperInterface.vue (main interface)
- DocumentRenderer.vue
- PageEditor.vue
- TableEditor.vue
- DatabaseEditor.vue
- WhiteboardEditor.vue
- PdfViewer.vue
- PdfImporter.vue
- TileLayout.vue
- TilePane.vue
- blocks/Page/
- blocks/Table/
- blocks/Database/
- blocks/Whiteboard/
- blocks/PDFViewer/

## Restoration Instructions

To restore any archived component:

1. Move the component back to its original location:
```bash
# For components
mv .project/09_archive/components/[ComponentName].vue components/

# For pages
mv .project/09_archive/pages/[PageName] pages/
```

2. Update any import statements that reference the component

3. Test the component to ensure it still works with current dependencies

## Dependencies to Consider

Some archived components may have dependencies on:
- Vuex/Pinia stores that may have changed
- API endpoints that may no longer exist
- CSS classes that may have been removed
- npm packages that may need to be reinstalled

## Notes

- These components were functional at the time of archiving
- Some components may need updates to work with the current codebase
- Consider refactoring before restoration to match current patterns
- Delete permanently if not needed after 6 months

## Archive Log

### 2025-01-10
- Initial archive creation
- Moved 18 components and 5 pages
- Reason: Streamlining codebase for digital paper focus