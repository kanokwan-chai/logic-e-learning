'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Gamepad2, FileCheck2, Menu, X, Compass, Lock, Sparkles, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLearningStore } from '@/lib/store/useLearningStore';
import { useLessons } from '@/lib/hooks/useSupabaseContent';
import LockedAlertModal from '@/components/ui/LockedAlertModal';
import StudentActivityTracker from '@/components/student/StudentActivityTracker';
import FloatingChatbot from '@/components/student/FloatingChatbot';

export default function StudentSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLockedAlert, setShowLockedAlert] = useState(false);

  const { lessons: allLessons } = useLessons();
  const publishedLessons = allLessons.filter((l) => l.published);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Load and save collapse state
  useEffect(() => {
    const saved = localStorage.getItem('student_sidebar_collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('student_sidebar_collapsed', String(next));
  };

  const {
    preKnowledgeResult,
    preSkillResult,
    completedLessons,
    gameResult,
    postKnowledgeResult,
    postSkillResult,
    isHydrated,
  } = useLearningStore();

  // Strict sequential learning progression:
  // 1. Pre-Knowledge -> 2. Pre-Skill -> 3. Lessons -> 4. Game -> 5. Post-Knowledge -> 6. Post-Skill -> 7. Survey
  const allLessonsDone = publishedLessons.length > 0 
    ? publishedLessons.every((l) => completedLessons.includes(l.id))
    : completedLessons.length >= 1;

  const quests = [
    { label: 'ก่อนเรียน (ความรู้)', href: '/student/tests/pre_knowledge', icon: FileCheck2, isLocked: false, isExternal: false },
    { label: 'ก่อนเรียน (ทักษะ)', href: '/student/tests/pre_skill', icon: FileCheck2, isLocked: !preKnowledgeResult, isExternal: false },
    { label: 'บทเรียนตรรกศาสตร์', href: '/student/lessons', icon: BookOpen, isLocked: !preSkillResult, isExternal: false },
    { label: 'Digital Board Game', href: '/student/game', icon: Gamepad2, isLocked: !allLessonsDone, isExternal: false },
    { label: 'หลังเรียน (ความรู้)', href: '/student/tests/post_knowledge', icon: FileCheck2, isLocked: !gameResult, isExternal: false },
    { label: 'หลังเรียน (ทักษะ)', href: '/student/tests/post_skill', icon: FileCheck2, isLocked: !postKnowledgeResult, isExternal: false },
    { label: 'ประเมินความพึงพอใจ', href: '/student/survey', icon: Star, isLocked: !postSkillResult, isExternal: false },
  ];

  return (
    <>
      <StudentActivityTracker />

      {/* Mobile Hamburger Toggle Button */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="md:hidden fixed top-4 right-4 z-40 p-2 bg-white rounded-xl shadow-soft-sm text-slate-600 hover:text-primary transition-colors"
        aria-label="เปิดเมนู"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar Content */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-30 bg-white border-r border-slate-100 shadow-soft-sm md:shadow-none shrink-0 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        
        {/* Header with Logo and Collapse Button */}
        <div className={`h-20 flex bg-white border-b border-slate-50 transition-all ${isCollapsed ? 'flex-col items-center justify-center gap-1.5 py-2' : 'items-center px-5 justify-between'}`}>
          <Link href="/student/dashboard" className={`flex items-center gap-2.5 group overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`} title="LogicLearn">
            <div className={`text-blue-600 flex items-center justify-center shrink-0 transition-all ${isCollapsed ? 'w-7 h-7' : 'w-9 h-9'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isCollapsed ? 'w-6 h-6' : 'w-8 h-8'}>
                <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
                <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
              </svg>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-black text-slate-800 leading-none truncate">LogicLearn</span>
                <span className="text-[9px] text-slate-500 font-bold tracking-wide mt-0.5 truncate">Logic • Learn • Level Up</span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle Button (< / >) */}
          <button
            onClick={toggleCollapse}
            className={`hidden md:flex items-center justify-center transition-all ${
              isCollapsed 
                ? 'w-full max-w-[1.75rem] py-0.5 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50/50' 
                : 'ml-1 p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title={isCollapsed ? 'ขยายแถบเมนู' : 'พับเก็บแถบเมนู'}
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsOpen(false)} 
            className={`md:hidden p-1.5 text-slate-400 hover:text-danger hover:bg-rose-50 rounded-lg ${isCollapsed ? 'mt-1' : 'ml-auto'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-3 flex flex-col">
          <div className="space-y-1">
            {quests.map((item) => {
              const isActive = (pathname.startsWith(item.href) && item.href !== '/student/dashboard') || (pathname === '/student/dashboard' && item.href === '/student/dashboard');
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.isLocked ? '#' : item.href}
                  target={item.isExternal ? '_blank' : undefined}
                  rel={item.isExternal ? 'noopener noreferrer' : undefined}
                  onClick={(e) => { 
                    if (item.isLocked) { 
                      e.preventDefault(); 
                      setShowLockedAlert(true); 
                    } 
                  }}
                  title={item.label}
                  className={`flex items-center transition-all font-bold text-sm ${
                    isCollapsed 
                      ? 'justify-center px-3 py-3 rounded-2xl mx-2' 
                      : 'gap-3 px-5 py-3.5 border-l-4'
                  } ${
                    item.isLocked 
                      ? 'opacity-50 cursor-not-allowed text-slate-400 border-transparent hover:bg-slate-50' 
                      : isActive 
                        ? isCollapsed 
                          ? 'bg-blue-50 text-blue-600 shadow-sm' 
                          : 'bg-blue-50 text-blue-600 border-blue-600' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  
                  {!isCollapsed && (
                    <>
                      <span className="truncate flex-1">{item.label}</span>
                      {item.isLocked && <Lock className="w-3.5 h-3.5 ml-auto opacity-50 shrink-0 text-amber-500" />}
                    </>
                  )}
                  {isCollapsed && item.isLocked && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* AI Assistant Block */}
          {pathname.includes('/student/lessons') && (
            <div className={`mt-auto ${isCollapsed ? 'px-2 py-4' : 'px-4 py-6 border-t border-slate-100/80'}`}>
              {isCollapsed ? (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-chatbot'))}
                  className="w-full aspect-square rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-soft-sm hover:scale-105 active:scale-95 transition-all"
                  title="ปรึกษาผู้ช่วย AI"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </button>
              ) : (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-4 shadow-sm border border-blue-100/50 relative overflow-hidden group">
                  <div className="relative z-10">
                    <h4 className="font-black text-blue-700 text-xs mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> AI Assistant
                    </h4>
                    <p className="text-[10px] text-slate-600 font-medium leading-relaxed mb-3">
                      พร้อมตอบทุกข้อสงสัยเกี่ยวกับตรรกศาสตร์
                    </p>
                    
                    <button 
                      onClick={() => window.dispatchEvent(new CustomEvent('open-chatbot'))}
                      className="w-full py-2 bg-white hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-xl text-xs font-black shadow-soft-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" /> ปรึกษาผู้ช่วย AI
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>
      </aside>

      <LockedAlertModal isOpen={showLockedAlert} onClose={() => setShowLockedAlert(false)} />
      {pathname.includes('/student/lessons') && <FloatingChatbot />}
    </>
  );
}
