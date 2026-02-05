

# Plan: Fix Edge Function CORS and Request Body Issues

## Problem Identified
The edge function logs show:
```
Error in send-login-otp: SyntaxError: Unexpected end of JSON input
```

This means the request body arrives **empty** at the edge function. Root causes:

1. **Missing preview origin in CORS**: The preview URL (`id-preview--*.lovable.app`) is NOT in the allowed origins list
2. **Missing Supabase-specific headers**: The `Access-Control-Allow-Headers` is missing headers that the Supabase client sends

When CORS fails, browsers don't send the request body, causing the `req.json()` to fail with "Unexpected end of JSON input".

## Solution

Update both edge functions to:
1. Use wildcard CORS or include all Lovable preview origins
2. Add all required Supabase client headers
3. Add better error handling for empty bodies

## File Changes

### 1. Update `supabase/functions/send-login-otp/index.ts`

**Changes:**
- Update `Access-Control-Allow-Origin` to allow all origins (or add preview pattern)
- Add missing headers: `x-supabase-client-platform`, `x-supabase-client-platform-version`, `x-supabase-client-runtime`, `x-supabase-client-runtime-version`
- Add early check for empty request body before parsing JSON
- Add better error logging

**Updated CORS headers:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};
```

**Add body validation:**
```typescript
// Check if request has a body
const contentType = req.headers.get('content-type');
if (!contentType || !contentType.includes('application/json')) {
  return new Response(
    JSON.stringify({ error: 'Content-Type must be application/json' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Try to parse body
let body;
try {
  const text = await req.text();
  if (!text) {
    return new Response(
      JSON.stringify({ error: 'Request body is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  body = JSON.parse(text);
} catch (e) {
  return new Response(
    JSON.stringify({ error: 'Invalid JSON in request body' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### 2. Update `supabase/functions/verify-login-otp/index.ts`

**Same changes:**
- Update CORS headers to allow all origins
- Add all required Supabase client headers
- Add early body validation

## Technical Details

### Why this happens:
1. User is on preview URL: `https://id-preview--9a29c09e-0a4f-48ed-8349-6ca57bde389a.lovable.app`
2. Edge function only allows: `https://post-upp.lovable.app`, `localhost:5173`, `localhost:3000`
3. Browser sends CORS preflight (OPTIONS)
4. Preflight succeeds (OPTIONS returns 200 with restricted origin)
5. Actual POST request rejected by browser because origin doesn't match
6. Request body is stripped, resulting in empty JSON

### Fix approach:
Using `'Access-Control-Allow-Origin': '*'` is standard for edge functions that:
- Are protected by API keys (already using Supabase anon key)
- Handle their own authentication
- Need to work from multiple origins (preview + published)

## Summary of Changes

| File | Change |
|------|--------|
| `supabase/functions/send-login-otp/index.ts` | Fix CORS headers, add body validation |
| `supabase/functions/verify-login-otp/index.ts` | Fix CORS headers, add body validation |

## After Implementation
- Deploy both edge functions
- Test the "Sign in with code" flow from the preview URL
- Verify the code is sent and can be verified

