import React, { useState, useEffect } from 'react';
import { User, Seedling, Role } from './types';
import Navbar from './components/Navbar';
import PublicView from './components/PublicView';
import Auth from './components/Auth';
import VolunteerDashboard from './components/VolunteerDashboard';
import NurseryDashboard from './components/NurseryDashboard';
import AdminDashboard from './components/AdminDashboard';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState('home');
  const [selectedSeedling, setSelectedSeedling] = useState<Seedling | null>(null);
  const [requestData, setRequestData] = useState({ count: 1, location: '' });

  // Load user from local storage
  useEffect(() => {
    const savedUser = localStorage.getItem('shatla_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      console.log('User loaded from storage:', parsedUser);
      setUser(parsedUser);
    }
  }, []);

  useEffect(() => {
    console.log('Current View:', view);
    console.log('Current User:', user);
  }, [view, user]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('shatla_user', JSON.stringify(userData));
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('shatla_user');
    setView('home');
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setView('auth');
      return;
    }
    if (!selectedSeedling) return;

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteer_id: user.id,
          seedling_id: selectedSeedling.id,
          count: requestData.count,
          location: requestData.location
        })
      });
      if (res.ok) {
        setSelectedSeedling(null);
        setView('dashboard');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderDashboard = () => {
    if (!user) return <Auth onLogin={handleLogin} />;
    switch (user.role) {
      case 'volunteer': return <VolunteerDashboard user={user} />;
      case 'nursery': return <NurseryDashboard user={user} />;
      case 'admin': return <AdminDashboard user={user} />;
      default: return <div>Role not recognized</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-stone-900">
      <Navbar user={user} onLogout={handleLogout} onNavigate={setView} />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PublicView onSelectSeedling={setSelectedSeedling} />
            </motion.div>
          )}

          {view === 'auth' && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Auth onLogin={handleLogin} />
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {renderDashboard()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Request Modal */}
      {selectedSeedling && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[2rem] p-8 space-y-6 relative"
          >
            <button 
              onClick={() => setSelectedSeedling(null)}
              className="absolute top-6 left-6 text-stone-400 hover:text-stone-600"
            >
              <X size={24} />
            </button>
            
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold serif">طلب شتلات: {selectedSeedling.type}</h3>
              <p className="text-stone-500">مقدم من {selectedSeedling.nursery_name}</p>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">العدد المطلوب</label>
                <input 
                  type="number" 
                  min="1" 
                  max={selectedSeedling.count}
                  required
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
                  value={requestData.count}
                  onChange={e => setRequestData({...requestData, count: parseInt(e.target.value)})}
                />
                <p className="text-xs text-stone-400">المتاح: {selectedSeedling.count} شتلة</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">موقع الزراعة المقترح</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: حديقة الحي، شارع الملك..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
                  value={requestData.location}
                  onChange={e => setRequestData({...requestData, location: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Send size={18} />
                <span>إرسال الطلب</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}

      <footer className="bg-stone-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h4 className="text-2xl font-bold serif text-primary">شتلة</h4>
            <p className="text-stone-400 text-sm">
              منصة وطنية تهدف لتعزيز الغطاء النباتي وتحفيز العمل التطوعي البيئي من خلال ربط المجتمع بالمشاتل المحلية.
            </p>
          </div>
          <div className="space-y-4">
            <h5 className="font-bold">روابط سريعة</h5>
            <ul className="text-stone-400 text-sm space-y-2">
              <li><button onClick={() => setView('home')}>الرئيسية</button></li>
              <li><button onClick={() => setView('home')}>الشتلات المتاحة</button></li>
              <li><button onClick={() => setView('auth')}>انضم كمتطوع</button></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="font-bold">تواصل معنا</h5>
            <p className="text-stone-400 text-sm">البريد: info@shatla.sa</p>
            <p className="text-stone-400 text-sm">الهاتف: 920000000</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/10 mt-12 pt-8 text-center text-stone-500 text-xs">
          جميع الحقوق محفوظة © شتلة 2026
        </div>
      </footer>
    </div>
  );
}
