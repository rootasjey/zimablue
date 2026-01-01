import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core'

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('user'),
  biography: text('biography').default(''),
  job: text('job').default(''),
  language: text('language').default('en'),
  location: text('location').default(''),
  socials: text('socials').default('[]'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: uniqueIndex('idx_users_email').on(table.email),
  nameIdx: uniqueIndex('idx_users_name').on(table.name),
}))

// Images table
export const images = sqliteTable('images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  i: integer('i').generatedAlwaysAs(sql`id`),
  name: text('name').notNull(),
  description: text('description').default(''),
  pathname: text('pathname').notNull(),
  slug: text('slug').notNull().unique(),
  w: integer('w').notNull().default(6),
  h: integer('h').notNull().default(6),
  x: integer('x').notNull().default(0),
  y: integer('y').notNull().default(0),
  sum: integer('sum').generatedAlwaysAs(sql`x + y`),
  sumAbs: integer('sum_abs').generatedAlwaysAs(sql`ABS(x) + ABS(y)`),
  statsViews: integer('stats_views').notNull().default(0),
  statsDownloads: integer('stats_downloads').notNull().default(0),
  statsLikes: integer('stats_likes').notNull().default(0),
  variants: text('variants').default('[]'),
  userId: integer('user_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  slugIdx: uniqueIndex('idx_images_slug').on(table.slug),
}))

// Tags table (normalized tags system)
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description').default(''),
  color: text('color').default('#3B82F6'),
  usageCount: integer('usage_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  nameIdx: index('idx_tags_name').on(table.name),
  slugIdx: index('idx_tags_slug').on(table.slug),
  usageCountIdx: index('idx_tags_usage_count').on(table.usageCount),
  createdAtIdx: index('idx_tags_created_at').on(table.createdAt),
}))

// Image Tags junction table
export const imageTags = sqliteTable('image_tags', {
  imageId: integer('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  pk: index('image_tags_pk').on(table.imageId, table.tagId),
  imageIdIdx: index('idx_image_tags_image_id').on(table.imageId),
  tagIdIdx: index('idx_image_tags_tag_id').on(table.tagId),
  createdAtIdx: index('idx_image_tags_created_at').on(table.createdAt),
  tagImageIdx: index('idx_image_tags_tag_image').on(table.tagId, table.imageId),
}))

// Collections table
export const collections = sqliteTable('collections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').default(''),
  isPublic: integer('is_public', { mode: 'boolean' }).default(true),
  coverImageId: integer('cover_image_id').references(() => images.id, { onDelete: 'set null' }),
  statsViews: integer('stats_views').notNull().default(0),
  statsDownloads: integer('stats_downloads').notNull().default(0),
  statsLikes: integer('stats_likes').notNull().default(0),
  userId: integer('user_id').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  slugIdx: uniqueIndex('idx_collections_slug').on(table.slug),
}))

// Collection Images junction table
export const collectionImages = sqliteTable('collection_images', {
  collectionId: integer('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  imageId: integer('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
  addedAt: integer('added_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  pk: index('collection_images_pk').on(table.collectionId, table.imageId),
  collectionIdIdx: index('idx_collection_images_collection_id').on(table.collectionId),
  imageIdIdx: index('idx_collection_images_image_id').on(table.imageId),
  positionIdx: index('idx_collection_images_position').on(table.collectionId, table.position),
}))

// Messages table
export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  senderEmail: text('sender_email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  read: integer('read', { mode: 'boolean' }).default(false),
  readAt: integer('read_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  readIdx: index('idx_messages_read').on(table.read),
  readCreatedAtIdx: index('idx_messages_read_created_at').on(table.read, table.createdAt),
}))

// Todos table
export const todos = sqliteTable('todos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').default(''),
  dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
  status: text('status', { enum: ['pending', 'in_progress', 'completed'] }).notNull().default('pending'),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).notNull().default('medium'),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index('idx_todos_user_id').on(table.userId),
  dueDateIdx: index('idx_todos_due_date').on(table.dueDate),
  statusIdx: index('idx_todos_status').on(table.status),
  priorityIdx: index('idx_todos_priority').on(table.priority),
  createdAtIdx: index('idx_todos_created_at').on(table.createdAt),
}))

// Export schema for Drizzle
export const schema = {
  users,
  images,
  tags,
  imageTags,
  collections,
  collectionImages,
  messages,
  todos,
}
