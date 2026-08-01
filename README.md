# Gym Tracker

A fast, mobile-first workout tracker. Log exercises with sets, reps, and weight, organize sessions by category (Chest, Back, Legs, etc.), and review your full workout history. Your data is stored in the cloud and synced across every device you log into.

Dark theme, yellow accent, rounded cards — built to be quick to use mid-workout.

**Tech stack:** Next.js 14 (App Router, TypeScript) · Tailwind CSS · Supabase (Postgres database + authentication) · Zod (validation) · deployed on Vercel.

Everything here is free: Supabase's free tier and Vercel's free (Hobby) tier are both sufficient to run this app for personal use, with no premium features gated in the app itself.

---

## 1. What you'll need

This guide assumes a completely fresh laptop. You'll install two things:

1. **Node.js** (runs the app) — https://nodejs.org — download the **LTS** version and run the installer. This also installs `npm`, which manages the project's dependencies.
2. **A code editor** (optional but recommended) — [VS Code](https://code.visualstudio.com/) is a good free choice.

To check Node installed correctly, open a terminal (Terminal on Mac, Command Prompt or PowerShell on Windows) and run:

```bash
node -v
npm -v
```

You should see version numbers (Node 18 or newer is required).

You'll also need a free **Supabase** account for the database — no credit card required. Sign up at https://supabase.com when you get to Step 3.

---

## 2. Get the project running locally

1. Unzip the project folder you downloaded and open a terminal inside it (on Mac: right-click the folder → "New Terminal at Folder"; on Windows: open the folder in File Explorer, click the address bar, type `cmd`, press Enter).

2. Install dependencies:

   ```bash
   npm install
   ```

   This downloads everything the project needs into a `node_modules` folder. It can take a minute or two the first time.

3. Keep this terminal open — you'll come back to it in Step 4 after setting up the database.

---

## 3. Set up the database (Supabase)

Supabase gives you a Postgres database and user authentication out of the box, for free.

1. Go to https://supabase.com, click **Start your project**, and sign up (GitHub or email both work).
2. Click **New project**. Choose any name (e.g. `gym-tracker`), set a database password (save it somewhere safe — you likely won't need it again, but keep it), pick the region closest to you, and click **Create new project**. Wait ~1 minute while it provisions.
3. Once the project is ready, open the **SQL Editor** in the left sidebar, click **New query**, then open the file `supabase/schema.sql` from this project, copy its entire contents, paste it into the SQL editor, and click **Run**. This creates the `workouts`, `exercises`, and `sets` tables along with the security rules that keep each user's data private to them.
4. In the left sidebar, go to **Project Settings → API**. You'll need two values from this page:
   - **Project URL**
   - **anon / public** key (under "Project API keys")

### Configure email confirmation (recommended for a quick start)

By default, Supabase requires users to confirm their email before logging in. For local testing, you can turn this off so you can sign up and start using the app immediately:

- Go to **Authentication → Providers → Email** and toggle off **Confirm email**.

(You can leave this on if you'd rather wire up real confirmation emails — the app already handles both cases correctly.)

---

## 4. Connect the app to your database

1. In the project folder, find the file `.env.local.example`. Make a copy of it and rename the copy to `.env.local`.
2. Open `.env.local` and paste in the two values from Supabase Step 3.4:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```

3. Save the file. `.env.local` is already excluded from version control (see `.gitignore`), so your keys won't accidentally get shared.

---

## 5. Run it

Back in your terminal, from the project folder:

```bash
npm run dev
```

Open http://localhost:3000 in your browser. You should land on the login page. Click **Create an account**, sign up, and you're in — start logging your first workout.

To stop the server, press `Ctrl+C` in the terminal.

---

## 6. Project structure

```
gym-tracker/
├── supabase/
│   └── schema.sql          # Database tables + security policies (run once in Supabase)
├── src/
│   ├── app/                 # Pages (Next.js App Router)
│   │   ├── (auth)/login/    # Login page
│   │   ├── (auth)/signup/   # Sign-up page
│   │   ├── today/           # Today's workout — the main screen
│   │   ├── history/         # Past workouts, grouped by date
│   │   ├── history/[date]/  # Detail view for a specific day
│   │   ├── profile/         # Account info + sign out
│   │   └── auth/            # Auth callback + sign-out routes
│   ├── components/          # UI building blocks (tables, cards, nav, forms)
│   ├── lib/
│   │   ├── supabase/        # Supabase client setup (browser + server)
│   │   ├── types.ts         # Shared TypeScript types
│   │   ├── validation.ts    # Zod schemas — required fields, ranges, etc.
│   │   └── categories.ts    # Workout category list (Chest, Back, Legs, ...)
│   └── middleware.ts        # Redirects signed-out users to /login
├── .env.local.example       # Template for your Supabase keys
└── package.json
```

---

## 7. How the data model works

- **Workout** — one training session: a date, a category (e.g. "Chest"), and a completed flag. You can log more than one per day (e.g. Chest in the morning, Cardio at night).
- **Exercise** — belongs to a workout (e.g. "Bench Press").
- **Set** — belongs to an exercise: reps, weight in kg, and a completion checkmark. **Both reps and weight are required** — this is enforced in three places: the input form (can't submit without both), the validation layer (Zod), and the database itself (`NOT NULL` + range checks), so bad data can never sneak in even from a bug elsewhere.

Every table has **Row Level Security** turned on in Supabase, with policies scoped to `auth.uid()`. This means the database itself refuses to return or modify another user's rows, even if there were a bug in the app code — your data is private by construction, not just by convention.

---

## 8. Deploying it live (so you can use it on your phone)

The frontend deploys to **Vercel** (free) and talks to the same Supabase project you already set up — no separate backend to deploy.

1. Push this project to a GitHub repository (create a new repo on https://github.com/new, then follow its instructions to push this folder — or use GitHub Desktop if you prefer a GUI).
2. Go to https://vercel.com, sign up with your GitHub account, click **Add New → Project**, and import the repository.
3. When prompted for environment variables, add the same two values from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. After a minute you'll get a live URL like `https://gym-tracker-yourname.vercel.app` — open it on your phone, add it to your home screen, and it behaves like an app.
5. Back in Supabase, go to **Authentication → URL Configuration** and add your new Vercel URL (and `https://your-app.vercel.app/auth/callback`) to the **Redirect URLs** list, so email confirmation links work in production too.

Every future `git push` to your repository automatically redeploys the live site.

---

## 9. Troubleshooting

- **"Missing Supabase environment variables" error** — you haven't created `.env.local`, or the dev server was started before you saved it. Stop the server (`Ctrl+C`) and run `npm run dev` again.
- **Signed up but can't log in** — check whether "Confirm email" is enabled in Supabase (Step 3). If it is, check your inbox (and spam folder) for the confirmation link.
- **"Incorrect email or password"** — this is a generic message on purpose (so the app doesn't reveal whether an email is registered); double-check both fields.
- **Changes to `schema.sql` after you've already run it** — the script uses `if not exists` / `drop ... if exists` guards, so it's safe to re-run in the SQL Editor if you need to reset policies.
- **Port 3000 already in use** — run `npm run dev -- -p 3001` to use a different port.

---

## 10. A note on this build

This project's source files were written by hand rather than generated with `npx create-next-app`, because the sandbox this was built in doesn't have access to the public npm registry. The code follows standard, current Next.js App Router + Supabase conventions throughout, but since it couldn't be run in that sandbox, run through the steps above carefully on your own machine and let me know if anything doesn't behave as expected — happy to debug from there.
