'use client';

import TeacherSidebar from '@/components/layout/TeacherSidebar';
import StudentReportTable from '@/components/teacher/StudentReportTable';
import { Users } from 'lucide-react';

export default function TeacherReportsPage() {
  return (
    <div className="min-h-screen md:flex md:h-screen bg-[#F8FAFC] md:overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-soft-sm">
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> รายงานผลการเรียนรู้นักเรียน (Student Learning Reports)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ค้นหา กรองห้องเรียน ดูผลคะแนน Pre/Post-test พัฒนาการ และ Export ข้อมูลเป็นไฟล์ CSV / Excel
          </p>
        </div>

        <StudentReportTable />
      </div>
    </div>
  );
}
