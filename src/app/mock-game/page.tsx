'use client';

import { useState } from 'react';
import { Gamepad2, Send, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function MockGamePage() {
  const [stage, setStage] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const questions = [
    { q: "ถ้า P เป็นจริง และ Q เป็นเท็จ แล้ว P ∧ Q มีค่าความจริงเป็นอะไร?", choices: ["จริง", "เท็จ"], answer: "เท็จ" },
    { q: "นิเสธของ 'จริง' คืออะไร?", choices: ["จริง", "เท็จ"], answer: "เท็จ" },
    { q: "T ∨ F ได้ผลลัพธ์เป็นอะไร?", choices: ["T", "F"], answer: "T" }
  ];

  const handleAnswer = (choice: string) => {
    if (choice === questions[stage].answer) {
      setScore(score + 500);
    }
    
    if (stage + 1 < questions.length) {
      setStage(stage + 1);
    } else {
      setIsFinished(true);
    }
  };

  const sendScore = () => {
    window.parent.postMessage({
      type: 'BOARD_GAME_COMPLETED',
      payload: {
        score: score,
        stagesCleared: questions.length,
        attempts: 1,
        timeSpent: 120
      }
    }, '*');
  };

  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center p-6 font-sans">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl space-y-6">
        <div className="w-20 h-20 bg-amber-400 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-amber-400/50">
          <Gamepad2 className="w-10 h-10 text-white" />
        </div>
        
        <div>
          <h1 className="text-xl font-black text-slate-800">มินิเกมตรรกศาสตร์</h1>
          <p className="text-xs text-slate-500 mt-2">เล่นเกมนี้ให้จบเพื่อทดสอบการส่งคะแนนอัตโนมัติ</p>
        </div>

        {!isFinished ? (
          <div className="space-y-4 text-left bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="text-xs font-bold text-amber-500 mb-2">คำถามที่ {stage + 1} / {questions.length}</div>
            <p className="font-bold text-slate-700 text-lg">{questions[stage].q}</p>
            <div className="grid grid-cols-2 gap-3 pt-4">
              {questions[stage].choices.map((c, i) => (
                <button 
                  key={i}
                  onClick={() => handleAnswer(c)}
                  className="py-3 rounded-xl bg-white border-2 border-slate-200 hover:border-amber-400 font-bold text-slate-700 transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h2 className="text-xl font-black text-emerald-700">จบเกม!</h2>
              <p className="text-sm font-bold text-emerald-600 mt-1">คุณได้คะแนน: {score} แต้ม</p>
            </div>
            
            <button 
              onClick={sendScore}
              className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm hover:bg-primary-hover transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> ส่งคะแนนกลับเข้าระบบเรียน
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
