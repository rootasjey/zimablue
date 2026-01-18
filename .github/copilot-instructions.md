# Zima Blue - AI Development Guide

This is a modern image gallery application built with Nuxt.js 4 and deployed on Cloudflare Workers.

## Architecture Overview

**Stack**: Nuxt 4 + UnaUI + UnoCSS + Cloudflare (D1, R2, KV, Workers)  
**Pattern**: SSR-first with progressive enhancement, composable-driven architecture

### Key Components
- **Grid System**: Draggable/resizable image grid using `grid-layout-plus` with persistent positioning in SQLite
- **Image Processing**: Server-side with Jimp, creates 6 variants (xxs, xs, sm, md, lg, original)
- **Multi-select**: Complex selection state management across grid and modals
- **Collections**: Many-to-many relationship system with junction tables

## Development Patterns

### File Organization
```
composables/           # Reusable logic with reactive state
├── image/            # Image-specific composables (upload, modal, actions)
├── collection/       # Collection management
stores/               # Pinia stores for shared state (grid, collections)
components/           # Vue components organized by feature
server/api/           # Nitro API routes following RESTful patterns
types/                # TypeScript definitions with normalized tag system
```

### Composable Pattern
All complex logic lives in composables that return reactive state and methods:
```typescript
// Pattern: useFeatureName() returns { state, methods, computed }
const imageUpload = useImageUpload()
const multiSelect = useHomeMultiSelect()
```

### API Routes Structure
- REST endpoints: `[id].get.ts`, `[id].patch.ts`, `[id].delete.ts`
- Bulk operations: `bulk-delete.post.ts`
- Auth required: Use `requireUserSession(event)` in handlers
- Admin only: Check `session.user.role === 'admin'`

### Database Patterns
- Generated columns: `i INTEGER GENERATED ALWAYS AS (id) STORED`
- Grid positioning: `x, y, w, h` columns with `sum` computed fields
- Junction tables: `collection_images` with position ordering
- Normalized tags: Recent migration from JSON to relational structure

### Authentication & Middleware
- `useUserSession()` for auth state (provided by `nuxt-auth-utils`)
- Route middleware: `authenticated.ts` and `admin.ts`
- Server-side: `requireUserSession(event)` for API protection

## Critical Workflows

### Image Upload Flow
1. Client validates file → calls `/api/images/upload.post.ts`
2. Server processes with Jimp → creates 6 variants → stores in R2
3. Database entry with grid position → updates reactive grid store
4. Progress tracking via `useUploadProgress` composable

### Multi-select Operations
- State managed by `useHomeMultiSelect` composable
- Selection persists across grid interactions and modal views
- Bulk operations (delete, add to collection) use dedicated API endpoints

### Grid Layout Management
- Uses `grid-layout-plus` for drag/resize functionality
- Position changes saved to database via `useGridStore.saveLayout()`
- Mobile: Fixed 3-column grid, Desktop: Dynamic draggable grid

## Component Conventions

### Props & Events
- Use `v-model:` pattern for dialog states: `v-model:is-open="showDialog"`
- Image components emit: `@image-click`, `@image-toggle`, `@enter-selection-mode`
- Bulk operations: Pass `selected-image-ids` arrays to dialog components

### Styling
- UnoCSS atomic classes with custom theme (purple primary)
- Responsive: Mobile-first with `sm:` breakpoints
- View transitions: `view-transition-name: shared-image-${item.id}`

## Integration Points

### Cloudflare Services
- **R2**: Image storage with custom `hubblob` provider
- **D1**: SQLite database with migrations in `server/db/migrations/`
- **KV**: Session storage (handled by nuxt-auth-utils)
- **Workers**: Edge deployment target

### External Dependencies
- **Jimp**: Server-side image processing (variants generation)
- **grid-layout-plus**: Draggable grid system
- **UnaUI**: Component library with accessibility focus — in this project UnaUI components are registered with the `N` prefix (e.g. `NButton`, `NDialog`).

## Data Flow Examples

### Image Selection Flow
```
User clicks → ImageGrid emits @image-toggle → useHomeMultiSelect.handleImageToggle() 
→ Updates selectedImagesMap → Triggers SelectionToolbar visibility → Bulk operations
```

### Collection Management
```
AddToCollectionModal → useAddToCollectionModal composable → /api/collections endpoint
→ Junction table insert → Grid store refresh → UI update
```

When working on this codebase, leverage the composable patterns, understand the grid positioning system, and follow the established API structure for new endpoints.
