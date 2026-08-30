'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useLearningStore } from '@/lib/store/useLearningStore';

// Map pathnames to readable activities
const getActivityFromPath = (path: string): string => {
  if (path === '/student/dashboard') return 'อยู่ที่หน้าแดชบอร์ดหลัก';
  if (path === '/student/lessons') return 'กำลังเลือกบทเรียน';
  if (path.startsWith('/student/lessons/')) return 'กำลังเรียนบทเรียน';
  if (path === '/student/game') return 'กำลังเล่น Digital Board Game';
  if (path === '/student/tests/pre_knowledge') return 'กำลังทำแบบทดสอบก่อนเรียน (ความรู้)';
  if (path === '/student/tests/pre_skill') return 'กำลังทำแบบทดสอบก่อนเรียน (ทักษะ)';
  if (path === '/student/tests/post_knowledge') return 'กำลังทำแบบทดสอบหลังเรียน (ความรู้)';
  if (path === '/student/tests/post_skill') return 'กำลังทำแบบทดสอบหลังเรียน (ทักษะ)';
  if (path === '/student/certificate') return 'อยู่ที่หน้าเกียรติบัตร';
  if (path === '/student/profile') return 'กำลังดูโปรไฟล์';
  if (path === '/student/complete-profile') return 'กำลังตั้งค่าโปรไฟล์';
  if (path === '/student/report') return 'กำลังดูรายงานผลการเรียน';
  return 'ออนไลน์อยู่ในระบบ';
};


export default function StudentActivityTracker() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const lastActivityRef = useRef<string>('');

  // ดึง user ID จริงจาก Supabase
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) setUserId(user.id);
    });

    // ฟัง auth state changes ด้วย (กรณี login/logout ระหว่างใช้งาน)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 1. Track Activity (Path Changes) & Study Time
  useEffect(() => {
    if (!userId) return;

    const activity = getActivityFromPath(pathname);
    if (activity !== lastActivityRef.current) {
      lastActivityRef.current = activity;

      // Fire and forget
      supabase.from('students').update({
        current_activity: activity,
        last_login_at: new Date().toISOString(),
      }).eq('id', userId).then((res) => {
        if (res.error) console.error("Failed to update activity:", res.error);
      });
    }

    // Measure study time every 1 second (DISABLED TO PREVENT MULTIPLE TABS FROM OVERWRITING DATABASE)
    // const timer = setInterval(() => {
    //   useLearningStore.getState().addStudyTime(1);
    // }, 1000);

    // return () => clearInterval(timer);

  }, [pathname, userId]);

  // 2. Sync Progress Data (Store Changes) <-> Supabase
  useEffect(() => {
    if (!userId) {
      return;
    }

    let isSubscribed = true;
    let debounceTimer: NodeJS.Timeout;
    let unsubscribeStore: () => void;

    const initializeData = async () => {
      // ดึงข้อมูลความก้าวหน้าจาก Supabase ของ User คนนี้มา
      const { data, error } = await supabase.from('students').select('progress_data').eq('id', userId).single();
      
      if (error && error.code === 'PGRST116') {
        if (window.location.pathname !== '/student/complete-profile') {
          window.location.href = '/student/complete-profile';
        }
        return;
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching progress:', error);
        return;
      }

      if (data?.progress_data) {
        const currentLocal = useLearningStore.getState();
        // รวมข้อมูลอย่างปลอดภัย ไม่ให้ข้อมูลใหม่ในเครื่องถูกเขียนทับเป็น null
        const merged = {
          ...data.progress_data,
          completedLessons: Array.from(new Set([...(data.progress_data.completedLessons || []), ...(currentLocal.completedLessons || [])])),
          preKnowledgeResult: currentLocal.preKnowledgeResult || data.progress_data.preKnowledgeResult || null,
          preSkillResult: currentLocal.preSkillResult || data.progress_data.preSkillResult || null,
          gameResult: currentLocal.gameResult || data.progress_data.gameResult || null,
          postKnowledgeResult: currentLocal.postKnowledgeResult || data.progress_data.postKnowledgeResult || null,
          postSkillResult: currentLocal.postSkillResult || data.progress_data.postSkillResult || null,
          isHydrated: true,
        };
        useLearningStore.setState(merged);
      } else {
        useLearningStore.setState({ isHydrated: true });
      }

      // แจ้งทุกคอมโพเนนต์ว่าโหลดเสร็จแล้ว
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('progress-hydrated'));
      }

      if (!isSubscribed) return;

      // เมื่อ State มีการเปลี่ยนแปลง ให้ซิงค์กลับไป Supabase ทันที (Debounce 200ms)
      unsubscribeStore = useLearningStore.subscribe((state) => {
        if (!state.isHydrated) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          supabase.from('students').update({
            last_login_at: new Date().toISOString(),
            progress_data: state,
          }).eq('id', userId).then((res) => {
            if (res.error) console.error("Failed to sync progress:", res.error);
          });
        }, 200);
      });
    };

    initializeData();

    return () => {
      isSubscribed = false;
      clearTimeout(debounceTimer);
      if (unsubscribeStore) unsubscribeStore();

      // บันทึกทันทีก่อน Unmount
      const currentState = useLearningStore.getState();
      if (currentState.isHydrated) {
        supabase.from('students').update({
          progress_data: currentState,
          last_login_at: new Date().toISOString(),
        }).eq('id', userId);
      }
    };
  }, [userId]);

  return null;
}
