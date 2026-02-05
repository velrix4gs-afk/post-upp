

# Plan: Update Resend API Key and Complete OTP Email Flow

## What's Happening Now
The OTP code generation works, but emails aren't being sent because the current Resend API key is invalid.

## Solution
Update the `RESEND_API_KEY` secret with the new key you provided: `re_VbcFhYoQ_dTbmrJaEiMC8Q88v8ok3X57f`

## After This Update

The complete flow will work:

1. You enter your email on the sign-in page
2. Click "Send Code"
3. 6-digit code is generated and stored
4. **Email is sent with the code** (this will now work!)
5. You enter the code on the verification page
6. You're automatically logged in

## Important Note About Resend

With a free Resend account using `onboarding@resend.dev` as the sender:
- Emails can only be sent to the email address that owns the Resend account
- To send to any email, you'll need to verify your own domain at [resend.com/domains](https://resend.com/domains)

## Action
I will update the secret and redeploy the edge functions to ensure everything works.

