// scripts/smoke-auth.ts
// Run: npx tsx scripts/smoke-auth.ts

const BASE = "http://localhost:3000";
const email = `smoke_${Date.now()}@test.com`;
const password = "Str0ng!Pass1";

let cookieJar = "";

function parseCookies(res: Response): string {
  const raw = res.headers.getSetCookie?.() ?? [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

async function main() {
  // ── 1. Sign up ──
  const signupRes = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name: "Smoke" }),
  });
  cookieJar = parseCookies(signupRes);
  console.log("✅ Signup:", signupRes.status, await signupRes.json());

  // ── 2. Access protected route ──
  const meRes = await fetch(`${BASE}/auth/me`, {
    headers: { Cookie: cookieJar },
  });
  console.log("✅ Me:", meRes.status, await meRes.json());

  // ── 3. Refresh (re-roll) ──
  const refreshRes = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { Cookie: cookieJar },
  });
  const oldJar = cookieJar;
  cookieJar = parseCookies(refreshRes);
  console.log("✅ Refresh:", refreshRes.status, await refreshRes.json());
  console.log("   New cookies differ from old?", cookieJar !== oldJar);

  // ── 4. Replay OLD refresh token → expect 401 ──
  const replayRes = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { Cookie: oldJar },
  });
  console.log(
    replayRes.status === 401
      ? "✅ Reuse detection works (401)"
      : `❌ Expected 401, got ${replayRes.status}`,
  );

  // ── 5. Logout ──
  const logoutRes = await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    headers: { Cookie: cookieJar },
  });
  console.log("✅ Logout:", logoutRes.status);

  // ── 6. Access after logout → expect 401 ──
  const afterLogout = await fetch(`${BASE}/auth/me`, {
    headers: { Cookie: cookieJar },
  });
  console.log(
    afterLogout.status === 401
      ? "✅ Post-logout access denied (401)"
      : `❌ Expected 401, got ${afterLogout.status}`,
  );
}

main().catch(console.error);
