import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// หน้าครูที่ต้องล็อกอินก่อน — ตรวจจาก cookie teacher_auth
const TEACHER_PROTECTED = [
  '/teacher/dashboard',
  '/teacher/lessons',
  '/teacher/reports',
  '/teacher/labs',
  '/teacher/question-bank',
  '/teacher/announcements',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // ---- ป้องกันหน้าครู ----
  const isTeacherProtected = TEACHER_PROTECTED.some(p => pathname.startsWith(p));
  if (isTeacherProtected) {
    const teacherAuth = request.cookies.get('teacher_auth')?.value;
    if (teacherAuth !== 'authenticated') {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirected', '1');
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/teacher/:path*'],
};
