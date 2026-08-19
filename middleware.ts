import { NextRequest, NextResponse } from "next/server";

const ADMIN_USER = "admin";
const ADMIN_PASSWORD_SHA256 = "84c7d7a60af4b88cc2e6764d3a8ea6379c475fbb14f7056301010dd543a1f5b7";

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function unauthorized() {
  return new NextResponse("Admin authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Mabrig Print Shop Admin", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
}

export async function middleware(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) return unauthorized();

  try {
    const decoded = atob(authorization.slice(6));
    const separator = decoded.indexOf(":");
    if (separator < 0) return unauthorized();

    const username = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    if (username !== ADMIN_USER) return unauthorized();

    const passwordHash = await sha256(password);
    if (passwordHash !== ADMIN_PASSWORD_SHA256) return unauthorized();

    return NextResponse.next();
  } catch {
    return unauthorized();
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
