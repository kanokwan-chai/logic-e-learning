'use client';

import { useEffect, useState } from 'react';
import { useLearningStore } from '@/lib/store/useLearningStore';

/**
 * Hook สำหรับรอให้ progress hydrate จาก Supabase เสร็จก่อน
 * - รอให้ StudentActivityTracker ดึงข้อมูลจาก DB มาเสร็จ
 * - คืนค่า isHydrated เพื่อให้หน้าแสดง loading ระหว่างรอ
 * - การป้องกันหน้า (route protection) ถูกจัดการที่ middleware แล้ว
 */
export function useStudentAuth() {
  const [isHydrated, setIsHydrated] = useState(false);
  const storeHydrated = useLearningStore((s) => s.isHydrated);

  useEffect(() => {
    // ถ้า store hydrate แล้ว (จาก StudentActivityTracker) ก็ใช้ได้เลย
    if (storeHydrated) {
      setIsHydrated(true);
      return;
    }

    // ฟังเหตุการณ์ hydration จาก StudentActivityTracker
    const onHydrated = () => setIsHydrated(true);
    window.addEventListener('progress-hydrated', onHydrated);

    // Fallback: ถ้า 3 วินาทีแล้วยังไม่ hydrate ก็ปล่อยผ่านไปก่อน
    const fallback = setTimeout(() => setIsHydrated(true), 3000);

    return () => {
      window.removeEventListener('progress-hydrated', onHydrated);
      clearTimeout(fallback);
    };
  }, [storeHydrated]);

  return { isHydrated };
}
