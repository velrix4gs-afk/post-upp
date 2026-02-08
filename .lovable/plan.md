

# Fix: OTP Login Redirecting to AuthCallback Instead of Auto-Login

## Root Cause

When the edge function calls `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })`, the Supabase Auth server consumes the token and creates a session. However, the **Site URL** configured in your Supabase dashboard is causing an automatic redirect to `/auth/callback`.

When you arrive at `/auth/callback`, the token has already been used by the edge function, so you see "Invalid or expired authentication link."

## Solution

Instead of using `generateLink` + `verifyOtp` (which involves magic link tokens that trigger redirects), we should use a different approach that doesn't involve magic links at all.

We'll use the **Admin API** to create a session directly for the user after validating the OTP code.

### The New Flow

```text
+------------------+      +-------------------+      +------------------+
|   User enters    | ---> |  Edge function    | ---> |   Frontend gets  |
|   6-digit code   |      |  validates code   |      |   session tokens |
+------------------+      |  Creates session  |      |   Sets session   |
                          |  via Admin API    |      |   Navigates to   |
                          +-------------------+      |   /feed          |
                                                     +------------------+
```

## Implementation

### 1. Update `supabase/functions/verify-login-otp/index.ts`

Instead of `generateLink` + `verifyOtp`, we'll:

1. Validate the OTP code from the `email_otps` table
2. Look up the user by email using Admin API
3. Generate a new session using Admin API `createUser` with `shouldCreateUser: false` or use `generateLink` with `newEmail` option that doesn't trigger redirects

Actually, the cleanest solution is to use `supabase.auth.admin.generateLink()` but pass `{ redirectTo: 'NONE' }` - but that's not supported.

**Better approach**: Use the magic link but DON'T call `verifyOtp` in the edge function. Instead:
- Generate the link
- Extract the `token_hash`
- Return the `token_hash` to the frontend
- The frontend calls `verifyOtp` with the `token_hash` directly

This way, no redirect happens because the frontend controls the flow.

```typescript
// Edge function - just validate OTP and return the token_hash
const { data: linkData } = await supabase.auth.admin.generateLink({
  type: 'magiclink',
  email: sanitizedEmail,
});

const url = new URL(linkData.properties.action_link);
const token_hash = url.searchParams.get('token');

return new Response(JSON.stringify({ 
  success: true,
  token_hash,
}));
```

```typescript
// Frontend - verify the token_hash to get a session
const { data } = await supabase.functions.invoke('verify-login-otp', {
  body: { email, code: otp }
});

// Verify the token_hash to get a session
const { data: sessionData, error } = await supabase.auth.verifyOtp({
  token_hash: data.token_hash,
  type: 'magiclink',
});

// User is now logged in
if (sessionData.session) {
  navigate('/feed', { replace: true });
}
```

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/verify-login-otp/index.ts` | Remove server-side `verifyOtp` call, return `token_hash` instead |
| `src/pages/LoginVerification.tsx` | Call `supabase.auth.verifyOtp({ token_hash })` on the client side |

## Why This Works

- The edge function validates your custom 6-digit OTP code
- It generates a magic link token (but doesn't verify it)
- The token is sent to the frontend
- The frontend calls `verifyOtp` which creates the session locally
- No redirect happens because everything stays in the same browser context

## After Implementation

1. Redeploy the `verify-login-otp` edge function
2. Test the full flow:
   - Enter email on sign-in page
   - Receive 6-digit code via email
   - Enter code on verification page
   - Get logged in immediately and redirected to `/feed`

