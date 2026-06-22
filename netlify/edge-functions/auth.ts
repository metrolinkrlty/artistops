// Basic-auth gate for the whole site.
// Credentials come from Netlify env vars SITE_USER / SITE_PASSWORD.
// If no password is configured, the site is left open.
export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const expectedUser = Netlify.env.get("SITE_USER") || "admin";
  const expectedPass = Netlify.env.get("SITE_PASSWORD");

  // No password set -> don't block anything.
  if (!expectedPass) return context.next();

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice(6));
    const idx = decoded.indexOf(":");
    const user = decoded.slice(0, idx);
    const pass = decoded.slice(idx + 1);
    if (user === expectedUser && pass === expectedPass) {
      return context.next();
    }
  }

  return new Response("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="ArtistOps", charset="UTF-8"' },
  });
};

export const config = { path: "/*" };
