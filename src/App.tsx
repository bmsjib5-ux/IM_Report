import { useState } from 'react';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import { isSupabaseConfigured } from './services/supabase';
import { getCurrentUser, logout } from './services/auth';
import type { UserSession } from './services/auth';

function App() {
  const [user, setUser] = useState<UserSession | null>(getCurrentUser());

  // ถ้ายังไม่ได้ตั้งค่า Supabase → เข้า Dashboard ตรงเลย (ไม่ต้อง login)
  if (!isSupabaseConfigured()) {
    return <Dashboard />;
  }

  // ยังไม่ login → แสดงหน้า Login
  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  // login แล้ว → แสดง Dashboard พร้อม user info
  return (
    <Dashboard
      user={user}
      onLogout={() => {
        logout();
        setUser(null);
      }}
    />
  );
}

export default App;
