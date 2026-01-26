
# Setting up Brevo (Sendinblue) SMTP with Supabase

To ensure your emails (Confirmations, Password Resets) are delivered reliably, you should configure Supabase to use Brevo's SMTP server instead of the default generic Supabase email.

## 1. Get Brevo Credentials
1. Log in to your **Brevo (formerly Sendinblue)** account.
2. Click on your profile name (top right) -> **SMTP & API**.
3. Click the **SMTP** tab.
4. Generate a new SMTP key if you haven't already.
5. Note down the following:
   - **SMTP Server**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Login**: (Usually your email address)
   - **Password**: (The master key you just generated)

## 2. Configure Supabase
1. Go to your **Supabase Project Dashboard**.
2. Click on the **Settings** (Cog icon) in the left sidebar.
3. Select **Authentication**.
4. Scroll down to the **SMTP Settings** section.
5. Toggle **Enable Custom SMTP** to ON.
6. Fill in the details:
   - **Host**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **User**: (Your Brevo Login/Email)
   - **Password**: (Your Brevo SMTP Key)
   - **Sender Email**: (e.g., `no-reply@smlghana.store`) - *Must be verified in Brevo.*
   - **Sender Name**: Smart Monthly Living
7. Click **Save**.

## 3. Rate Limits
Supabase's default email service has a limit of 3 emails per hour. Integrating Brevo removes this limit, allowing unlimited signups and password resets for your users.

## 4. Admin Role Setup
To create an admin:
1. Sign up as a normal user in the app.
2. Go to Supabase Dashboard -> **Table Editor** -> `profiles` table.
3. Find your user row.
4. Change the `role` column from `USER` to `ADMIN`.
5. Refresh the app. You will now be redirected to the Admin Dashboard.
