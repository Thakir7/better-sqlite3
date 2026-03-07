import React, { useState, useEffect } from 'react';
import { User, Proof } from '../types';
import { CheckCircle2, XCircle, Eye, FileText, Download, Users, TreePine, Edit2, Trash2, Search, Settings, Camera, Save } from 'lucide-react';

interface AdminDashboardProps {
  user: User;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'proofs' | 'users' | 'settings'>('proofs');
  const [pendingProofs, setPendingProofs] = useState<Proof[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [proofsRes, usersRes, settingsRes] = await Promise.all([
        fetch('/api/admin/pending-proofs'),
        fetch('/api/admin/users'),
        fetch('/api/settings')
      ]);
      setPendingProofs(await proofsRes.json());
      setUsers(await usersRes.json());
      setSettings(await settingsRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (proof: Proof) => {
    await fetch('/api/admin/approve-proof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: proof.request_id, volunteer_id: proof.volunteer_id })
    });
    setSelectedProof(null);
    fetchData();
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      });
      if (res.ok) {
        setEditingUser(null);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا العضو؟')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        setSettings(prev => ({ ...prev, [key]: value }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdateSetting(key, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = (type: string) => {
    alert(`جاري تصدير تقرير ${type}...`);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center py-12">جاري التحميل...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold serif">لوحة تحكم الإدارة</h2>
        <div className="flex gap-4">
          <button 
            onClick={() => handleExport('المتطوعين')}
            className="bg-white border border-stone-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-stone-50 transition-all"
          >
            <Download size={18} />
            <span>تقرير المتطوعين</span>
          </button>
          <button 
            onClick={() => handleExport('الإنجازات')}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-all"
          >
            <FileText size={18} />
            <span>التقرير الشامل</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl card-shadow w-fit">
        <button 
          onClick={() => setActiveTab('proofs')}
          className={`px-8 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'proofs' ? 'bg-primary text-white' : 'text-stone-500 hover:bg-stone-50'}`}
        >
          مراجعة الإنجازات ({pendingProofs.length})
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-8 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-primary text-white' : 'text-stone-500 hover:bg-stone-50'}`}
        >
          إدارة الأعضاء ({users.length})
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`px-8 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-primary text-white' : 'text-stone-500 hover:bg-stone-50'}`}
        >
          محتوى الموقع
        </button>
      </div>

      {activeTab === 'proofs' && (
        <div className="bg-white rounded-[2rem] card-shadow overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex items-center gap-2">
            <CheckCircle2 className="text-primary" size={24} />
            <h3 className="text-xl font-bold">مراجعة إثباتات الزراعة</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-stone-50 text-stone-500 text-sm">
                <tr>
                  <th className="p-4">المتطوع</th>
                  <th className="p-4">الشتلة</th>
                  <th className="p-4">العدد</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {pendingProofs.map(proof => (
                  <tr key={proof.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 font-semibold">{proof.volunteer_name}</td>
                    <td className="p-4">{proof.seedling_type}</td>
                    <td className="p-4">{proof.count}</td>
                    <td className="p-4 text-sm text-stone-500">اليوم</td>
                    <td className="p-4">
                      <button 
                        onClick={() => setSelectedProof(proof)}
                        className="flex items-center gap-1 text-primary hover:underline font-bold"
                      >
                        <Eye size={18} />
                        <span>عرض الصور</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingProofs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-stone-400">لا توجد إثباتات بانتظار المراجعة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-[2rem] card-shadow overflow-hidden">
          <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="text-primary" size={24} />
              <h3 className="text-xl font-bold">إدارة الأعضاء</h3>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute right-3 top-2.5 text-stone-400" size={18} />
              <input 
                type="text" 
                placeholder="بحث عن عضو..."
                className="w-full pr-10 pl-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-stone-50 text-stone-500 text-sm">
                <tr>
                  <th className="p-4">الاسم</th>
                  <th className="p-4">البريد</th>
                  <th className="p-4">الدور</th>
                  <th className="p-4">الموقع</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 font-semibold">{u.name}</td>
                    <td className="p-4 text-sm">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'nursery' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role === 'admin' ? 'مدير' : u.role === 'nursery' ? 'مشتل' : 'متطوع'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-stone-500">{u.location || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {u.status === 'active' ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingUser(u)}
                          className="p-2 text-stone-400 hover:text-primary transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { key: 'hero_image', label: 'صورة الواجهة الرئيسية (Hero)', desc: 'تظهر في أعلى الصفحة الرئيسية' },
            { key: 'stats_image', label: 'صورة قسم الإحصائيات', desc: 'تظهر بجانب قائمة المتطوعين المميزين' },
          ].map((item) => (
            <div key={item.key} className="bg-white p-8 rounded-[2rem] card-shadow space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="font-bold">{item.label}</h3>
                  <p className="text-xs text-stone-500">{item.desc}</p>
                </div>
              </div>

              <div className="relative aspect-video rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 group">
                <img 
                  src={settings[item.key]} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="bg-white text-stone-900 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer flex items-center gap-2">
                    <Camera size={18} />
                    <span>تغيير الصورة</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileChange(e, item.key)}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500">رابط الصورة المباشر</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs"
                    value={settings[item.key] || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
                  />
                  <button 
                    onClick={() => handleUpdateSetting(item.key, settings[item.key])}
                    className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition-all"
                  >
                    <Save size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Proof Review Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold serif">مراجعة إثبات الزراعة - {selectedProof.volunteer_name}</h3>
              <button onClick={() => setSelectedProof(null)} className="text-stone-400 hover:text-stone-600">
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="font-bold text-stone-500">قبل الزراعة</p>
                <img 
                  src={selectedProof.before_image_url} 
                  alt="Before" 
                  className="w-full h-64 object-cover rounded-2xl border border-stone-200"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-2">
                <p className="font-bold text-stone-500">بعد الزراعة</p>
                <img 
                  src={selectedProof.after_image_url} 
                  alt="After" 
                  className="w-full h-64 object-cover rounded-2xl border border-stone-200"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl">
              <p className="text-sm font-bold text-stone-500 mb-1">ملاحظات المتطوع:</p>
              <p>{selectedProof.notes || 'لا توجد ملاحظات'}</p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => handleApprove(selectedProof)}
                className="flex-1 bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                <span>اعتماد الإنجاز ومنح الساعات</span>
              </button>
              <button 
                onClick={() => {
                  const reason = prompt('سبب الرفض:');
                  if (reason) setSelectedProof(null);
                }}
                className="px-8 py-4 border border-red-200 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-all"
              >
                رفض الإثبات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] p-8 space-y-6">
            <h3 className="text-2xl font-bold serif">تعديل بيانات العضو</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">الاسم</label>
                <input 
                  type="text" required
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
                  value={editingUser.name}
                  onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">البريد الإلكتروني</label>
                <input 
                  type="email" required
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
                  value={editingUser.email}
                  onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">الدور</label>
                  <select 
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
                    value={editingUser.role}
                    onChange={e => setEditingUser({...editingUser, role: e.target.value as any})}
                  >
                    <option value="volunteer">متطوع</option>
                    <option value="nursery">مشتل</option>
                    <option value="admin">مدير</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">الحالة</label>
                  <select 
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
                    value={editingUser.status}
                    onChange={e => setEditingUser({...editingUser, status: e.target.value})}
                  >
                    <option value="active">نشط</option>
                    <option value="disabled">معطل</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">الموقع</label>
                <input 
                  type="text"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
                  value={editingUser.location || ''}
                  onChange={e => setEditingUser({...editingUser, location: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all">حفظ التعديلات</button>
                <button type="button" onClick={() => setEditingUser(null)} className="px-8 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
