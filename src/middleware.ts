import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// หน้าครูที่ต้องล็อกอินก่อน — ตรวจจาก cookie teacher_auth
const TEACHER_PROTECTED = [
  '/teacher/dashboard',
  '/teacher/lessons',
  '/teacher/reports',
  '/teacher/labs',
  '/teacher/question-bank',
  '/teacher/announcements',
];

// หน้านักเรียนที่ต้องล็อกอินก่อน
const STUDENT_PROTECTED = [
  '/student/dashboard',
  '/student/lessons',
  '/student/game',
  '/student/tests',
  '/student/badges',
  '/student/certificate',
  '/student/survey',
  '/student/profile',
  '/student/report',
  '/student/complete-profile'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({
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
    return response;
  }

  // ---- ป้องกันหน้านักเรียน ----
  const isStudentProtected = STUDENT_PROTECTED.some(p => pathname.startsWith(p));
  // ไม่บล็อกหน้า login
  const isStudentLogin = pathname === '/student/login';
  if (isStudentProtected && !isStudentLogin) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL('/student/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/teacher/:path*', '/student/:path*'],
};
