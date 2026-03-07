import React from 'react';
import { Leaf, User, LogOut, LayoutDashboard, Home } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  user: UserType | null;
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

export default function Navbar({ user, onLogout, onNavigate }: NavbarProps) {
  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center card-shadow">
      <div 
        className="flex items-center gap-2 cursor-pointer" 
        onClick={() => onNavigate('home')}
      >
        <div className="bg-primary p-2 rounded-lg">
          <Leaf className="text-white w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-primary serif">شتلة</h1>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 text-stone-600 hover:text-primary transition-colors"
        >
          <Home size={18} />
          <span>الرئيسية</span>
        </button>

        {user ? (
          <>
            <button 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-1 text-stone-600 hover:text-primary transition-colors"
            >
              <LayoutDashboard size={18} />
              <span>لوحة التحكم</span>
            </button>
            <div className="flex items-center gap-3 border-r pr-6 border-stone-200">
              <div className="text-left">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-stone-500">
                  {user.role === 'admin' ? 'مدير' : user.role === 'nursery' ? 'صاحب مشتل' : 'متطوع'}
                </p>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors"
              >
                <LogOut size={20} />
              </button>
            </div>
          </>
        ) : (
          <button 
            onClick={() => onNavigate('auth')}
            className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <User size={18} />
            <span>تسجيل الدخول</span>
          </button>
        )}
      </div>
    </nav>
  );
}
