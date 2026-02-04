
# Plan: Enhanced Magic Link Flow with Login Confirmation

## Overview
Improve the magic link authentication flow to give users a choice after clicking the link: either continue directly to the app OR change their password first. Also add a proper password reset page for the forgot password flow.

## Current Issues
1. **Missing Reset Password Page**: `/reset-password` route doesn't exist, but `ForgotPassword.tsx` redirects there
2. **No User Choice After Magic Link**: Currently auto-redirects to `/feed` without options
3. **Password Recovery Not Handled**: Supabase `PASSWORD_RECOVERY` event isn't distinguished from regular magic link

## Implementation Steps

### Step 1: Create Reset Password Page
Create a new page `src/pages/ResetPassword.tsx` that:
- Detects if user came from a password reset link (via Supabase session event)
- Shows password reset form with new password + confirm password fields
- Validates password strength
- Updates password via `supabase.auth.updateUser({ password })`
- Redirects to feed after success

### Step 2: Update AuthCallback with Login Confirmation
Modify `src/pages/AuthCallback.tsx` to:
- Add a new status: `'confirmation'` 
- After successful token verification, show a confirmation dialog instead of auto-redirect
- Dialog offers two buttons:
  - **"Continue to POST UP"** → Navigate to `/feed`
  - **"Change Password"** → Navigate to `/reset-password` with session intact
- Detect `PASSWORD_RECOVERY` type and auto-redirect to password change

### Step 3: Add Route for Reset Password
Update `src/App.tsx` to:
- Import and lazy-load the new `ResetPassword` component
- Add route: `<Route path="/reset-password" element={<ResetPassword />} />`

## File Changes

### New Files:
| File | Description |
|------|-------------|
| `src/pages/ResetPassword.tsx` | Password reset form page |

### Modified Files:
| File | Changes |
|------|---------|
| `src/pages/AuthCallback.tsx` | Add confirmation dialog with "Continue" and "Change Password" options |
| `src/App.tsx` | Add `/reset-password` route |

## Technical Details

### ResetPassword.tsx
```text
┌─────────────────────────────────────────┐
│            Reset Password               │
├─────────────────────────────────────────┤
│                                         │
│  [Lock Icon]                            │
│                                         │
│  Create a new password                  │
│                                         │
│  New Password:      [••••••••••]        │
│  Confirm Password:  [••••••••••]        │
│                                         │
│  Password requirements:                 │
│  ✓ At least 8 characters               │
│  ✓ Contains number or symbol           │
│                                         │
│  [    Update Password    ]              │
│                                         │
│  Skip for now                           │
│                                         │
└─────────────────────────────────────────┘
```

### AuthCallback Confirmation Dialog
```text
┌─────────────────────────────────────────┐
│         ✓ Successfully Signed In        │
├─────────────────────────────────────────┤
│                                         │
│  Welcome back! What would you like      │
│  to do?                                 │
│                                         │
│  [  Continue to POST UP  ]  (primary)   │
│                                         │
│  [  Change Password      ]  (outline)   │
│                                         │
└─────────────────────────────────────────┘
```

### Auth Flow Diagram
```text
User clicks magic link in email
         │
         ▼
   /auth/callback
         │
         ├─── Token invalid/expired? ──► Show error + retry option
         │
         ├─── Password recovery type? ──► Redirect to /reset-password
         │
         ▼
   Show confirmation dialog
         │
         ├─── "Continue to POST UP" ──► /feed
         │
         └─── "Change Password" ──► /reset-password
```

## Validation
After implementation:
1. Test magic link flow end-to-end
2. Verify confirmation dialog appears after clicking magic link
3. Test "Continue" button goes to feed
4. Test "Change Password" button goes to reset form
5. Test password reset form updates password successfully
6. Test forgot password flow redirects to reset page correctly
