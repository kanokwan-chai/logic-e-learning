'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Gamepad2, FileCheck2, FileBadge, Menu, X, Compass, Lock, Sparkles, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLearningStore } from '@/lib/store/useLearningStore';
import LockedAlertModal from '@/components/ui/LockedAlertModal';
import StudentActivityTracker from '@/components/student/StudentActivityTracker';
import FloatingChatbot from '@/components/student/FloatingChatbot';

export default function StudentSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showLockedAlert, setShowLockedAlert] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const { preKnowledgeResult, preSkillResult, completedLessons, gameResult, postKnowledgeResult, postSkillResult, isHydrated } = useLearningStore();

  const quests = [
    { label: 'ก่อนเรียน (ความรู้)', href: '/student/tests/pre_knowledge', icon: FileCheck2, isLocked: false, isExternal: false },
    { label: 'ก่อนเรียน (ทักษะ)', href: '/student/tests/pre_skill', icon: FileCheck2, isLocked: false, isExternal: false },
    { label: 'บทเรียนตรรกศาสตร์', href: '/student/lessons', icon: BookOpen, isLocked: false, isExternal: false },
    { label: 'Digital Board Game', href: '/student/game', icon: Gamepad2, isLocked: false, isExternal: false },
    { label: 'หลังเรียน (ความรู้)', href: '/student/tests/post_knowledge', icon: FileCheck2, isLocked: false, isExternal: false },
    { label: 'หลังเรียน (ทักษะ)', href: '/student/tests/post_skill', icon: FileCheck2, isLocked: false, isExternal: false },
    { label: 'ประเมินความพึงพอใจ', href: '/student/survey', icon: Star, isLocked: false, isExternal: false },
  ];

  return (
    <>
      <StudentActivityTracker />
      <button onClick={() => setIsOpen(true)} className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-xl shadow-soft-sm text-slate-600 hover:text-primary transition-colors">
        <Menu className="w-5 h-5" />
      </button>

      {isOpen && <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col bg-white border-r border-slate-100 shadow-soft-sm md:static md:shadow-none`}>
        
        {/* Exact Logo Layout */}
        <div className="h-20 flex items-center px-6 bg-white">
          <Link href="/student/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 text-blue-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-9 h-9">
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-800 leading-none">LogicLearn</span>
              <span className="text-[9px] text-slate-500 font-bold tracking-wide mt-0.5">Logic • Learn • Level Up</span>
            </div>
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden ml-auto p-1 text-slate-400 hover:text-danger">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 flex flex-col">
          <div className="space-y-1">
            {quests.map((item) => {
              const isActive = pathname.startsWith(item.href) && item.href !== '/student/dashboard' || (pathname === '/student/dashboard' && item.href === '/student/dashboard');
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.isLocked ? '#' : item.href}
                  target={item.isExternal ? '_blank' : undefined}
                  rel={item.isExternal ? 'noopener noreferrer' : undefined}
                  onClick={(e) => { if (item.isLocked) { e.preventDefault(); setShowLockedAlert(true); } }}
                  className={`flex items-center gap-3 px-6 py-3.5 transition-all font-bold text-sm border-l-4 ${
                    item.isLocked ? 'opacity-50 cursor-not-allowed text-slate-400 border-transparent' : 
                    isActive ? 'bg-blue-50 text-blue-600 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {item.label}
                  {item.isLocked && <Lock className="w-3 h-3 ml-auto opacity-50" />}
                </Link>
              );
            })}
          </div>

          {/* AI Assistant Block */}
          {pathname.includes('/student/lessons') && (
            <div className="px-6 py-8 mt-4 border-t border-slate-100/60">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2rem] p-5 shadow-sm border border-blue-100/50 relative overflow-hidden group">
                {/* Background Glow */}
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl group-hover:bg-blue-400/30 transition-colors" />
                <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-purple-400/20 rounded-full blur-2xl group-hover:bg-purple-400/30 transition-colors" />

                <div className="relative z-10">
                  <h4 className="font-black text-blue-700 text-sm mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" /> AI Assistant
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed mb-4">
                    ผู้ช่วยอัจฉริยะ พร้อมตอบทุกข้อสงสัยเกี่ยวกับตรรกศาสตร์
                  </p>
                  
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('open-chatbot'))}
                    className="w-full py-2.5 bg-white hover:bg-blue-600 text-blue-600 hover:text-white border-2 border-blue-100 hover:border-blue-600 rounded-xl text-xs font-black shadow-soft-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Compass className="w-4 h-4" /> ปรึกษาผู้ช่วย AI
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>

      </aside>

      <LockedAlertModal isOpen={showLockedAlert} onClose={() => setShowLockedAlert(false)} />
      {pathname.includes('/student/lessons') && <FloatingChatbot />}
    </>
  );
}
