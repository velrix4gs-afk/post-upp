

# Plan: Replace Magic Link with OTP Code-Based Login

## Overview
Replace the magic link authentication system with a **6-digit code verification system** for login. When a user wants to log in without a password, they enter their email, receive a code via email, enter the code on the website, and get logged in automatically.

## Current Problem
- Magic links redirect to Lovable's domain instead of your app
- Links don't work properly for logging users in

## Proposed Solution
Use the same OTP approach that already works for **signup** and apply it to **login**. The user enters their email, receives a 6-digit code, enters it on the website, and gets logged in directly.

## User Flow

```text
┌─────────────────────────────────────────┐
│           Sign In Page                  │
│                                         │
│  Email: [user@example.com]              │
│                                         │
│  [ Sign In with Code ] (replaces magic) │
│                                         │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│        Edge Function                    │
│   send-login-otp                        │
│                                         │
│  - Check if user exists                 │
│  - Generate 6-digit code                │
│  - Store in email_otps table            │
│  - Send email via Resend                │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│      Enter Code Page                    │
│   /auth/login-verify                    │
│                                         │
│  Enter the code we sent to your email   │
│                                         │
│      [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ][ 6 ]     │
│                                         │
│  [ Verify and Sign In ]                 │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│        Edge Function                    │
│   verify-login-otp                      │
│                                         │
│  - Validate code                        │
│  - Generate magic link token            │
│  - Return token for auto-login          │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│           Feed Page                     │
│        (User logged in!)                │
└─────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Create Edge Function for Login OTP
Create `supabase/functions/send-login-otp/index.ts`:
- Accept email parameter
- Check if user exists in auth.users (login only for existing accounts)
- Generate 6-digit OTP code
- Store in `email_otps` table with expiry
- Send email via Resend

### Step 2: Create Edge Function to Verify Login OTP
Create `supabase/functions/verify-login-otp/index.ts`:
- Accept email and code
- Validate OTP from database
- Generate a one-time login link using `supabase.auth.admin.generateLink()`
- Return the login URL/token to the frontend

### Step 3: Create Login Verification Page
Create `src/pages/LoginVerification.tsx`:
- Similar to EmailVerification.tsx but for login
- 6-digit OTP input
- Auto-submit when 6 digits entered
- Resend code option
- Call verify-login-otp edge function
- Use the returned token to complete login

### Step 4: Update Sign In Page
Modify `src/pages/SignIn.tsx`:
- Replace "Magic Link" section with "Sign In with Code"
- When form submitted, call `send-login-otp` edge function
- Navigate to `/auth/login-verify` with email in state
- Remove magic link logic

### Step 5: Add New Route
Update `src/App.tsx`:
- Add route for `/auth/login-verify` -> LoginVerification component

## File Changes Summary

### New Files
| File | Description |
|------|-------------|
| `supabase/functions/send-login-otp/index.ts` | Edge function to send login code |
| `supabase/functions/verify-login-otp/index.ts` | Edge function to verify code and generate session |
| `src/pages/LoginVerification.tsx` | OTP entry page for login |

### Modified Files
| File | Changes |
|------|---------|
| `src/pages/SignIn.tsx` | Replace magic link with "Sign in with code" flow |
| `src/App.tsx` | Add `/auth/login-verify` route |

## Technical Details

### send-login-otp Edge Function
- Uses service role to check if email exists in `auth.users`
- Returns generic message whether user exists or not (prevent enumeration)
- Same OTP generation logic as send-signup-otp
- Sends email via Resend API

### verify-login-otp Edge Function
- Validates OTP from `email_otps` table
- Uses `supabase.auth.admin.generateLink({ type: 'magiclink', email })` to create a one-time login token
- Extracts and returns the access token for frontend to use
- Frontend calls `supabase.auth.verifyOtp()` with the token

### LoginVerification Page UI
```text
┌─────────────────────────────────────────┐
│         Enter Your Code                 │
├─────────────────────────────────────────┤
│                                         │
│  [Mail Icon]                            │
│                                         │
│  We sent a code to                      │
│  user@example.com                       │
│                                         │
│      [ _ ][ _ ][ _ ][ _ ][ _ ][ _ ]     │
│                                         │
│  [      Sign In      ]                  │
│                                         │
│  Didn't receive it? Resend code         │
│                                         │
└─────────────────────────────────────────┘
```

## Benefits
- No broken redirect links
- Works entirely within your app
- Same flow as signup (consistent UX)
- User stays on post-upp.lovable.app the entire time
- Auto-login after code verification

