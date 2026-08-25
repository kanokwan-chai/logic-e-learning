import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TestResult, GameResult, LabResult } from '@/types';

interface LearningState {
  isHydrated: boolean; // true หลังโหลดข้อมูลจาก Supabase เสร็จ
  completedLessons: string[];
  preKnowledgeResult: TestResult | null;
  preSkillResult: TestResult | null;
  postKnowledgeResult: TestResult | null;
  postSkillResult: TestResult | null;
  gameResult: GameResult | null;
  labResults: Record<string, LabResult>;
  unlockedBadgeIds: string[];
  totalStudyTimeSec: number;
  surveyCompleted: boolean;
  partialTestAnswers: Record<string, (number | null)[]>;

  setHydrated: () => void;
  completeLesson: (lessonId: string) => void;
  saveTestResult: (type: 'pre_knowledge' | 'pre_skill' | 'post_knowledge' | 'post_skill', result: TestResult) => void;
  savePartialTestAnswers: (type: string, answers: (number | null)[]) => void;
  saveGameResult: (result: GameResult) => void;
  saveLabResult: (labId: string, result: LabResult) => void;
  unlockBadge: (badgeId: string) => void;
  addStudyTime: (seconds: number) => void;
  completeSurvey: () => void;
  resetProgress: () => void;
}

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      isHydrated: false,
      completedLessons: [],
      preKnowledgeResult: null,
      preSkillResult: null,
      postKnowledgeResult: null,
      postSkillResult: null,
      gameResult: null,
      labResults: {},
      unlockedBadgeIds: [],
      totalStudyTimeSec: 0,
      surveyCompleted: false,
      partialTestAnswers: {},

      setHydrated: () => set({ isHydrated: true }),
      savePartialTestAnswers: (type, answers) => {
        set({ partialTestAnswers: { ...get().partialTestAnswers, [type]: answers } });
      },

      completeLesson: (lessonId) => {
        const current = get().completedLessons;
        if (!current.includes(lessonId)) {
          const updated = [...current, lessonId];
          set({ completedLessons: updated });

          // Unlock Logic Master if all 5 completed
          if (updated.length >= 5 && !get().unlockedBadgeIds.includes('logic_master')) {
            get().unlockBadge('logic_master');
          }
        }
      },

      saveTestResult: (type, result) => {
        if (type === 'pre_knowledge') {
          set({ preKnowledgeResult: result });
        } else if (type === 'pre_skill') {
          set({ preSkillResult: result });
          if (!get().unlockedBadgeIds.includes('detective_rookie')) {
            get().unlockBadge('detective_rookie');
          }
        } else if (type === 'post_knowledge') {
          set({ postKnowledgeResult: result });
        } else if (type === 'post_skill') {
          set({ postSkillResult: result });
          const badges = [...get().unlockedBadgeIds];
          if (result.score >= 16 && !badges.includes('detective_master')) {
            badges.push('detective_master');
          }
          if (result.score === 20 && !badges.includes('perfect_score')) {
            badges.push('perfect_score');
          }
          set({ unlockedBadgeIds: badges });
        }
      },

      saveGameResult: (result) => {
        set({ gameResult: result });
        if (!get().unlockedBadgeIds.includes('game_champion')) {
          get().unlockBadge('game_champion');
        }
      },

      saveLabResult: (labId, result) => {
        const currentLabs = { ...get().labResults, [labId]: result };
        set({ labResults: currentLabs });

        if (Object.keys(currentLabs).length >= 3 && !get().unlockedBadgeIds.includes('logical_thinker')) {
          get().unlockBadge('logical_thinker');
        }
      },

      unlockBadge: (badgeId) => {
        const current = get().unlockedBadgeIds;
        if (!current.includes(badgeId)) {
          set({ unlockedBadgeIds: [...current, badgeId] });
        }
      },

      addStudyTime: (seconds) => {
        set({ totalStudyTimeSec: get().totalStudyTimeSec + seconds });
      },

      completeSurvey: () => {
        set({ surveyCompleted: true });
      },

      resetProgress: () => {
        set({
          completedLessons: [],
          preKnowledgeResult: null,
          preSkillResult: null,
          postKnowledgeResult: null,
          postSkillResult: null,
          gameResult: null,
          labResults: {},
          unlockedBadgeIds: [],
          totalStudyTimeSec: 0,
          surveyCompleted: false,
          partialTestAnswers: {},
        });
      },
    }),
    {
      name: 'logic-detective-learning',
    }
  )
);
