import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, UserRole } from '@/types';

interface AuthState {
  user: Profile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loginAsStudent: (firstName: string, lastName: string, seatNumber: string, className: string) => void;
  loginAsTeacher: (email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isAuthenticated: false,

      loginAsStudent: (firstName, lastName, seatNumber, className) => {
        const fullName = `${firstName || 'สมชาย'} ${lastName || 'รักการเรียน'}`.trim();
        const studentProfile: Profile = {
          id: `s-${Date.now()}`,
          role: 'student',
          full_name: fullName,
          first_name: firstName || 'สมชาย',
          last_name: lastName || 'รักการเรียน',
          seat_number: seatNumber || '1',
          class_name: className || 'ปวช. 1/1',
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${fullName}`,
          created_at: new Date().toISOString(),
        };
        set({ user: studentProfile, role: 'student', isAuthenticated: true });
      },

      loginAsTeacher: (email) => {
        const teacherProfile: Profile = {
          id: 't-001',
          role: 'teacher',
          full_name: 'อ.วิชัย ปัญญาเลิศ (ครูผู้สอน)',
          email: email || 'teacher@logic.ac.th',
          class_name: 'ทุกห้องเรียน (ปวช. 1)',
          avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=TeacherWichai',
          created_at: new Date().toISOString(),
        };
        set({ user: teacherProfile, role: 'teacher', isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, role: null, isAuthenticated: false });
      },
    }),
    {
      name: 'logic-e-learning-auth',
    }
  )
);
