# Shows: add / remove on the site (one-time Supabase setup)

The Shows section lets anyone **add a show** from the site (it appears instantly) and lets you
**remove** shows from a discreet panel — the little **blue heron** in the bottom-left corner.

For submissions to save for *everyone*, the site needs a tiny free database. We use **Supabase**
(free tier). About 5 minutes, one time. Until it's connected, the form gracefully **texts Joe** and
the list falls back to the static `events.json` file — so nothing breaks in the meantime.

## 1. Create the database
1. Sign up at https://supabase.com (free) and create a new project (any name; pick a region near you).
2. Open **SQL Editor → New query**, paste this, and click **Run**:

   ```sql
   create table shows (
     id uuid primary key default gen_random_uuid(),
     date date,
     time text,
     description text,
     created_at timestamptz default now()
   );
   alter table shows enable row level security;
   create policy "public read"   on shows for select using (true);
   create policy "public insert" on shows for insert with check (true);
   create policy "public delete" on shows for delete using (true);
   ```

## 2. Copy your two values
In the project: **Settings → API**. Copy:
- **Project URL** — e.g. `https://abcdwxyz.supabase.co`
- **anon public** key — the long key labelled `anon` (this one is safe to put in the website)

## 3. Paste them into the site
In `app.js`, near the top of the Shows module:

```js
var SUPABASE_URL = "https://abcdwxyz.supabase.co";
var SUPABASE_KEY = "your-anon-public-key";
```

Commit + push. That's it — **Submit a show** now saves to the site, Joe (+ btab1130@gmail.com)
gets an email on each one, and the bottom-left heron opens the add/remove panel.

## Notes
- The `anon` key is *meant* to be public; Row-Level Security (the policies above) controls access.
- The policies are intentionally **open** (anyone can add/remove) per the "simple, ungated" choice.
  If spam ever becomes a problem, tighten the `insert`/`delete` policies in Supabase.
- You can also view/edit/delete rows directly in Supabase's **Table editor** (it looks like a spreadsheet).
