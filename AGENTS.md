You are an experienced, pragmatic software engineering AI agent. Do not over-engineer a solution when a simple one is possible. Keep edits minimal. If you want an exception to ANY rule, you MUST stop and get permission first.

# AGENTS.md — Zima Blue

## Project Overview

**Zima Blue** (`zimablue`) is a handmade illustration gallery web app. It lets an artist upload, organize, and showcase illustrations in a draggable/resizable grid. Visitors can browse images, explore collections, and contact the artist. An admin dashboard provides content management (images, collections, tags, users, messages, todos, analytics).

**Goals:** Personal portfolio + public gallery, deployed globally at the edge.

### Technology Stack

| Layer | Choice |
|---|---|
| Framework | [Nuxt.js 4](https://nuxt.com/) (SSR-first) |
| UI library | [UnaUI](https://unaui.com/) — components registered with the `N` prefix (e.g. `NButton`, `NDialog`) |
| CSS engine | [UnoCSS](https://unocss.dev/) with `presetWind3`, `presetAttributify`, icons, web fonts |
| State mgmt | [Pinia](https://pinia.vuejs.org/) |
| Language | TypeScript (strict via `vue-tsc`) |
| Database | Cloudflare D1 (SQLite) via [Drizzle ORM](https://orm.drizzle.team/) |
| File storage | Cloudflare R2 (blob) via custom `hubblob` provider |
| KV / Cache | Cloudflare KV + Cache |
| Deployment | Cloudflare Workers (edge) via [Wrangler](https://developers.cloudflare.com/workers/wrangler/) + [NuxtHub](https://hub.nuxt.com/) |
| Image proc. | [Jimp](https://github.com/jimp-dev/jimp) (server-side; creates 6 variants) |
| Grid layout | [grid-layout-plus](https://github.com/gwinnem/vue-grid-layout) |
| Package mgr | `bun` (lockfile: `bun.lock`) |

---

## Reference

### Directory Structure

```
app/
  app.vue                  # Root Vue app shell
  components/              # Vue components, organized by feature
    admin/                 # Admin-only components
    adminMessage/          # Message management UI
    collection/            # Collection UI
    image/                 # Image grid, modal, upload, selection
    mobile/                # Mobile-specific components
    search/                # Global search components
    user/                  # User profile / auth components
  composables/             # Reusable logic with reactive state
    image/                 # useImageUpload, useImageModal, useImageActions, etc.
    collection/            # useCollectionActions, useAddToCollectionModal
    useAppSettings.ts      # App-wide settings
    useGlobalSearch.ts
    useNavigation.ts
    usePageHeader.ts
  layouts/
    default.vue            # Public layout
    admin.vue              # Admin dashboard layout
  middleware/
    authenticated.ts       # Redirect unauthenticated users
    admin.ts               # Restrict non-admin access
  pages/                   # File-based routing (Nuxt convention)
    admin/                 # Protected admin pages
    collections/[slug].vue
    illustrations/[slug].vue
    index.vue              # Home gallery
  plugins/
    viewTransitions.client.ts  # View Transition API integration
  stores/                  # Pinia stores
    useCollectionStore.ts
    useCollectionDetailStore.ts
    useGlobalSearchStore.ts
    useGridStore.ts        # Grid positioning + layout save
    useUploadStore.ts

server/
  api/                     # Nitro API routes (REST, file-named by method)
    admin/                 # Admin-only endpoints
    images/                # Image CRUD + upload
    collections/           # Collection CRUD
    tags/                  # Tag management
    search/                # Global search
    contact/               # Contact form submission
    user/                  # User profile & stats
  db/
    schema.ts              # Drizzle ORM schema (single source of truth)
    migrations/            # SQL migration files
  routes/
    images/[...pathname].get.ts  # Blob proxy route
  utils/
    auth.ts                # isAdminSession() helper
    case.ts                # String case utilities

shared/
  types/                   # TypeScript type definitions shared by client + server

styles/
  main.css                 # Global styles
  arrow-link.css           # Arrow link animation

providers/
  hubblob.ts               # Custom @nuxt/image provider for Cloudflare R2

scripts/
  bump-version.mjs         # Bump package.json version (patch/fix/minor/major)
  tag-version.mjs          # Create a git version tag
  rename-una-prefix.js     # One-off: migrate UnaUI U* → N* prefix

docs/
  ADMIN_DASHBOARD.md       # Admin feature documentation
  TAGS_SYSTEM.md           # Normalized tag system documentation
  AUDIT_REPORT.md          # Design audit findings and recommendations

CLAUDE.md                  # Design context, brand personality, and design principles
```

### Architecture Notes

- **API route naming**: `[id].get.ts`, `[id].patch.ts`, `[id].delete.ts`, `bulk-delete.post.ts` — Nitro picks up the HTTP method from the file suffix.
- **Auth**: `nuxt-auth-utils` provides `useUserSession()` on the client and `requireUserSession(event)` on the server. Admin checks use `isAdminSession()` from `server/utils/auth.ts`.
- **Database**: All schema lives in `server/db/schema.ts`. Use Drizzle ORM for all queries — do not write raw SQL in route handlers unless absolutely necessary.
- **Image variants**: Upload creates 6 sizes — `xxs`, `xs`, `sm`, `md`, `lg`, `original` — stored as a JSON array in `images.variants`.
- **Grid positioning**: `images.x`, `images.y`, `images.w`, `images.h` columns. Saved via `useGridStore.saveLayout()` → `POST /api/grid/save`.
- **UnaUI prefix**: All UnaUI components use the `N` prefix (`NButton`, `NInput`, `NDialog`, etc.). Do **not** use `UButton` or other prefixes.

---

## Essential Commands

All commands use `bun` as the package manager (or `npm` — both work).

```bash
# Development server (with NuxtHub remote bindings)
bun run dev

# Production build
bun run build

# Preview production build locally
bun run preview

# Generate static site
bun run generate

# Type-check (vue-tsc + nuxt typecheck)
bun run typecheck

# Re-generate .nuxt type stubs after config changes
bun run postinstall   # alias: nuxt prepare

# Deploy to Cloudflare Workers via Wrangler / NuxtHub
bun run deploy        # (if configured in nuxt.config hub block)
```

**Version management scripts:**
```bash
bun run bump:version  # bump patch
bun run bump:fix      # bump fix (same as patch)
bun run bump:minor    # bump minor
bun run bump:major    # bump major
bun run version       # create git tag for current version
```

> There is no dedicated `lint` or `format` script in `package.json`. Run `nuxt typecheck` for type safety checks. Add a linter (e.g., ESLint + `@nuxt/eslint`) before shipping if needed.

---

## Patterns

### Composable pattern
All complex UI logic lives in composables that return reactive state and methods. Do not put logic directly in `<script setup>` of pages.

```typescript
// ✅ Correct: logic in a composable
const { selectedImages, toggleImage } = useHomeMultiSelect()

// ❌ Avoid: inline reactive logic in page components
const selectedImages = ref<number[]>([])
```

### API route — auth check
```typescript
// Public route: no check needed
// Authenticated route:
const session = await requireUserSession(event)

// Admin-only route:
const session = await requireUserSession(event)
if (!isAdminSession(session)) {
  throw createError({ statusCode: 403, message: 'Forbidden' })
}
```

### Dialog state — v-model pattern
```vue
<!-- ✅ Correct -->
<ImageDeleteDialog v-model:is-open="showDeleteDialog" :image="selectedImage" />

<!-- ❌ Avoid :open / @update:open splits -->
```

### Dialog layout safety
- Always test dialogs and command palettes for overflow at desktop and mobile widths.
- Reserve space for UnaUI close buttons and trailing keyboard hints so header controls do not collide or spill outside the dialog.
- Prefer wrapping secondary meta rows instead of forcing single-line header layouts when dialogs contain badges, shortcuts, or status hints.

### Image component events
Standard events emitted by image grid components:
- `@image-click` — open modal
- `@image-toggle` — toggle selection
- `@enter-selection-mode` — activate multi-select

### Nested component auto-imports
- Components inside any nested folder under `app/components/` should be referenced with the folder name in PascalCase as a prefix in templates, for example `app/components/image/HomeGridLoadingState.vue` is used as `ImageHomeGridLoadingState`.
- If the component is imported explicitly in the script section, use the local import name instead of the auto-import prefix.
- Keep the generated auto-import tag aligned with the folder name so Nuxt resolves the component consistently.

### UnoCSS shortcuts
Custom UnoCSS shortcuts are defined in `unocss.config.ts`:
- `btn-glowing` — primary gradient button
- `btn-glowing-outline` — outlined primary button
- `dp-menu-trigger` — floating action trigger on image cards
- `image-resizer-container` / `image-resizer` — grid resize handle

### Database migration workflow
1. Update `server/db/schema.ts` with your changes.
2. Write a new `.sql` migration file in `server/db/migrations/` (e.g., `004_add_feature.sql`).
3. Apply the migration via NuxtHub dashboard or Wrangler D1 CLI:
   ```bash
   wrangler d1 execute zimablue --file=server/db/migrations/004_add_feature.sql
   ```
4. Commit both `schema.ts` and the migration file together.

### View transitions
Images use the View Transition API for smooth navigation:
```vue
<img :style="{ viewTransitionName: `shared-image-${item.id}` }" />
```

---

## Anti-patterns

- **Don't use UnaUI's `U*` prefix** — it was migrated to `N*`. Any `UButton`, `UDialog`, etc. are wrong; use `NButton`, `NDialog`.
- **Don't write raw SQL in route handlers** — use Drizzle ORM via `hubDatabase()`. Raw SQL belongs only in migration files.
- **Don't store tags as JSON in the image row** — the tag system was migrated to a normalized relational structure (`tags` + `image_tags` junction table). Do not revert to a JSON column.
- **Don't inline complex state logic in pages** — use composables; keep pages thin.
- **Don't commit `.env`** — secrets (`NUXT_SESSION_PASSWORD`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`) stay local. Use `.env.example` as the template.
- **Don't skip the `requireUserSession` check** on protected API routes — all `/api/admin/*` endpoints must verify the session and admin role.
- **Don't show success toasts for uploads** — upload success is visually obvious via the progress widget and UI state changes. Only toast errors (failures, invalid files, auth issues). Success notifications are noise.

---

## Code Style

- **TypeScript everywhere**: `strict` mode via vue-tsc. Avoid `any`; use proper types from `shared/types/`.
- **Responsive**: mobile-first with UnoCSS `sm:` breakpoints. Mobile grid is fixed 3-column; desktop grid is draggable.
- **Naming**: composables → `use<FeatureName>`, stores → `use<Name>Store`, components → `PascalCase` grouped by feature folder.
- Follow the existing Nuxt 4 `app/` directory convention — all frontend code lives under `app/`.
- **Design context**: Consult `CLAUDE.md` for brand personality, aesthetic direction, and design principles before making visual changes.
- Follow existing patterns in the codebase for consistency.

---

## Commit and Pull Request Guidelines

### Before committing
1. Run `bun run typecheck` — fix all type errors.
2. Manually test the affected feature in `bun run dev`.
3. If you changed the DB schema, ensure a corresponding migration file exists.

### Commit message conventions
Follow the **gitmoji + conventional commits** hybrid observed in the git history:

```
<gitmoji> <type>(<scope>): <short description>

✨ feat(image): add bulk tag assignment
🚑 fix(auth): handle missing session gracefully
♻️ refactor(grid): extract layout save to store
🔧 chore: upgrade nuxt to 4.x
📝 docs: update AGENTS.md
```

Common gitmojis used in this repo:
- `✨` feat  `🚑` fix  `♻️` refactor  `🔥` remove  `🔧` chore/build  `📝` docs

### Version Bump Rules

Update the version in `package.json` for every commit, using the appropriate script:

| Change type | Script | Example |
|---|---|---|
| Bug fix, internal optimization, or refactor without visible UX impact | `bun run bump:version` (patch) | `0.21.0` → `0.21.1` |
| User-visible feature or significant UX improvement | `bun run bump:minor` | `0.21.0` → `0.22.0` |
| Major architectural change, breaking change, or visual overhaul | `bun run bump:major` | `0.21.0` → `1.0.0` |

**Quick decision rule:**
- If the user sees a new feature or a notable UX improvement → **minor**
- If it is a fix, performance optimization, or internal refactor → **patch**
- If the API, DB schema, or UI changes incompatibly → **major**

Prefer committing the version bump separately, immediately after the functional commit:
```bash
bun run bump:version   # or bump:minor / bump:major
git add package.json
git commit -m "🔧 chore: bump version to X.Y.Z"
```

### Pull requests
- Describe **what** changed and **why**.
- Reference any related issue or design decision.
- Confirm `typecheck` passes before requesting review.
