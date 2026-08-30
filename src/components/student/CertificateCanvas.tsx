'use client';

import { useRef, useState } from 'react';
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
  const [loading, setLoading] = useState(false);

  const downloadPDF = () => {
    // เปิดหน้าต่างใหม่ซิงโครนัสทันที (ก่อน async) เพื่อไม่ให้ popup blocker บล็อก
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Browser บล็อก popup กรุณาอนุญาต popup สำหรับเว็บนี้แล้วลองใหม่');
      return;
    }

    setLoading(true);

    printWindow.document.write(`<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <title>Certificate_LogicELearning.pdf</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800;900&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:100%;height:100%;background:#fff;font-family:'Sarabun',sans-serif;}
    @page{size:A4 landscape;margin:8mm;}
    @media screen{
      body{display:flex;justify-content:center;align-items:flex-start;padding:20px;}
    }
    @media print{
      body{padding:0;}
      .no-print{display:none!important;}
    }
    .cert{
      width:100%;max-width:920px;background:#fff;
      border:8px solid #e0e7ff;border-radius:24px;
      padding:40px 64px;text-align:center;position:relative;
    }
    .cert-inner{position:absolute;inset:12px;border:2px solid #c7d2fe;border-radius:16px;pointer-events:none;}
    .icon-wrap{
      width:68px;height:68px;background:linear-gradient(135deg,#4f46e5,#3730a3);
      border-radius:50%;display:flex;align-items:center;justify-content:center;
      margin:0 auto 18px;box-shadow:0 8px 24px rgba(79,70,229,.35);
    }
    .icon-wrap svg{width:36px;height:36px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
    .title{font-size:26px;font-weight:900;color:#1e293b;letter-spacing:3px;text-transform:uppercase;}
    .badge{display:inline-block;background:#fef3c7;color:#78350f;font-size:13px;font-weight:700;
      padding:6px 18px;border-radius:100px;margin:18px 0;}
    .label{font-size:12px;color:#64748b;font-weight:600;}
    .name{font-size:36px;font-weight:900;color:#4f46e5;margin:12px 0;line-height:1.3;}
    .meta{font-size:13px;color:#475569;font-weight:600;}
    .meta span{color:#1e293b;font-weight:700;}
    .desc{max-width:580px;margin:18px auto;font-size:14px;color:#475569;font-weight:500;line-height:1.8;}
    .footer{margin-top:36px;padding-top:20px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-end;}
    .date-label{font-size:10px;color:#94a3b8;font-weight:700;}
    .date-val{font-size:13px;color:#334155;font-weight:700;}
    .ref{font-size:10px;color:#94a3b8;font-weight:700;font-family:monospace;margin-top:4px;}
    .sign-name{font-size:20px;font-weight:700;color:#4f46e5;font-style:italic;}
    .sign-title{font-size:11px;font-weight:800;color:#334155;border-top:1px solid #cbd5e1;padding-top:5px;margin-top:4px;}
    .sign-sub{font-size:9px;color:#94a3b8;font-weight:700;}
    .btn{display:block;margin:24px auto 0;padding:13px 40px;
      background:#4f46e5;color:#fff;border:none;border-radius:14px;
      font-size:15px;font-family:'Sarabun',sans-serif;font-weight:700;
      cursor:pointer;box-shadow:0 4px 16px rgba(79,70,229,.35);}
    .btn:hover{background:#4338ca;}
  </style>
</head>
<body>
  <div>
    <div class="cert">
      <div class="cert-inner"></div>
      <div class="icon-wrap">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
      </div>
      <div class="title">Logic E-Learning</div>
      <div class="badge">🎓 ใบเกียรติบัตรเรียนจบวิชาตรรกศาสตร์</div>
      <div class="label">ขอมอบใบเกียรติบัตรฉบับนี้เพื่อแสดงว่า</div>
      <div class="name">${studentName}</div>
      <div class="meta">เลขที่: <span>${studentId}</span> &nbsp;|&nbsp; ห้องเรียน: <span>${className}</span></div>
      <div class="desc">ได้สำเร็จการศึกษาหลักสูตรตรรกศาสตร์เบื้องต้น<br/>และผ่านการทดสอบกระบวนการคิดวิเคราะห์อย่างเต็มรูปแบบ</div>
      <div class="footer">
        <div>
          <div class="date-label">วันที่ออกใบประกาศ:</div>
          <div class="date-val">${completionDate}</div>
          <div class="ref">รหัสอ้างอิง: LOGIC-LE-2026-${String(studentId).padStart(4,'0')}</div>
        </div>
        <div style="text-align:right;">
          <div class="sign-name">Kru. Mail</div>
          <div class="sign-title">(ครูผู้สอนวิชาคณิตคอมฯ)</div>
          <div class="sign-sub">Logic E-Learning</div>
        </div>
      </div>
    </div>
    <button class="btn no-print" onclick="window.print()">🖨️ บันทึกเป็น PDF</button>
  </div>
  <script>
    // รอโหลดฟอนต์ก่อนพิมพ์อัตโนมัติ
    document.fonts.ready.then(function(){
      setTimeout(function(){ window.print(); }, 600);
    });
  </script>
</body>
</html>`);

    printWindow.document.close();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Certificate Preview */}
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
          className="bg-primary hover:bg-primary-hover active:scale-95 disabled:opacity-60 px-8 py-4 rounded-2xl text-white text-sm font-black shadow-soft-lg flex items-center gap-3 transition-all cursor-pointer"
        >
          <Download className="w-5 h-5" /> บันทึกใบเกียรติบัตร (PDF)
        </button>
      </div>
    </div>
  );
}
