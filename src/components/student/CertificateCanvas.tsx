'use client';

import { useRef, useState } from 'react';
import { Award, Download, Loader2 } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);

  const downloadPDF = async () => {
    if (!certRef.current || loading) return;
    setLoading(true);
    try {
      // โหลด library แบบ dynamic เพื่อลด bundle size
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      // รอให้ฟอนต์โหลดครบก่อน
      await document.fonts.ready;
      // รอให้ CSS render เสร็จ
      await new Promise((r) => setTimeout(r, 300));

      const canvas = await html2canvas(certRef.current, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      // ขนาด A4 landscape (297 x 210 mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // คำนวณ ratio เพื่อให้ใบเกียรติบัตรพอดีกับหน้ากระดาษ
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const xOffset = (pdfWidth - imgWidth * ratio) / 2;
      const yOffset = (pdfHeight - imgHeight * ratio) / 2;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, imgWidth * ratio, imgHeight * ratio);

      // สร้าง Blob ที่มี MIME type เป็น application/pdf เพื่อให้ browser รู้จักและดาวน์โหลดเป็น .pdf จริงๆ
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'Certificate_LogicELearning.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Certificate Design */}
      <div
        ref={certRef}
        className="w-full max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-white border-8 border-primary/20 shadow-soft-lg relative overflow-hidden text-center font-sans"
        style={{ backgroundColor: '#FFFFFF' }}
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
          เลขที่: <span className="font-mono text-slate-800">{studentId}</span> | ห้องเรียน:{' '}
          <span className="text-slate-800">{className}</span>
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

      {/* Download Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={downloadPDF}
          disabled={loading}
          className="bg-primary hover:bg-primary-hover active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed px-8 py-4 rounded-2xl text-white text-sm font-black shadow-soft-lg flex items-center gap-3 transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> กำลังสร้าง PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" /> โหลดใบเกียรติบัตรเก็บไว้ (PDF)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
