import { StudentReportItem } from '@/types';

// Export Student Report Data to CSV
export function exportToCSV(data: any[], filename: string = 'รายงานนักเรียน_LogicLearn.csv') {
  const headers = [
    'เวลาที่เข้ามา',
    'รหัสนักศึกษา',
    'ชื่อ-นามสกุล',
    'ห้องเรียน',
    'คะแนนก่อนเรียน',
    'คะแนนก่อนทักษะ',
    'บทเรียนที่เรียนจบ',
    'เกม',
    'หลังเรียน',
    'หลังทักษะ',
  ];

  const rows = data.map((item: any) => {
    return [
      `"${item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString('th-TH') : '-'}"`,
      `"${item.student_id || '-'}"`,
      `"${item.full_name || '-'}"`,
      `"${item.class_name || '-'}"`,
      item.preKnowledge ?? 0,
      item.preSkill ?? 0,
      `"${item.completedLessons || 0}/5"`,
      item.gameScore ?? 0,
      item.postKnowledge ?? 0,
      item.postSkill ?? 0,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Format seconds into MM:SS or HH:MM
export function formatTimeSpent(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours} ชม. ${remMins} นาที`;
  }
  return `${mins} นาที ${secs} วินาที`;
}
