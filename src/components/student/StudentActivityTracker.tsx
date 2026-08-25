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
      }).eq('id', userId).then();
    }

    // Measure study time every 1 second
    const timer = setInterval(() => {
      useLearningStore.getState().addStudyTime(1);
    }, 1000);

    return () => clearInterval(timer);

  }, [pathname, userId]);

  // 2. Sync Progress Data (Store Changes) <-> Supabase
  useEffect(() => {
    if (!userId) {
      // ถ้าไม่มี user (logout) ให้เคลียร์ข้อมูลเก่าทิ้ง
      useLearningStore.getState().resetProgress();
      return;
    }

    let isSubscribed = true;
    let syncPending = false;
    let syncInterval: NodeJS.Timeout;
    let unsubscribeStore: () => void;

    const initializeData = async () => {
      // ดึงข้อมูลความก้าวหน้าจาก Supabase ของ User คนนี้มาทับในเครื่อง
      const { data } = await supabase.from('students').select('progress_data').eq('id', userId).single();
      
      if (data?.progress_data) {
        useLearningStore.setState({ ...data.progress_data, isHydrated: true });
      } else {
        useLearningStore.getState().resetProgress();
        useLearningStore.setState({ isHydrated: true });
      }

      // บอกให้ทุกหน้ารู้ว่า hydrate เสร็จแล้ว
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('progress-hydrated'));
      }

      if (!isSubscribed) return;

      // เมื่อดึงข้อมูลเสร็จ ค่อยเริ่มกระบวนการ Sync กลับไปที่ Supabase
      supabase.from('students').update({
        last_login_at: new Date().toISOString(),
        progress_data: useLearningStore.getState(),
      }).eq('id', userId).then();

      syncInterval = setInterval(() => {
        if (syncPending) {
          syncPending = false;
          supabase.from('students').update({
            progress_data: useLearningStore.getState(),
          }).eq('id', userId).then();
        }
      }, 5000);

      unsubscribeStore = useLearningStore.subscribe(() => {
        syncPending = true;
      });
    };

    initializeData();

    return () => {
      isSubscribed = false;
      if (syncInterval) clearInterval(syncInterval);
      if (unsubscribeStore) unsubscribeStore();

      // Final sync on unmount
      if (syncPending) {
        supabase.from('students').update({
          progress_data: useLearningStore.getState(),
        }).eq('id', userId).then();
      }
    };
  }, [userId]);


  return null; // Invisible component
}
