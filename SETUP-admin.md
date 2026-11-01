# Artist Admin — one-time Supabase setup

The admin page (upload music, edit/add artist profiles, add photos) is powered by your existing
Supabase project. This is a one-time setup: two database tables + two storage "folders" (buckets).
About 3 minutes. Same project as your shows.

## 1. Create the tables + storage (one paste)
Supabase → **SQL Editor → New query** → paste all of this → **Run**:

```sql
-- ===== ARTISTS =====
create table if not exists artists (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  role text,
  bio text,
  theme text default 'navy',          -- look preset: navy | whiskey | vintage | forest | rose | mono
  photo text,                         -- main photo (Storage URL or /images/x.jpg)
  links jsonb default '{}'::jsonb,    -- {spotify, apple, youtube, instagram, facebook, website}
  gallery jsonb default '[]'::jsonb,  -- extra photos (array of URLs)
  sort int default 100,               -- lower = shown first
  published boolean default true,
  created_at timestamptz default now()
);

-- ===== TRACKS (music) =====
create table if not exists tracks (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references artists(id) on delete cascade,
  title text,
  audio text,                         -- Storage URL of the MP3
  sort int default 100,
  created_at timestamptz default now()
);

-- ===== Read = public. Writes require a signed-in Supabase Auth user. =====
alter table artists enable row level security;
alter table tracks  enable row level security;
create policy "artists read"   on artists for select using (true);
create policy "artists insert" on artists for insert to authenticated with check (true);
create policy "artists update" on artists for update to authenticated using (true) with check (true);
create policy "artists delete" on artists for delete to authenticated using (true);
create policy "tracks read"    on tracks  for select using (true);
create policy "tracks insert"  on tracks  for insert to authenticated with check (true);
create policy "tracks update"  on tracks  for update to authenticated using (true) with check (true);
create policy "tracks delete"  on tracks  for delete to authenticated using (true);

-- ===== Storage buckets for photos + music (public to view, open to upload) =====
insert into storage.buckets (id, name, public) values
  ('photos','photos', true), ('music','music', true)
on conflict (id) do nothing;
create policy "media read"   on storage.objects for select using (bucket_id in ('photos','music'));
create policy "media insert" on storage.objects for insert to authenticated with check (bucket_id in ('photos','music'));
create policy "media update" on storage.objects for update to authenticated using (bucket_id in ('photos','music'));
create policy "media delete" on storage.objects for delete to authenticated using (bucket_id in ('photos','music'));
```

You should see **"Success. No rows returned."**

## 2. Confirm the buckets exist
Supabase → **Storage** (left sidebar). You should see two buckets: **photos** and **music**, both
marked *Public*. (If they're not there, click **New bucket**, name it `photos`, toggle **Public**,
create; repeat for `music`.)

## 3. Create the studio login
Supabase → **Authentication → Users → Add user**. Use the studio email and a password you store
in a password manager. `/admin.html` signs in with that account (Supabase Auth). The site no longer
contains a shared password.

## 4. Lock writes on the tables that were left open
The public site only needs to *read*. In **SQL Editor**, replace any “anyone can insert / update /
delete” policies. Known names from the original shows setup are included; if a `drop policy` says
the policy does not exist, skip that line. Do this in the dashboard — it is not applied by deploying
the website.

```sql
drop policy if exists "public insert" on shows;
drop policy if exists "public delete" on shows;
drop policy if exists "public update" on shows;
create policy "shows insert auth" on shows for insert to authenticated with check (true);
create policy "shows update auth" on shows for update to authenticated using (true) with check (true);
create policy "shows delete auth" on shows for delete to authenticated using (true);

-- Repeat the same idea for bands, subscribers, and settings if those tables
-- still have policies with roles {public} or {anon} for insert, update, or delete.
```

Keep `select` open so the public site can list shows and artists. After the insert policy on
`shows` is authenticated-only, the public “Submit a show” form can no longer write a row; it
already falls back to texting the studio.

## 5. Put Cloudflare Access in front of the admin URL
Cloudflare → **Zero Trust → Access → Applications → Add an application → Self-hosted**.
- Domain: `blueheronrecords.com`
- Paths: `/admin.html` and `/admin`
- Policy: allow only the studio email addresses

That is a second lock in front of the page. Row Level Security is still what actually protects
the database, because the publishable API key is visible in the site JavaScript.

### Notes
- **Limits (free tier):** 1 GB of storage — plenty for dozens of songs + photos.
- You can always view/edit rows directly in Supabase's **Table editor** as a backup.
