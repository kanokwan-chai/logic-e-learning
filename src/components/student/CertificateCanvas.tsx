'use client';

import { useRef } from 'react';
import { Award, Download } from 'lucide-react';

interface CertificateCanvasProps {
  studentName: string;
  studentId: string;
  className: string;
  completionDate?: string;
}

export default function CertificateCanvas({
  studentName,
  studentId,
  className,
  completionDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }),
}: CertificateCanvasProps) {
  const certRef = useRef<HTMLDivElement>(null);

  const downloadPDF = () => {
    // สร้าง style สำหรับ print และซ่อนทุกอย่างยกเว้น certificate
    const styleEl = document.createElement('style');
    styleEl.id = 'cert-print-style';
    styleEl.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');
      @media print {
        body * { visibility: hidden !important; }
        #cert-printable, #cert-printable * { visibility: visible !important; }
        #cert-printable {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          background: white !important;
          z-index: 99999 !important;
          padding: 20mm !important;
        }
        @page { size: A4 landscape; margin: 10mm; }
      }
    `;
    document.head.appendChild(styleEl);

    window.print();

    // ลบ style หลังจาก print dialog ปิด
    setTimeout(() => {
      const el = document.getElementById('cert-print-style');
      if (el) el.remove();
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Printable Certificate Area */}
      <div
        id="cert-printable"
        className="w-full max-w-4xl mx-auto rounded-3xl bg-white border-8 border-primary/20 shadow-soft-lg relative overflow-hidden text-center"
        style={{ fontFamily: "'Sarabun', sans-serif", padding: '48px 60px', backgroundColor: '#FFFFFF' }}
      >
        <div className="absolute inset-4 rounded-2xl border-2 border-primary/30 pointer-events-none" />

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center shadow-soft-md ring-4 ring-primary-light">
            <Award className="w-9 h-9" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-wide uppercase">
          Logic E-Learning
        </h1>

        <div className="my-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-amber-900 text-xs font-black shadow-soft-sm">
            🎓 ใบเกียรติบัตรเรียนจบวิชาตรรกศาสตร์
          </span>
        </div>

        <p className="text-xs text-slate-500 font-bold">ขอมอบใบเกียรติบัตรฉบับนี้เพื่อแสดงว่า</p>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary my-3 tracking-tight break-words px-4">
          {studentName}
        </h2>

        <p className="text-xs sm:text-sm font-bold text-slate-600">
          เลขที่: <span className="font-mono text-slate-800">{studentId}</span> | ห้องเรียน: <span className="text-slate-800">{className}</span>
        </p>

        <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-600 mt-4 leading-relaxed font-medium px-4 whitespace-pre-wrap">
          ได้สำเร็จการศึกษาหลักสูตรตรรกศาสตร์เบื้องต้น{'\n'}และผ่านการทดสอบกระบวนการคิดวิเคราะห์อย่างเต็มรูปแบบ
        </p>

        <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
          <div className="text-left">
            <p className="text-[10px] text-slate-400 font-bold">วันที่ออกใบประกาศ:</p>
            <p className="font-bold text-slate-700">{completionDate}</p>
            <p className="text-[10px] text-slate-400 font-mono font-bold mt-1">
              รหัสอ้างอิง: LOGIC-LE-2026-{String(studentId).padStart(4, '0')}
            </p>
          </div>

          <div className="text-right">
            <div className="inline-block text-center">
              <div className="font-script text-primary text-lg font-bold">Kru. Mail</div>
              <p className="text-[11px] font-extrabold text-slate-700 border-t border-slate-300 pt-1 mt-1">
                (ครูผู้สอนวิชาคณิตคอมฯ)
              </p>
              <p className="text-[9px] text-slate-400 font-bold">Logic E-Learning</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={downloadPDF}
          className="bg-primary hover:bg-primary-hover active:scale-95 px-8 py-4 rounded-2xl text-white text-sm font-black shadow-soft-lg flex items-center gap-3 transition-all cursor-pointer"
        >
          <Download className="w-5 h-5" /> โหลดใบเกียรติบัตรเก็บไว้ (PDF)
        </button>
      </div>
    </div>
  );
}
