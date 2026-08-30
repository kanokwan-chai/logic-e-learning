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
    if (!certRef.current) return;

    // เปิดหน้าต่างพิมพ์ที่มีแค่ใบเกียรติบัตร
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) return;

    const certHTML = certRef.current.outerHTML;

    printWindow.document.write(`
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>ใบเกียรติบัตร - ${studentName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Sarabun', sans-serif;
      background: white;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    @page {
      size: A4 landscape;
      margin: 10mm;
    }

    @media print {
      body { padding: 0; }
      .cert-wrapper { page-break-inside: avoid; }
      .no-print { display: none !important; }
    }

    .cert-wrapper {
      width: 100%;
      max-width: 900px;
      background: white;
      border: 8px solid #e0e7ff;
      border-radius: 24px;
      padding: 48px 60px;
      text-align: center;
      position: relative;
      box-shadow: 0 25px 60px rgba(0,0,0,0.12);
    }

    .cert-inner-border {
      position: absolute;
      inset: 12px;
      border: 2px solid #c7d2fe;
      border-radius: 16px;
      pointer-events: none;
    }

    .cert-icon {
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, #4f46e5, #3730a3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      box-shadow: 0 8px 24px rgba(79,70,229,0.4);
    }

    .cert-icon svg {
      width: 38px;
      height: 38px;
      stroke: white;
      fill: none;
      stroke-width: 2;
    }

    .cert-title {
      font-size: 28px;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .cert-badge {
      display: inline-block;
      background: #fef3c7;
      color: #78350f;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 16px;
      border-radius: 100px;
      margin: 20px 0;
    }

    .cert-label {
      font-size: 13px;
      color: #64748b;
      font-weight: 600;
    }

    .cert-name {
      font-size: 36px;
      font-weight: 800;
      color: #4f46e5;
      margin: 12px 0;
      line-height: 1.2;
    }

    .cert-meta {
      font-size: 13px;
      color: #475569;
      font-weight: 600;
    }

    .cert-meta span { color: #1e293b; }

    .cert-desc {
      max-width: 600px;
      margin: 20px auto;
      font-size: 14px;
      color: #475569;
      font-weight: 500;
      line-height: 1.7;
    }

    .cert-footer {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .cert-date-label {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 700;
    }

    .cert-date {
      font-size: 13px;
      color: #334155;
      font-weight: 700;
    }

    .cert-code {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 700;
      font-family: monospace;
      margin-top: 4px;
    }

    .cert-sign {
      text-align: right;
    }

    .cert-sign-name {
      font-size: 20px;
      font-weight: 700;
      color: #4f46e5;
      font-style: italic;
    }

    .cert-sign-title {
      font-size: 11px;
      font-weight: 800;
      color: #334155;
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
      margin-top: 4px;
    }

    .cert-sign-sub {
      font-size: 9px;
      color: #94a3b8;
      font-weight: 700;
    }

    .print-btn {
      display: block;
      margin: 30px auto 0;
      padding: 14px 40px;
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 14px;
      font-size: 15px;
      font-family: 'Sarabun', sans-serif;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(79,70,229,0.4);
    }

    .print-btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div style="width:100%; max-width: 1000px;">
    <div class="cert-wrapper">
      <div class="cert-inner-border"></div>

      <div class="cert-icon">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="6" stroke="white" stroke-width="2" fill="none"/>
          <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" stroke="white" stroke-width="2" fill="none"/>
        </svg>
      </div>

      <div class="cert-title">Logic E-Learning</div>

      <div class="cert-badge">🎓 ใบเกียรติบัตรเรียนจบวิชาตรรกศาสตร์</div>

      <div class="cert-label">ขอมอบใบเกียรติบัตรฉบับนี้เพื่อแสดงว่า</div>

      <div class="cert-name">${studentName}</div>

      <div class="cert-meta">
        เลขที่: <span>${studentId}</span> | ห้องเรียน: <span>${className}</span>
      </div>

      <div class="cert-desc">
        ได้สำเร็จการศึกษาหลักสูตรตรรกศาสตร์เบื้องต้น<br/>
        และผ่านการทดสอบกระบวนการคิดวิเคราะห์อย่างเต็มรูปแบบ
      </div>

      <div class="cert-footer">
        <div>
          <div class="cert-date-label">วันที่ออกใบประกาศ:</div>
          <div class="cert-date">${completionDate}</div>
          <div class="cert-code">รหัสอ้างอิง: LOGIC-LE-2026-${String(studentId).padStart(4, '0')}</div>
        </div>
        <div class="cert-sign">
          <div class="cert-sign-name">Kru. Mail</div>
          <div class="cert-sign-title">(ครูผู้สอนวิชาคณิตคอมฯ)</div>
          <div class="cert-sign-sub">Logic E-Learning</div>
        </div>
      </div>
    </div>

    <button class="print-btn no-print" onclick="window.print(); setTimeout(() => window.close(), 500);">
      🖨️ บันทึกเป็น PDF / พิมพ์ใบเกียรติบัตร
    </button>
  </div>
</body>
</html>
    `);

    printWindow.document.close();
    // รอโหลดฟอนต์ก่อนพิมพ์อัตโนมัติ
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 800);
    };
  };

  return (
    <div className="space-y-6">
      <div
        ref={certRef}
        className="w-full max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-white border-8 border-primary/20 shadow-soft-lg relative overflow-hidden text-center font-sans"
        style={{
          backgroundColor: '#FFFFFF',
        }}
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
          className="bg-primary hover:bg-primary-hover active:scale-95 px-8 py-4 rounded-2xl text-white text-sm font-black shadow-soft-lg flex items-center gap-3 transition-all"
        >
          <Download className="w-5 h-5" /> โหลดใบเกียรติบัตรเก็บไว้ (PDF)
        </button>
      </div>
    </div>
  );
}
