'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { Compass, Bell, LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { useAnnouncements } from '@/lib/hooks/useSupabaseContent';
import { useLearningStore } from '@/lib/store/useLearningStore';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { role, logout } = useAuthStore();
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const { announcements } = useAnnouncements();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    // Load dismissed announcements from local storage
    const saved = localStorage.getItem('dismissed_announcements');
    if (saved) {
      try {
        setDismissedIds(JSON.parse(saved));
      } catch (e) {}
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setGoogleUser(user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setGoogleUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const displayName = googleUser?.user_metadata?.full_name
    || googleUser?.user_metadata?.name
    || googleUser?.email?.split('@')[0]
    || 'นักเรียน';

  const isTeacher = pathname.startsWith('/teacher');

  const avatarUrl = googleUser?.user_metadata?.custom_avatar
    || (isTeacher ? '/images/teacher-avatar.jpg' : null) // Force teacher avatar if in teacher route
    || googleUser?.user_metadata?.avatar_url
    || googleUser?.user_metadata?.picture
    || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;

  const handleLogout = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const currentState = useLearningStore.getState();
      if (currentState.isHydrated && (currentState.completedLessons.length > 0 || currentState.preKnowledgeResult !== null)) {
        await supabase.from('students').update({
          progress_data: currentState,
        }).eq('id', session.user.id);
      }
    }
    
    await supabase.auth.signOut();
    logout(); // Auth store
    window.location.href = '/student/login';
  };

  const activeAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id));
  const recentAnnouncements = activeAnnouncements.slice(0, 3);

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed));
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b-2 border-slate-100 shadow-soft-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2">

        {/* Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 group min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-gradient-to-br from-primary via-primary-hover to-purple-700 flex items-center justify-center text-white shadow-soft-md group-hover:scale-105 transition-transform border-b-4 border-purple-900">
            <Compass className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-black text-lg sm:text-2xl text-slate-800 tracking-tight flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
              Logic <span className="text-primary font-black hidden xs:inline sm:inline">E-Learning</span>
            </span>
            <span className="text-[9px] sm:text-[11px] text-slate-500 font-bold block -mt-1 truncate">ระบบเรียนรู้ตรรกศาสตร์ ปวช.</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 pr-12 md:pr-0">

          {/* Notifications Bell */}
          {googleUser && (
            <div className="relative shrink-0">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 sm:p-3 rounded-2xl bg-slate-100 border-b-2 border-slate-300 hover:bg-slate-200 text-slate-700 transition-all relative flex items-center justify-center"
                title="ประกาศ"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {recentAnnouncements.length > 0 && (
                  <>
                    <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500 border-2 border-white" />
                  </>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white rounded-3xl shadow-soft-lg border-2 border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="font-extrabold text-xs text-slate-800">📢 ประกาศจากครู</h4>
                    {recentAnnouncements.length > 0 && (
                      <span className="text-[10px] bg-primary text-white font-bold px-2.5 py-0.5 rounded-full">
                        {recentAnnouncements.length} ใหม่
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 mt-3">
                    {recentAnnouncements.length === 0 ? (
                      <p className="text-xs text-slate-400 font-bold text-center py-4">ยังไม่มีประกาศ</p>
                    ) : (
                      recentAnnouncements.map((ann) => (
                        <div key={ann.id} className="p-3 rounded-2xl bg-primary-light/80 border border-primary/30 text-xs relative group pr-8">
                          <button
                            onClick={() => handleDismiss(ann.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                            title="รับทราบ/ปิด"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                          <p className="font-extrabold text-slate-800">{ann.title}</p>
                          <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">{ann.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile */}
          {googleUser ? (
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link href="/student/profile" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-2xl bg-slate-100 border-2 border-primary/40 object-cover shadow-soft-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden md:block text-left">
                  <p className="text-xs font-extrabold text-slate-800 line-clamp-1 max-w-[120px]">{displayName}</p>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {pathname.startsWith('/teacher') ? 'ครูผู้สอน' : 'นักเรียน'}
                  </p>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="hidden sm:flex p-2.5 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                title="ออกจากระบบ"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              href="/student/login"
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl bg-primary text-white text-[10px] sm:text-xs font-extrabold shadow-soft-sm hover:bg-primary-hover transition-colors border-b-4 border-purple-900 shrink-0 whitespace-nowrap"
            >
              เข้าเรียน
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
