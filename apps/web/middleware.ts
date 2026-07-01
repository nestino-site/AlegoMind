import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/autentificare",
  "/inregistrare",
  "/verifica-email",
  "/explorez",
  "/furnizori",
  "/cum-functioneaza",
  "/preturi",
];

const AUTH_PATHS = ["/autentificare", "/inregistrare", "/verifica-email"];

const PROTECTED_PREFIXES = [
  "/acasa",
  "/onboarding",
  "/rezervare",
  "/conversatii",
  "/sesiuni",
  "/profil",
  "/asistent",
];

// Professional-only dashboard pages. Listed individually (not a blanket
// "/profesionist" prefix) because /profesionist/[id] is the *public* provider
// profile page and shares the same top-level segment.
const PROTECTED_PROFESIONIST_PATHS = [
  "/profesionist/panou",
  "/profesionist/inregistrare",
  "/profesionist/profil",
  "/profesionist/program",
  "/profesionist/rezervari",
  "/profesionist/sedinte",
  "/profesionist/mesaje",
  "/profesionist/conversatii",
  "/profesionist/servicii",
  "/profesionist/clienti",
  "/profesionist/statistici",
];

function isProtected(pathname: string) {
  return (
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) ||
    PROTECTED_PROFESIONIST_PATHS.some((p) => pathname.startsWith(p))
  );
}

function isAuthPage(pathname: string) {
  return AUTH_PATHS.some((p) => pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("am_at")?.value;

  // Redirect logged-in users away from auth pages
  if (token && isAuthPage(pathname)) {
    return NextResponse.redirect(new URL("/acasa", req.url));
  }

  // Redirect unauthenticated users away from protected pages
  if (!token && isProtected(pathname)) {
    const loginUrl = new URL("/autentificare", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
