'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

/**
 * Hook สำหรับป้องกันหน้านักเรียน
 * - ตรวจ Supabase session
 * - รอให้ progress hydrate จาก Supabase เสร็จก่อน (ป้องกัน redirect ก่อนข้อมูลมา)
 * - คืนค่า isHydrated เพื่อให้หน้าแสดง loading ระหว่างรอ
 */
export function useStudentAuth() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // ตรวจสอบ session ก่อน
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/student/login');
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
    });
  }, [router]);

  return { isHydrated };
}
