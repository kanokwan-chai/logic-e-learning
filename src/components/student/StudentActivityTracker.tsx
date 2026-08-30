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

  // 1. ดึง user ID จริงจาก Supabase
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) setUserId(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Track Activity (Path Changes)
  useEffect(() => {
    if (!userId) return;

    const activity = getActivityFromPath(pathname);
    if (activity !== lastActivityRef.current) {
      lastActivityRef.current = activity;

      supabase.from('students').update({
        current_activity: activity,
        last_login_at: new Date().toISOString(),
      }).eq('id', userId).then((res) => {
        if (res.error) console.error("Failed to update activity:", res.error);
      });
    }
  }, [pathname, userId]);

  // 3. Hydrate Progress Data from Supabase
  useEffect(() => {
    if (!userId) return;

    let isSubscribed = true;

    const initializeData = async () => {
      const { data, error } = await supabase.from('students').select('progress_data').eq('id', userId).single();
      
      if (error && error.code === 'PGRST116') {
        if (window.location.pathname !== '/student/complete-profile') {
          window.location.href = '/student/complete-profile';
        }
        return;
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching progress:', error);
        useLearningStore.setState({ isHydrated: true });
        return;
      }

      if (data?.progress_data && isSubscribed) {
        // ใช้ข้อมูลจากฐานข้อมูล Supabase เป็นหลักเสมอ (Single Source of Truth)
        useLearningStore.setState({ ...data.progress_data, isHydrated: true });
      } else {
        useLearningStore.setState({ isHydrated: true });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('progress-hydrated'));
      }
    };

    initializeData();

    return () => {
      isSubscribed = false;
    };
  }, [userId]);

  return null;
}
