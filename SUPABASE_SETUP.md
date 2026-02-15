# Supabase Setup Guide for Stikie

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose an organization, name the project (e.g., `stikie`), set a database password, and select a region
4. Wait for the project to finish provisioning

## 2. Get Your API Keys

1. In your Supabase dashboard, go to **Settings > API**
2. Copy the **Project URL** and **anon (public) key**
3. Create a `.env` file in the project root:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 3. Run the Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Open and paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run** to create the `notes` table, indexes, RLS policies, and triggers

## 4. Enable Email/Password Auth

Email/password authentication is enabled by default in Supabase. To verify:

1. Go to **Authentication > Providers**
2. Ensure **Email** is enabled
3. Optionally disable "Confirm email" for development (under **Authentication > Settings**)

## 5. Set Up Google OAuth

### 5a. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Select **Web application**
6. Set the **Authorized redirect URIs**:
   - `https://your-project-id.supabase.co/auth/v1/callback`
7. Click **Create** and copy the **Client ID** and **Client Secret**

### 5b. Supabase Dashboard

1. Go to **Authentication > Providers > Google**
2. Toggle Google to **Enabled**
3. Paste the **Client ID** and **Client Secret** from Google Cloud Console
4. Save

## 6. Configure Redirect URLs

1. In your Supabase dashboard, go to **Authentication > URL Configuration**
2. Set **Site URL** to your production domain: `https://stikie.net`
3. Add **Redirect URLs**:
   - `http://localhost:5173` (for local development)
   - `https://stikie.net` (for production)

## 7. Deploy the Delete Account Edge Function

The delete-account edge function allows users to delete their own accounts. It requires the Supabase CLI.

### Install Supabase CLI

```bash
npm install -g supabase
```

### Link your project

```bash
supabase login
supabase link --project-ref your-project-id
```

### Deploy the function

```bash
supabase functions deploy delete-account
```

### Set the service role key as a secret

1. Find your **service_role key** in **Settings > API** (keep this secret!)
2. Set it as a function secret:
   ```bash
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Troubleshooting

- **CORS errors**: Ensure your site URL and redirect URLs are correctly configured
- **Google OAuth not working**: Double-check the redirect URI in Google Cloud Console matches `https://your-project-id.supabase.co/auth/v1/callback`
- **RLS blocking queries**: Verify the user is authenticated and the JWT contains the correct `sub` claim
