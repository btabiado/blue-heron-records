# Admin (Add Shows) — one-time setup

The on-site admin form lives at **https://blueheronrecords.com/admin** (Decap CMS). Once set up,
Joe signs in with GitHub and adds/edits shows with a simple form — they save to `events.json`
and appear on the site within ~1 minute. No JSON, no code.

Because the site is static (GitHub Pages), sign-in needs a tiny free auth proxy on Cloudflare
(you already use Cloudflare for DNS). Steps below — ~15 minutes, one time.

## 1) Create a GitHub OAuth App
GitHub → Settings → Developer settings → **OAuth Apps** → **New OAuth App**
- Application name: `Blue Heron Records CMS`
- Homepage URL: `https://blueheronrecords.com`
- Authorization callback URL: `https://blue-heron-oauth.YOURNAME.workers.dev/callback`
  *(you'll get the real worker URL in step 2 — come back and paste it here)*
- Click **Register**, copy the **Client ID**, then **Generate a client secret** and copy it.

## 2) Deploy the Cloudflare Worker
Cloudflare dashboard → **Workers & Pages** → **Create** → **Create Worker**
- Name it e.g. `blue-heron-oauth` → Deploy (the starter), then **Edit code**.
- Replace the code with the contents of **`admin/oauth-worker.js`** (in this repo) → **Deploy**.
- Worker → **Settings → Variables → Add variable** (encrypt each):
  - `GITHUB_CLIENT_ID` = the Client ID from step 1
  - `GITHUB_CLIENT_SECRET` = the client secret from step 1
- Note the worker URL, e.g. `https://blue-heron-oauth.YOURNAME.workers.dev`.
- Go back to the GitHub OAuth App (step 1) and set the callback URL to `<that worker URL>/callback`.

## 3) Point the CMS at the worker
Edit **`admin/config.yml`** → set `base_url:` to your worker URL (no trailing slash), commit. e.g.
```
  base_url: https://blue-heron-oauth.YOURNAME.workers.dev
```

## 4) Give Joe access
- Joe needs a free GitHub account.
- Repo → **Settings → Collaborators → Add people** → add Joe (write access). He accepts the email invite.

## Done — how Joe adds a show
1. Go to **https://blueheronrecords.com/admin** → **Login with GitHub**.
2. Open **Events Calendar → Shows → Add Show**, fill in date / act / venue / city / time (+ optional ticket link).
3. **Publish.** It's on the site in about a minute.

*Fallback any time:* you (Bryan) can still add a show by editing `events.json` directly:
https://github.com/btabiado/blue-heron-records/edit/main/events.json
