# OMHSQ – Occupational Mental Health Screening Questionnaire

Bilingual Arabic/English technical starter for a voluntary, confidential, two-stage support programme.

## Current scope

This is a **technical MVP**, not a validated screening instrument and not for diagnosis or fitness-for-work decisions. It currently provides:

- Supabase email/password signup, confirmation, login and password reset.
- Voluntary consent and privacy notice.
- Stage 1 support-request intake (selected support topics, contact preference, separate immediate-safety prompt).
- Supabase database storage with Row Level Security (RLS).
- Restricted professional/admin read-only dashboard.

**Psychometric scales and clinical scoring are intentionally not included yet.** Add PHQ-4 or other validated instruments only after checking the exact Arabic/English versions, permissions for reproduction/digital use, scoring rules and local validation requirements. Do not treat the current topic selections as a validated screen.

## Files

- `index.html` – application UI
- `styles.css` – responsive styling
- `app.js` – authentication, intake and dashboard logic
- `supabase-config.js` – public Supabase URL and publishable key
- `schema.sql` – tables, indexes, RLS policies and admin assignment instructions
- `.github/workflows/pages.yml` – GitHub Pages deployment

## Step 1 – Create GitHub repository

Create a new repository, for example `OMHSQ-Assessment`. Upload all files and folders in this package to the repository root. Keep the repository private while developing if preferred. GitHub Pages availability/settings depend on repository and account plan.

## Step 2 – Create Supabase project

1. Create a new Supabase project.
2. Open **Project Settings → API** (or API Keys).
3. Copy the Project URL and the **publishable key** (or legacy anon key).
4. Edit `supabase-config.js` and replace the two placeholders.
5. Do not use a `service_role` or secret key in this file.
6. Open **SQL Editor**, paste the complete `schema.sql`, and run it.

## Step 3 – Configure authentication URLs

In Supabase open **Authentication → URL Configuration**:
- Site URL: `https://YOUR-GITHUB-USERNAME.github.io/OMHSQ-Assessment/`
- Add the same URL to Redirect URLs.
- Also add `http://localhost:5500/` if testing locally.
- Keep email confirmation enabled.

## Step 4 – Connect Brevo SMTP

In Brevo:
1. Authenticate a sending domain and configure the SPF/DKIM DNS records shown by Brevo.
2. Create or select a sender address on that authenticated domain.
3. Open SMTP & API → SMTP and copy the **SMTP key**, not the API key.
4. In Supabase open Authentication → SMTP Settings / Custom SMTP and enter the current host, port, login and SMTP key displayed in your Brevo account. Brevo commonly documents `smtp-relay.brevo.com` and port `587`; verify the current values in your account.
5. Set the sender email/name to the verified sender.
6. Test signup and password-reset emails, including spam/junk folders.

Never put Brevo credentials in GitHub files or browser JavaScript.

## Step 5 – Enable GitHub Pages

1. In GitHub repository, open **Settings → Pages**.
2. Choose **GitHub Actions** as the build/deployment source.
3. Push to `main`. The workflow deploys the site.
4. Open the Pages URL and test signup/login.

## Step 6 – Create the first authorized professional

1. Register the professional/admin account through the app.
2. Confirm the email.
3. In Supabase → Authentication → Users, locate that account and copy its UUID.
4. In SQL Editor run (replace the email):
   ```sql
   insert into public.omhsq_user_roles (user_id, role)
   select id, 'admin'
   from auth.users
   where email = 'YOUR_ADMIN_EMAIL'
   on conflict (user_id) do update set role = 'admin';
   ```
5. Sign out and sign in again. The account should see the authorized dashboard.

## Step 7 – Test before real data

Use test accounts and dummy data only:
- Worker A can create and read their own request.
- Worker B cannot read Worker A's request.
- Worker account cannot access the professional dashboard.
- Professional/admin can read requests.
- Unauthenticated users cannot read or insert requests.
- Signup confirmation and password reset emails arrive.
- A `yes` response to immediate safety question displays emergency guidance. This app is not monitored in real time.

## Important production safeguards

- Do not launch with real employee mental-health information until the organization approves the privacy notice, lawful basis, retention period, access list, incident response and referral workflow.
- The browser app is not an emergency monitoring service.
- No automated diagnosis, severity label, clinical cut-off or fitness decision is implemented.
- Add MFA for privileged accounts; use least-privilege access and periodically review professional/admin access.
- Configure backups, retention and deletion procedures appropriate to the sensitivity of the data.
- Do not email individual mental-health responses or results through Brevo. Use Brevo only for authentication messages unless a separately reviewed secure workflow is designed.
- Consider a separate production Supabase project and domain after pilot testing.

## Suggested next development milestone

Add a versioned instrument registry for Stage 1 and Stage 2. Each instrument record should include source, exact approved language, version, response options, scoring specification, permission status, Arabic validation evidence and referral logic. Keep scoring disabled until reviewed and approved.
