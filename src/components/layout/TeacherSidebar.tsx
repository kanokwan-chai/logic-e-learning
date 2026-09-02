'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileQuestion,
  BookMarked,
  Megaphone,
  FlaskConical,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TeacherSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    { label: 'Dashboard ครู', href: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'รายงานนักเรียน', href: '/teacher/reports', icon: Users, badge: 'Export' },
    { label: 'คลังข้อสอบ', href: '/teacher/question-bank', icon: FileQuestion },
    { label: 'จัดการบทเรียน', href: '/teacher/lessons', icon: BookMarked },
    { label: 'ประกาศข่าวสาร', href: '/teacher/announcements', icon: Megaphone },
    { label: 'แบบประเมิน', href: '/teacher/survey', icon: BookMarked },
  ];

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button onClick={() => setIsOpen(true)} className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-xl shadow-soft-sm text-slate-600 hover:text-primary transition-colors">
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar / Drawer Backdrop for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div className="hidden md:block w-64 shrink-0" />
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 shadow-soft-sm shrink-0 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Exact Logo Layout */}
        <div className="h-20 flex items-center px-6 bg-white">
          <Link href="/teacher/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 text-blue-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-800 leading-none">LogicLearn</span>
              <span className="text-[9px] text-slate-500 font-bold tracking-wide mt-0.5">Teacher Portal</span>
            </div>
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden ml-auto p-1 text-slate-400 hover:text-danger">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/teacher/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-6 py-3.5 transition-all font-bold text-sm border-l-4 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-blue-600'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black ml-2 ${
                        isActive ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
