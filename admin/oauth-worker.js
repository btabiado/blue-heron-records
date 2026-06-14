/**
 * Cloudflare Worker — GitHub OAuth proxy for Decap CMS (Blue Heron Records).
 * Lets Joe sign in with GitHub at https://blueheronrecords.com/admin so the CMS
 * can save shows to events.json. Deploy this as a Worker, then set two secrets:
 *   GITHUB_CLIENT_ID      (from your GitHub OAuth App)
 *   GITHUB_CLIENT_SECRET  (from your GitHub OAuth App)
 * See admin/SETUP.md for the full walkthrough.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Step 1 — Decap opens <worker>/auth ; redirect the user to GitHub.
    if (url.pathname === "/auth") {
      const redirect_uri = `${url.origin}/callback`;
      const authUrl =
        "https://github.com/login/oauth/authorize" +
        `?client_id=${encodeURIComponent(env.GITHUB_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
        "&scope=repo,user" +
        `&state=${crypto.randomUUID()}`;
      return Response.redirect(authUrl, 302);
    }

    // Step 2 — GitHub redirects back to /callback?code=... ; exchange for a token
    // and hand it to the Decap window via postMessage.
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) return new Response("Missing ?code", { status: 400 });

      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "bhr-decap-oauth" },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });
      const data = await tokenRes.json();
      const ok = !!data.access_token;
      const status = ok ? "success" : "error";
      const payload = ok ? { token: data.access_token, provider: "github" } : { error: data.error || "no_token" };

      const html =
        "<!doctype html><html><body><script>(function(){" +
        "var payload=" + JSON.stringify(payload) + ";" +
        "var msg='authorization:github:" + status + ":'+JSON.stringify(payload);" +
        "function receive(e){window.opener.postMessage(msg,e.origin);window.removeEventListener('message',receive,false);}" +
        "window.addEventListener('message',receive,false);" +
        "window.opener&&window.opener.postMessage('authorizing:github','*');" +
        "})();</script><p>Authorized — you can close this window.</p></body></html>";
      return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
    }

    return new Response("Blue Heron Records — Decap GitHub OAuth proxy. Use /auth.", { status: 200 });
  },
};
