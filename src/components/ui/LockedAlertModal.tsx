import { Lock, X } from 'lucide-react';

export default function LockedAlertModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-soft-lg flex flex-col items-center text-center relative border border-slate-100">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-danger hover:bg-rose-50 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="w-16 h-16 bg-danger-light text-danger rounded-2xl flex items-center justify-center mb-4 shadow-soft-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">ภารกิจถูกล็อก!</h3>
        <p className="text-sm font-bold text-slate-500 mb-6 leading-relaxed">
          กรุณาทำภารกิจก่อนหน้าตามลำดับ<br/>ให้สำเร็จก่อนเข้าสู่เนื้อหานี้นะคะ
        </p>
        <button onClick={onClose} className="btn-minimal-primary w-full py-3.5 text-sm">
          เข้าใจแล้ว
        </button>
      </div>
    </div>
  );
}
