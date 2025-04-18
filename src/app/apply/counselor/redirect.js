export function middleware(request) {
  return Response.redirect(new URL('/counselor/apply', request.url));
}

export const config = {
  matcher: '/apply/counselor',
};
