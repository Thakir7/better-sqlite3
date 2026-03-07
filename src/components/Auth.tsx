import React, { useState } from 'react';
import { User, LogIn, UserPlus, Phone, Mail, Lock, MapPin } from 'lucide-react';
import { Role, User as UserType } from '../types';

interface AuthProps {
  onLogin: (user: UserType) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<Role>('volunteer');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    location: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? { email: formData.email, password: formData.password } : { ...formData, role })
      });
      
      const data = await res.json();
      if (res.ok) {
        onLogin(data);
      } else {
        setError(data.error || 'حدث خطأ ما');
      }
    } catch (err) {
      setError('فشل الاتصال بالخادم');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white p-8 rounded-[2rem] card-shadow space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold serif">{isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}</h2>
          <p className="text-stone-500">انضم إلى مجتمع شتلة البيئي</p>
        </div>

        {!isLogin && (
          <div className="flex bg-stone-100 p-1 rounded-xl">
            <button 
              onClick={() => setRole('volunteer')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${role === 'volunteer' ? 'bg-white shadow-sm text-primary' : 'text-stone-500'}`}
            >
              متطوع
            </button>
            <button 
              onClick={() => setRole('nursery')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${role === 'nursery' ? 'bg-white shadow-sm text-primary' : 'text-stone-500'}`}
            >
              صاحب مشتل
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute right-3 top-3 text-stone-400" size={20} />
              <input 
                type="text" 
                placeholder="الاسم الكامل" 
                required
                className="w-full pr-10 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute right-3 top-3 text-stone-400" size={20} />
            <input 
              type="email" 
              placeholder="البريد الإلكتروني" 
              required
              className="w-full pr-10 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="relative">
            <Lock className="absolute right-3 top-3 text-stone-400" size={20} />
            <input 
              type="password" 
              placeholder="كلمة المرور" 
              required
              className="w-full pr-10 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          {!isLogin && (
            <>
              <div className="relative">
                <Phone className="absolute right-3 top-3 text-stone-400" size={20} />
                <input 
                  type="tel" 
                  placeholder="رقم الجوال" 
                  required
                  className="w-full pr-10 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="relative">
                <MapPin className="absolute right-3 top-3 text-stone-400" size={20} />
                <input 
                  type="text" 
                  placeholder="الموقع الجغرافي (المدينة)" 
                  required
                  className="w-full pr-10 pl-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button 
            type="submit"
            className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
            <span>{isLogin ? 'دخول' : 'إنشاء الحساب'}</span>
          </button>
        </form>

        <div className="text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-stone-500 hover:text-primary text-sm transition-colors"
          >
            {isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ سجل دخولك'}
          </button>
        </div>
      </div>
    </div>
  );
}
