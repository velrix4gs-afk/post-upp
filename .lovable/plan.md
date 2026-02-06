

# Fix: OTP Code Verification Not Logging User In

## Root Cause

The `verify-login-otp` edge function generates a magic link, extracts the `token` from the URL, and sends it to the client. The client then calls `supabase.auth.verifyOtp({ email, token, type: 'magiclink' })`.

The problem: the token extracted from the URL is actually a `token_hash`, but the client passes it as `token`. This parameter mismatch causes Supabase auth to reject the verification, so the user never gets logged in.

## Solution

Instead of the fragile magic link token extraction, the edge function will **sign the user in directly** using `supabase.auth.admin.generateLink()` and return the full session to the client. The client then sets the session directly -- no second auth call needed.

## Changes

### 1. Update `supabase/functions/verify-login-otp/index.ts`

After validating the OTP code from the database:
- Use `supabase.auth.admin.generateLink({ type: 'magiclink', email })` to get the action link
- Extract the `token_hash` (not `token`) from the URL
- Call `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` **server-side** to get a full session
- Return the session (`access_token`, `refresh_token`) to the client

```typescript
// After OTP validation...
const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
  type: 'magiclink',
  email: sanitizedEmail,
});

const url = new URL(linkData.properties.action_link);
const token_hash = url.searchParams.get('token');

// Verify server-side to get session
const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
  token_hash,
  type: 'magiclink',
});

// Return session to client
return new Response(JSON.stringify({
  success: true,
  session: sessionData.session,
}), ...);
```

### 2. Update `src/pages/LoginVerification.tsx`

Simplify the `handleVerify` function:
- Call `verify-login-otp` edge function
- Receive the session directly from the response
- Use `supabase.auth.setSession()` to log the user in immediately
- Navigate to `/feed`

```typescript
const { data } = await supabase.functions.invoke('verify-login-otp', {
  body: { email, code: otp }
});

// Set session directly - user is now logged in
await supabase.auth.setSession({
  access_token: data.session.access_token,
  refresh_token: data.session.refresh_token,
});

navigate('/feed', { replace: true });
```

## Why This Is Better

- No fragile token/token_hash confusion
- Single round-trip: edge function handles everything server-side
- The session is created on the server with service role privileges, so it always works
- User is logged in instantly after entering the correct code

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/verify-login-otp/index.ts` | Verify OTP server-side, return full session |
| `src/pages/LoginVerification.tsx` | Use `setSession()` instead of `verifyOtp()` |

## After Implementation
- Redeploy `verify-login-otp` edge function
- Test the full flow: enter email, receive code, enter code, auto-login
