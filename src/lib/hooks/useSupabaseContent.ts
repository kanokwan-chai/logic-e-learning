/**
 * useSupabaseContent — อ่าน/เขียน Supabase สำหรับ lessons, questions, labs, announcements
 * ใช้แทน useContentStore (localStorage) เมื่อเชื่อมฐานข้อมูลจริงแล้ว
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CMSLesson, LabItem } from '@/lib/store/useContentStore';
import { QuestionItem, AnnouncementItem } from '@/types';

// ─── Lessons ─────────────────────────────────────────────────────────────────
export function useLessons() {
  const [lessons, setLessons] = useState<CMSLesson[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('chapter_number', { ascending: true });
    if (!error && data) setLessons(data as CMSLesson[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  const addLesson = async (lesson: CMSLesson) => {
    const { error } = await supabase.from('lessons').insert([lesson]);
    if (!error) await fetchLessons();
    return !error;
  };

  const updateLesson = async (lesson: CMSLesson) => {
    const { error } = await supabase.from('lessons').update(lesson).eq('id', lesson.id);
    if (!error) await fetchLessons();
    return !error;
  };

  const deleteLesson = async (id: string) => {
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (!error) await fetchLessons();
    return !error;
  };

  return { lessons, loading, addLesson, updateLesson, deleteLesson, refetch: fetchLessons };
}

// ─── Questions ────────────────────────────────────────────────────────────────
export function useQuestions(testType?: 'pre_knowledge' | 'pre_skill' | 'post_knowledge' | 'post_skill') {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('questions').select('*').order('created_at', { ascending: false });
    if (testType) {
      query = query.eq('test_type', testType);
    }
    const { data, error } = await query;
    if (!error && data) setQuestions(data as QuestionItem[]);
    setLoading(false);
  }, [testType]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const addQuestion = async (q: QuestionItem) => {
    const { error } = await supabase.from('questions').insert([q]);
    if (!error) await fetchQuestions();
    return !error;
  };

  const updateQuestion = async (q: QuestionItem) => {
    const { error } = await supabase.from('questions').update(q).eq('id', q.id);
    if (!error) await fetchQuestions();
    return !error;
  };

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (!error) await fetchQuestions();
    return !error;
  };

  const deleteQuestionsBySet = async (setId: string) => {
    const { error } = await supabase.from('questions').delete().eq('test_type', setId);
    if (!error) await fetchQuestions();
    return !error;
  };

  return { questions, loading, addQuestion, updateQuestion, deleteQuestion, deleteQuestionsBySet, refetch: fetchQuestions };
}

// ─── Labs ─────────────────────────────────────────────────────────────────────
export function useLabs() {
  const [labs, setLabs] = useState<LabItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLabs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('labs')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) setLabs(data as LabItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLabs(); }, [fetchLabs]);

  const addLab = async (lab: LabItem) => {
    const { error } = await supabase.from('labs').insert([lab]);
    if (!error) await fetchLabs();
    return !error;
  };

  const updateLab = async (lab: LabItem) => {
    const { error } = await supabase.from('labs').update(lab).eq('id', lab.id);
    if (!error) await fetchLabs();
    return !error;
  };

  const deleteLab = async (id: string) => {
    const { error } = await supabase.from('labs').delete().eq('id', id);
    if (!error) await fetchLabs();
    return !error;
  };

  return { labs, loading, addLab, updateLab, deleteLab, refetch: fetchLabs };
}

// ─── Announcements ────────────────────────────────────────────────────────────
export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setAnnouncements(data as AnnouncementItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const addAnnouncement = async (ann: AnnouncementItem) => {
    const { error } = await supabase.from('announcements').insert([ann]);
    if (!error) await fetchAnnouncements();
    return !error;
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) await fetchAnnouncements();
    return !error;
  };

  return { announcements, loading, addAnnouncement, deleteAnnouncement, refetch: fetchAnnouncements };
}
