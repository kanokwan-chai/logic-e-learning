'use client';
import { useStudentAuth } from '@/lib/hooks/useStudentAuth';

import StudentSidebar from '@/components/layout/StudentSidebar';
import { MOCK_BADGES } from '@/lib/supabase/mockData';
import { useLearningStore } from '@/lib/store/useLearningStore';
import { Award, Lock, CheckCircle2, ShieldAlert, Crown, Table, Brain, Puzzle, Gamepad2, Sparkles } from 'lucide-react';

export default function BadgesPage() {
  useStudentAuth();
  const { 
    preKnowledgeResult, 
    preSkillResult, 
    completedLessons, 
    gameResult, 
    postKnowledgeResult, 
    postSkillResult 
  } = useLearningStore();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldAlert':
        return ShieldAlert;
      case 'Crown':
        return Crown;
      case 'Table':
        return Table;
      case 'Award':
        return Award;
      case 'Brain':
        return Brain;
      case 'Puzzle':
        return Puzzle;
      case 'Gamepad2':
        return Gamepad2;
      default:
        return Sparkles;
    }
  };

  const checkIsUnlocked = (badgeId: string) => {
    switch (badgeId) {
      case 'badge-1': return preKnowledgeResult !== null;
      case 'badge-2': return preSkillResult !== null;
      case 'badge-3': return completedLessons.length >= 1;
      case 'badge-4': return gameResult !== null;
      case 'badge-5': return postKnowledgeResult !== null;
      case 'badge-6': return postSkillResult !== null;
      default: return false;
    }
  };

  const unlockedCount = MOCK_BADGES.filter(b => checkIsUnlocked(b.id)).length;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F8FAFC] font-sans md:flex md:h-[calc(100vh-80px)] md:overflow-hidden">
      <StudentSidebar />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Title */}
        <div className="p-6 rounded-4xl bg-white border-2 border-slate-200 shadow-soft-sm flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Award className="w-7 h-7 text-purple-600 animate-bounce" /> สะสม Badge ตราสัญลักษณ์นักสืบ ({MOCK_BADGES.length} Badges)
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">
              ปลดล็อกตราสัญลักษณ์เกียรติยศ 3D เมื่อทำภารกิจและบทเรียนสำเร็จ
            </p>
          </div>

          <span className="px-4 py-2 rounded-2xl bg-purple-100 border-2 border-purple-200 text-purple-900 font-black text-xs">
            ปลดล็อกแล้ว {unlockedCount}/{MOCK_BADGES.length} ตรา
          </span>
        </div>

        {/* 6 Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_BADGES.map((badge) => {
            const isUnlocked = checkIsUnlocked(badge.id);
            const Icon = getIcon(badge.icon_name);

            return (
              <div
                key={badge.id}
                className={`p-6 rounded-4xl border-2 transition-all flex flex-col items-center text-center space-y-3 relative overflow-hidden ${
                  isUnlocked
                    ? 'bg-white border-purple-300 border-b-8 border-b-purple-400 shadow-soft-md hover:scale-105'
                    : 'bg-slate-50/90 border-slate-200 border-b-6 border-b-slate-300 opacity-60 grayscale'
                }`}
              >
                {/* Status indicator */}
                {isUnlocked ? (
                  <span className="absolute top-3 right-3 text-emerald-500 bg-emerald-100 p-1 rounded-full border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 text-slate-400 bg-slate-200 p-1 rounded-full border border-slate-300">
                    <Lock className="w-4 h-4" />
                  </span>
                )}

                {/* 3D Shiny Badge Icon Frame */}
                <div
                  className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-soft-md ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-purple-500 via-primary to-purple-800 text-white ring-8 ring-purple-100 border-b-4 border-purple-950 animate-pulse'
                      : 'bg-slate-200 text-slate-400 border-b-4 border-slate-300'
                  }`}
                >
                  <Icon className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="font-black text-sm text-slate-800">{badge.name}</h3>
                  <p className="text-[11px] text-slate-600 font-medium mt-1 leading-snug">{badge.description}</p>
                </div>

                <div className="pt-2 text-[10px] text-slate-500 font-bold border-t border-slate-100 w-full">
                  เงื่อนไข: {badge.criteria}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
