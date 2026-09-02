'use client';

import StudentSidebar from '@/components/layout/StudentSidebar';

/**
 * Responsive layout wrapper สำหรับทุกหน้านักเรียน
 * - Desktop: sidebar ซ้าย + content ขวา แบบ fixed height (h-screen)
 * - Mobile: sidebar เป็น drawer overlay, content scroll แบบปกติ
 */
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F8FAFC] font-sans md:flex md:h-[calc(100vh-140px)] md:overflow-hidden rounded-3xl shadow-sm border border-slate-200">
      <StudentSidebar />
      {/* pt-0 on desktop เพราะ sidebar อยู่ซ้าย, pt-16 on mobile เพราะ menu button อยู่บน */}
      <div className="flex-1 md:overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
