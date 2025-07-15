# Admin Dashboard

A comprehensive admin dashboard for managing the core entities in the Zima Blue application.

## Features

### 🏠 Dashboard Overview
- **Statistics Cards**: Total users, images, collections, and unread messages
- **Detailed Stats**: User statistics, content statistics with views/downloads/likes
- **Quick Actions**: Direct links to manage different entity types

### 👥 User Management (`/admin/users`)
- **CRUD Operations**: Create, read, update, and delete users
- **Search & Filter**: Search by name, email, job, location
- **Role Management**: Promote/demote users between admin and regular user roles
- **Bulk Actions**: Promote multiple users to admin or demote to regular users
- **Safety Features**: Prevent deletion of last admin user and self-deletion

### 🖼️ Image Management (`/admin/images`)
- **View Images**: Thumbnail previews with image details
- **Owner Information**: See which user uploaded each image
- **Statistics**: Views, downloads, and likes for each image
- **Image Preview**: Full-size image preview in modal
- **Direct Links**: Quick access to public image pages
- **Bulk Operations**: Delete multiple images at once

### 📁 Collection Management (`/admin/collections`)
- **Collection Overview**: Name, description, and visibility status
- **Owner Information**: See which user created each collection
- **Image Count**: Number of images in each collection
- **Statistics**: Views, downloads, and likes for each collection
- **Visibility Control**: Make collections public or private
- **Bulk Operations**: Change visibility or delete multiple collections

### 📧 Message Management (`/admin/messages`)
- **Enhanced Interface**: Updated to use the new admin layout
- **Unread Badge**: Sidebar shows unread message count
- **All Existing Features**: Search, filter, bulk actions, mark as read/unread

## Technical Implementation

### Architecture
- **Sidebar Navigation**: Consistent navigation across all admin pages
- **Reusable Components**: AdminTable, AdminStatsCard, AdminSidebar
- **Type Safety**: Full TypeScript support with proper type definitions
- **API Endpoints**: RESTful admin API endpoints with proper authentication

### Components
- `AdminSidebar.vue`: Left navigation sidebar with entity links
- `AdminStatsCard.vue`: Reusable statistics display cards
- `AdminTable.vue`: Feature-rich table component with search, pagination, and bulk actions

### API Endpoints
- `GET /api/admin/stats`: Dashboard statistics
- `GET /api/admin/users`: List users with pagination and search
- `PATCH /api/admin/users/[id]`: Update user information
- `DELETE /api/admin/users/[id]`: Delete user (with safety checks)
- `GET /api/admin/images`: List images with owner information
- `DELETE /api/admin/images/[id]`: Delete image
- `GET /api/admin/collections`: List collections with statistics
- `DELETE /api/admin/collections/[id]`: Delete collection

### Security Features
- **Admin-only Access**: All admin routes require admin role
- **Authentication Middleware**: Proper session validation
- **Safety Checks**: Prevent dangerous operations (e.g., deleting last admin)
- **Input Validation**: Proper validation of all user inputs

### UI/UX Features
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Consistent with application theme
- **Loading States**: Proper loading indicators for all operations
- **Error Handling**: User-friendly error messages and toast notifications
- **Confirmation Dialogs**: Uses UnaUI Dialog component to prevent accidental deletions
- **Modal Interactions**: Edit forms and detail views in accessible dialog overlays

## Usage

### Accessing the Admin Dashboard
1. Log in as a user with admin role
2. Navigate to `/admin` to see the dashboard overview
3. Use the sidebar to navigate between different management sections

### Managing Users
1. Go to `/admin/users`
2. Use the search bar to find specific users
3. Click the edit button to modify user information
4. Use bulk actions to promote/demote multiple users
5. Delete users with the delete button (safety checks apply)

### Managing Images
1. Go to `/admin/images`
2. View image thumbnails and statistics
3. Click on an image to see full details
4. Use the "View Public Page" button to see how it appears to users
5. Delete images that violate policies

### Managing Collections
1. Go to `/admin/collections`
2. See collection details including image count and statistics
3. Change visibility between public and private
4. Delete collections that are no longer needed

### Managing Messages
1. Go to `/admin/messages`
2. See unread count in the sidebar badge
3. Use existing message management features

## Development

### Adding New Entity Types
1. Create type definitions in `types/`
2. Add API endpoints in `server/api/admin/`
3. Create management page in `pages/admin/`
4. Add navigation link to `AdminSidebar.vue`
5. Update dashboard stats if needed

### Customizing the Table Component
The `AdminTable.vue` component supports:
- Custom column definitions
- Custom cell renderers via slots
- Bulk action definitions
- Search and pagination
- Loading and empty states

### Extending Statistics
Add new statistics to the dashboard by:
1. Updating the `AdminStats` type in `types/admin.d.ts`
2. Modifying the `/api/admin/stats` endpoint
3. Adding new stat cards to the dashboard page

## Security Considerations

- All admin endpoints validate user authentication and admin role
- Sensitive operations (like user deletion) have additional safety checks
- Input validation prevents SQL injection and other attacks
- Proper error handling prevents information leakage
- Session management ensures secure access control

## Future Enhancements

- **Audit Logs**: Track admin actions for accountability
- **Advanced Filtering**: More sophisticated search and filter options
- **Export Features**: Export data to CSV/Excel formats
- **Batch Import**: Import users or content in bulk
- **Analytics Dashboard**: More detailed analytics and reporting
- **Role-based Permissions**: More granular permission system
