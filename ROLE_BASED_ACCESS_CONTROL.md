# Role-Based Access Control Implementation

## Overview
This document explains how to use the role-based access control system that has been implemented in the application.

## How It Works

The role-based access control system uses two approaches:

1. **Restricted Roles** - List of roles that CANNOT access a route
2. **Allowed Roles** - List of roles that CAN access a route

## Available Roles

The application currently supports these roles (stored in localStorage as "roles"):
- `ROLE_SUPER_ADMIN` - Admin users with full access
- `ROLE_READ_ONLY` - Read-only users (can view but not edit)
- `ROLE_READ_WRITE` - Read-write users (can view and edit)

## Implementation Details

### 1. Routes Configuration (src/routes.js)

#### Example 1: Restricting Access (Brands Route)
```javascript
{
  path: "/brands",
  name: "Brands",
  icon: "fa fa-shield",
  component: BrandList,
  layout: "/admin",
  showInSidebar: true,
  // Restrict access to read-only and read-write users
  restrictedRoles: ["ROLE_READ_ONLY", "ROLE_READ_WRITE"],
  restrictedMessage: "You do not have permission to access this page",
}
```

This route **CANNOT** be accessed by:
- Users with `ROLE_READ_ONLY`
- Users with `ROLE_READ_WRITE`

**Only accessible by**: Users with `ROLE_SUPER_ADMIN`

#### Example 2: Allowing Specific Roles (Groups/GroupList Route)
```javascript
{
  path: "/grouplist",
  name: "Groups",
  icon: "fa fa-bars brandicon",
  component: GroupList,
  layout: "/admin",
  showInSidebar: false,
  showOnBrandDetail: true,
  // Only allow read-only and read-write users
  allowedRoles: ["ROLE_READ_ONLY", "ROLE_READ_WRITE"],
}
```

This route **CAN** only be accessed by:
- Users with `ROLE_READ_ONLY`
- Users with `ROLE_READ_WRITE`

**NOT accessible by**: Users with `ROLE_SUPER_ADMIN` (unless they also have one of the allowed roles)

## Files Modified

1. **src/routes.js**
   - Added `restrictedRoles` to `/brands` route
   - Added `allowedRoles` to `/grouplist` routes

2. **src/index.js**
   - Imported `getUserRoles` from roleHelper
   - Imported `ProtectedRoute` component
   - Modified `getRoutes()` function to check for role restrictions

3. **src/components/Sidebar/Sidebar.jsx**
   - Imported `getUserRoles` from roleHelper
   - Updated route filtering logic to respect `restrictedRoles` and `allowedRoles`

4. **src/components/ProtectedRoute.jsx** (NEW FILE)
   - Created protective route component for future use

## How to Add Role-Based Access to New Routes

### Option 1: Restrict Certain Roles
```javascript
{
  path: "/new-page",
  name: "New Page",
  icon: "fa fa-icon",
  component: NewPageComponent,
  layout: "/admin",
  showInSidebar: true,
  // These roles CANNOT access this route
  restrictedRoles: ["ROLE_READ_ONLY"],
}
```

### Option 2: Allow Only Specific Roles
```javascript
{
  path: "/admin-only",
  name: "Admin Only Page",
  icon: "fa fa-icon",
  component: AdminOnlyComponent,
  layout: "/admin",
  showInSidebar: true,
  // Only these roles CAN access this route
  allowedRoles: ["ROLE_SUPER_ADMIN"],
}
```

### Option 3: Multiple Roles
```javascript
{
  path: "/manager-page",
  name: "Manager Page",
  icon: "fa fa-icon",
  component: ManagerComponent,
  layout: "/admin",
  showInSidebar: true,
  // Only managers and admins can access
  allowedRoles: ["ROLE_SUPER_ADMIN", "ROLE_READ_WRITE"],
}
```

## Access Control Layers

The access control is enforced at three levels:

1. **Route Rendering** (src/index.js) - Routes are not rendered for unauthorized users
2. **Sidebar Visibility** (src/components/Sidebar/Sidebar.jsx) - Menu items are hidden for unauthorized users
3. **ProtectedRoute Component** (src/components/ProtectedRoute.jsx) - Can be used for additional protection if needed

## Testing Role-Based Access

To test the role restrictions:

1. User with `ROLE_READ_ONLY` or `ROLE_READ_WRITE` tries to access `/admin/brands`
   - Should be redirected or see an error
   - Route should not appear in sidebar

2. User with `ROLE_READ_ONLY` or `ROLE_READ_WRITE` tries to access `/admin/grouplist`
   - Should have full access
   - Route should be available in sidebar

3. User with `ROLE_SUPER_ADMIN` tries to access `/admin/brands`
   - Should have access (no restrictions)
   - Route should be in sidebar

## Role Helper Functions

The following functions are available in `src/utils/roleHelper.js`:

- `getUserRoles()` - Returns array of user's roles from localStorage
- `isSuperAdmin()` - Returns true if user is a Super Admin
- `isReadOnly()` - Returns true if user has read-only role
- `isReadWrite()` - Returns true if user has read-write role
- `canCreateItems()` - Returns false if user is read-only
- `hasWritePermission()` - Returns true if user can write

## Important Notes

- Roles are stored in localStorage under the key "roles"
- Roles must match exactly (case-sensitive)
- If a route has BOTH `restrictedRoles` and `allowedRoles`, `restricatedRoles` takes precedence
- Routes without role specifications are accessible to all authenticated users
