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

-- ===== Read = public, write = open (gated by the admin password in the page) =====
alter table artists enable row level security;
alter table tracks  enable row level security;
create policy "artists read"   on artists for select using (true);
create policy "artists insert" on artists for insert with check (true);
create policy "artists update" on artists for update using (true);
create policy "artists delete" on artists for delete using (true);
create policy "tracks read"    on tracks  for select using (true);
create policy "tracks insert"  on tracks  for insert with check (true);
create policy "tracks update"  on tracks  for update using (true);
create policy "tracks delete"  on tracks  for delete using (true);

-- ===== Storage buckets for photos + music (public to view, open to upload) =====
insert into storage.buckets (id, name, public) values
  ('photos','photos', true), ('music','music', true)
on conflict (id) do nothing;
create policy "media read"   on storage.objects for select using (bucket_id in ('photos','music'));
create policy "media insert" on storage.objects for insert with check (bucket_id in ('photos','music'));
create policy "media update" on storage.objects for update using (bucket_id in ('photos','music'));
create policy "media delete" on storage.objects for delete using (bucket_id in ('photos','music'));
```

You should see **"Success. No rows returned."**

## 2. Confirm the buckets exist
Supabase → **Storage** (left sidebar). You should see two buckets: **photos** and **music**, both
marked *Public*. (If they're not there, click **New bucket**, name it `photos`, toggle **Public**,
create; repeat for `music`.)

## 3. That's it
Tell me "done" and I'll:
- migrate your current artists (Willie, Carol, etc.) into the table,
- wire the admin page (`/admin.html`, password **music2026**),
- and switch the artist pages to read from here.

### Notes
- **Security:** the admin is gated by the password **music2026** in the page (the same "easter-egg"
  style as your shows handle). It keeps casual visitors out. Because the database key is public
  (it's a static site), this isn't bank-grade — if you ever want a real login, we can upgrade to
  Supabase Auth later. For a small label site this is the simple, practical choice you picked.
- **Limits (free tier):** 1 GB of storage — plenty for dozens of songs + photos.
- You can always view/edit rows directly in Supabase's **Table editor** (spreadsheet view) as a backup.
