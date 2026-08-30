import { supabase } from '@/lib/supabase/client';
import { TestResult, GameResult } from '@/types';
import { useLearningStore } from '@/lib/store/useLearningStore';

export interface DashboardStudentData {
  preKnowledgeScore: number | null;
  preSkillScore: number | null;
  postKnowledgeScore: number | null;
  postSkillScore: number | null;
  gameScore: number | null;
  gameStages: number | null;
  completedLessons: string[];
  totalMinutes: number;
  questsCompleted: number;
  surveyCompleted: boolean;
  unlockedBadges: string[];
}

/**
 * บันทึกผลสอบลงตาราง test_results และอัปเดต quest_progress
 */
export async function saveTestResultToDB(
  studentId: string,
  testType: 'pre_knowledge' | 'pre_skill' | 'post_knowledge' | 'post_skill',
  result: TestResult
) {
  try {
    // 1. Insert ลงตาราง test_results
    const { error: testErr } = await supabase.from('test_results').insert([
      {
        student_id: studentId,
        test_type: testType,
        score: result.score,
        max_score: result.total_questions || 20,
        answers: result.answers || [],
        time_spent_sec: result.time_spent_sec || 0,
        completed_at: result.completed_at || new Date().toISOString(),
      },
    ]);

    if (testErr) {
      console.warn('test_results table insert note:', testErr.message);
    }

    // 2. ซิงค์ลง students.progress_data ด้วยเพื่อความเสถียร 2 ชั้น
    const currentState = useLearningStore.getState();
    const fieldMap: Record<string, string> = {
      pre_knowledge: 'preKnowledgeResult',
      pre_skill: 'preSkillResult',
      post_knowledge: 'postKnowledgeResult',
      post_skill: 'postSkillResult',
    };
    const key = fieldMap[testType];
    const updatedState = { ...currentState, [key]: result };

    await supabase.from('students').update({
      progress_data: updatedState,
      last_login_at: new Date().toISOString(),
    }).eq('id', studentId);

    // 3. อัปเดต quest_progress
    await updateQuestProgressInDB(studentId, {
      completedLessons: updatedState.completedLessons,
    });
  } catch (e) {
    console.error('Error saving test result to DB:', e);
  }
}

/**
 * บันทึกผลคะแนนบอร์ดเกมลงตาราง game_progress
 */
export async function saveGameResultToDB(studentId: string, result: GameResult) {
  try {
    // 1. Insert ลงตาราง game_progress
    const { error: gameErr } = await supabase.from('game_progress').insert([
      {
        student_id: studentId,
        points: result.score,
        stages_cleared: result.stages_cleared || 5,
        attempts: result.attempts || 1,
        time_spent_sec: result.time_spent_sec || 600,
        completed_at: result.created_at || new Date().toISOString(),
      },
    ]);

    if (gameErr) {
      console.warn('game_progress table insert note:', gameErr.message);
    }

    // 2. ซิงค์ลง students.progress_data ด้วย
    const currentState = useLearningStore.getState();
    const updatedState = { ...currentState, gameResult: result };

    await supabase.from('students').update({
      progress_data: updatedState,
      last_login_at: new Date().toISOString(),
    }).eq('id', studentId);

    // 3. อัปเดต quest_progress
    await updateQuestProgressInDB(studentId, {
      completedLessons: updatedState.completedLessons,
    });
  } catch (e) {
    console.error('Error saving game result to DB:', e);
  }
}

/**
 * บันทึกการเรียนจบบทเรียน
 */
export async function saveLessonCompletionToDB(studentId: string, lessonId: string) {
  try {
    const currentState = useLearningStore.getState();
    const updatedLessons = Array.from(new Set([...currentState.completedLessons, lessonId]));
    const updatedState = { ...currentState, completedLessons: updatedLessons };

    await supabase.from('students').update({
      progress_data: updatedState,
      last_login_at: new Date().toISOString(),
    }).eq('id', studentId);

    await updateQuestProgressInDB(studentId, {
      completedLessons: updatedLessons,
    });
  } catch (e) {
    console.error('Error saving lesson completion:', e);
  }
}

/**
 * บันทึกผลแบบประเมินความพึงพอใจ
 */
export async function saveSurveyToDB(studentId: string, answers: Record<string, any>) {
  try {
    const { data: student } = await supabase.from('students').select('first_name, last_name').eq('id', studentId).single();
    const studentName = student ? `${student.first_name} ${student.last_name}` : 'นักเรียน';

    await supabase.from('survey_responses').insert([
      {
        user_id: studentId,
        student_name: studentName,
        responses: answers,
        created_at: new Date().toISOString(),
      },
    ]);

    const currentState = useLearningStore.getState();
    await supabase.from('students').update({
      progress_data: { ...currentState, surveyCompleted: true },
      last_login_at: new Date().toISOString(),
    }).eq('id', studentId);

    await updateQuestProgressInDB(studentId, {
      completedLessons: currentState.completedLessons,
    });
  } catch (e) {
    console.error('Error saving survey to DB:', e);
  }
}

/**
 * อัปเดต quest_progress
 */
export async function updateQuestProgressInDB(
  studentId: string,
  data: { completedLessons?: string[]; totalMinutes?: number; questsCompleted?: number }
) {
  try {
    const state = useLearningStore.getState();
    let questsCount = 0;
    if (state.preKnowledgeResult) questsCount += 1;
    if (state.preSkillResult) questsCount += 1;
    if (state.completedLessons.length >= 1) questsCount += 1;
    if (state.gameResult) questsCount += 1;
    if (state.postKnowledgeResult) questsCount += 1;
    if (state.postSkillResult) questsCount += 1;
    if (state.surveyCompleted) questsCount += 1;

    await supabase.from('quest_progress').upsert({
      student_id: studentId,
      total_minutes: Math.round(state.totalStudyTimeSec / 60) || 0,
      quests_completed: questsCount,
      completed_lessons: data.completedLessons || state.completedLessons,
      unlocked_badges: state.unlockedBadgeIds,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    // Ignore if table not yet created
  }
}

/**
 * ดึงข้อมูลผลการเรียนและความคืบหน้าทั้งหมดของนักเรียน
 */
export async function fetchStudentDashboardData(studentId: string): Promise<DashboardStudentData> {
  const result: DashboardStudentData = {
    preKnowledgeScore: null,
    preSkillScore: null,
    postKnowledgeScore: null,
    postSkillScore: null,
    gameScore: null,
    gameStages: null,
    completedLessons: [],
    totalMinutes: 0,
    questsCompleted: 0,
    surveyCompleted: false,
    unlockedBadges: [],
  };

  try {
    // 1. ดึงจากตาราง students.progress_data ก่อน
    const { data: student } = await supabase.from('students').select('progress_data').eq('id', studentId).single();
    if (student?.progress_data) {
      const p = student.progress_data;
      result.preKnowledgeScore = p.preKnowledgeResult?.score ?? null;
      result.preSkillScore = p.preSkillResult?.score ?? null;
      result.postKnowledgeScore = p.postKnowledgeResult?.score ?? null;
      result.postSkillScore = p.postSkillResult?.score ?? null;
      result.gameScore = p.gameResult?.score ?? null;
      result.gameStages = p.gameResult?.stages_cleared ?? null;
      result.completedLessons = p.completedLessons || [];
      result.totalMinutes = Math.round((p.totalStudyTimeSec || 0) / 60);
      result.surveyCompleted = p.surveyCompleted || false;
      result.unlockedBadges = p.unlockedBadgeIds || [];
    }

    // 2. ดึงจากตาราง test_results ล่าสุด (ถ้ามี)
    const { data: tests } = await supabase
      .from('test_results')
      .select('test_type, score, completed_at')
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false });

    if (tests && tests.length > 0) {
      for (const t of tests) {
        if (t.test_type === 'pre_knowledge' && result.preKnowledgeScore === null) result.preKnowledgeScore = Number(t.score);
        if (t.test_type === 'pre_skill' && result.preSkillScore === null) result.preSkillScore = Number(t.score);
        if (t.test_type === 'post_knowledge' && result.postKnowledgeScore === null) result.postKnowledgeScore = Number(t.score);
        if (t.test_type === 'post_skill' && result.postSkillScore === null) result.postSkillScore = Number(t.score);
      }
    }

    // 3. ดึงจากตาราง game_progress ล่าสุด (ถ้ามี)
    const { data: games } = await supabase
      .from('game_progress')
      .select('points, stages_cleared, completed_at')
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false })
      .limit(1);

    if (games && games.length > 0) {
      result.gameScore = Number(games[0].points);
      result.gameStages = Number(games[0].stages_cleared);
    }

    // 3.1 ซิงค์คะแนนอัตโนมัติจากฐานข้อมูลบอร์ดเกม (Board Game Supabase) โดยตรง
    if (result.gameScore === null || result.gameScore === 0) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const boardGameClient = createClient(
          'https://mpquqdoccadpxjvufcud.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcXVxZG9jY2FkcHhqdnVmY3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NzMxMTQsImV4cCI6MjEwMTI0OTExNH0.9oc5PP4sNqkmZpTZJDvIQGf2-1c7WU-_AZQ0gBcNKCo'
        );

        const { data: currentStudent } = await supabase
          .from('students')
          .select('first_name, last_name')
          .eq('id', studentId)
          .single();

        if (currentStudent) {
          const fullName = `${currentStudent.first_name || ''} ${currentStudent.last_name || ''}`.trim().toLowerCase();
          const { data: bgStudents } = await boardGameClient.from('students').select('id, name');
          const matching = (bgStudents || []).filter(
            (b) => b.name && (
              b.name.toLowerCase().includes(fullName) ||
              fullName.includes(b.name.toLowerCase()) ||
              b.name.toLowerCase().includes((currentStudent.first_name || '').toLowerCase())
            )
          );

          if (matching.length > 0) {
            const matchingIds = matching.map((m) => m.id);
            const { data: bgResults } = await boardGameClient
              .from('game_results')
              .select('score, level_completed')
              .in('student_id', matchingIds);

            if (bgResults && bgResults.length > 0) {
              const maxScore = Math.max(...bgResults.map((r) => Number(r.score) || 0));
              if (maxScore > 0) {
                result.gameScore = maxScore;
                result.gameStages = 5;
              }
            }
          }
        }
      } catch (bgErr) {
        // Safe fallback
      }
    }

    // 4. ดึงจากตาราง survey_responses (ถ้ามี)
    const { data: surveys } = await supabase
      .from('survey_responses')
      .select('id')
      .eq('user_id', studentId)
      .limit(1);

    if (surveys && surveys.length > 0) {
      result.surveyCompleted = true;
    }

    // คำนวณจำนวนเควสที่สำเร็จ
    let count = 0;
    if (result.preKnowledgeScore !== null) count += 1;
    if (result.preSkillScore !== null) count += 1;
    if (result.completedLessons.length >= 1) count += 1;
    if (result.gameScore !== null) count += 1;
    if (result.postKnowledgeScore !== null) count += 1;
    if (result.postSkillScore !== null) count += 1;
    if (result.surveyCompleted) count += 1;
    result.questsCompleted = count;

  } catch (e) {
    console.error('Error fetching dashboard data:', e);
  }

  return result;
}

/**
 * รีเซ็ตคะแนนและความคืบหน้าทั้งหมดของนักเรียน (Pre/Post test, บทเรียน, เกม, แบบประเมิน)
 */
export async function resetStudentProgressInDB(studentId: string) {
  try {
    // 1. Reset progress_data in students table
    await supabase.from('students').update({
      progress_data: {
        completedLessons: [],
        unlockedBadgeIds: [],
        totalStudyTimeSec: 0,
        preKnowledgeResult: null,
        preSkillResult: null,
        postKnowledgeResult: null,
        postSkillResult: null,
        gameResult: null,
        surveyCompleted: false,
      },
    }).eq('id', studentId);

    // 2. Delete test results
    await supabase.from('test_results').delete().eq('student_id', studentId);

    // 3. Delete / reset quest progress
    await supabase.from('quest_progress').delete().eq('student_id', studentId);

    // 4. Delete game progress
    await supabase.from('game_progress').delete().eq('student_id', studentId);

    // 5. Delete survey responses
    await supabase.from('survey_responses').delete().eq('user_id', studentId);

    return { success: true };
  } catch (error) {
    console.error('Error resetting student progress:', error);
    return { success: false, error };
  }
}

/**
 * ลบข้อมูลนักเรียนออกจากระบบ
 */
export async function deleteStudentFromDB(studentId: string) {
  try {
    await resetStudentProgressInDB(studentId);
    await supabase.from('students').delete().eq('id', studentId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting student:', error);
    return { success: false, error };
  }
}
