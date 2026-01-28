
# 📧 Fix Email Delivery (Critical)

If users are not receiving emails (Verification, Password Reset, Magic Link), it is due to **Supabase restrictions**, not your code.

## 1. Configure Redirect URLs (Mandatory)
When the app is deployed, Supabase rejects auth requests if the URL doesn't match the whitelist.

1. Go to **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
2. **Site URL**: Set this to your **Production Domain** (e.g., `https://smm-app.vercel.app`).
3. **Redirect URLs**: Add these exact URLs:
   - `http://localhost:3000/**` (For local testing)
   - `https://your-production-domain.com/**` (Wildcard)
   - `https://your-production-domain.com/verify-email`
   - `https://your-production-domain.com/reset-password`
4. Click **Save**.

## 2. Setup Custom SMTP (Fix "No Email Received")
Supabase's default email service is limited to **3 emails per hour**. In production, this limit is hit immediately, causing emails to stop sending.

**You MUST use a custom SMTP provider.**

### Quick Setup with Brevo (Free Plan = 300 emails/day)
1. Create a free account at [Brevo.com](https://www.brevo.com).
2. Go to **Transactional** -> **Settings** -> **Configuration**.
3. Get your **SMTP Key** (Server: `smtp-relay.brevo.com`, Port: `587`).
4. Go to **Supabase Dashboard** -> **Settings** -> **Authentication** -> **SMTP Settings**.
5. Toggle **Enable Custom SMTP**.
6. Enter details:
   - **Host**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **User**: Your Brevo Login Email
   - **Password**: Your Brevo SMTP Master Key
   - **Sender Email**: `noreply@smlghana.store` (Must match a verified sender in Brevo)
   - **Sender Name**: SML Ghana
7. Click **Save**.

## 3. Verify Rate Limits
If you are still testing without SMTP:
1. Go to **Authentication** -> **Rate Limits**.
2. Increase "Email OTP" limit if possible, or wait 1 hour before testing again.
