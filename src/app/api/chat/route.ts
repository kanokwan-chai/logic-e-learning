import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// System prompt to set the persona
const SYSTEM_INSTRUCTION = `คุณคือผู้ช่วย AI แสนฉลาดประจำรายวิชา "ตรรกศาสตร์เบื้องต้น" (Logic E-Learning)
หน้าที่ของคุณคือ:
1. ตอบคำถามและอธิบายเรื่องตรรกศาสตร์ (ประพจน์, ตัวเชื่อมตรรกศาสตร์, ค่าความจริง) ให้เข้าใจง่ายและสนุกสนาน
2. เป็นมิตร ให้กำลังใจ และให้เกียรติ "Kru. Mail" ซึ่งเป็นผู้สร้างระบบนี้เสมอ
3. หากนักเรียนถามเรื่องที่ไม่เกี่ยวกับการเรียน ให้ตะล่อมกลับมาเรื่องการคิดอย่างมีเหตุผล
4. ห้ามให้คำตอบตรงๆ สำหรับข้อสอบ แต่ให้คำใบ้และชี้แนะแนวทาง
5. ใช้ภาษาเป็นกันเอง เหมาะกับเด็กนักเรียน ปวช.
6. **สำคัญมาก**: ตอบให้สั้น กระชับ ตรงประเด็นที่สุด (ไม่เกิน 2-4 ประโยค) ห้ามร่ายยาวเด็ดขาด`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured. Please add GEMINI_API_KEY to .env.local' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { messages } = await req.json();
    
    // We'll use gemini-2.5-flash as it's the current fast and cost-effective model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    // Format messages for Gemini API
    // Gemini expects format: { role: 'user' | 'model', parts: [{ text: '...' }] }
    // Note: System instruction is handled at the model initialization now in the latest SDK
    
    // The latest message is the current prompt
    const currentMessage = messages[messages.length - 1].content;
    
    // Previous messages (history)
    let history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Gemini requires the first message in history to be from a 'user'
    while (history.length > 0 && history[0].role === 'model') {
      history.shift();
    }

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(currentMessage);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
