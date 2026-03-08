import React, { useState, useEffect } from 'react';
import { User, Seedling, VolunteerRequest } from '../types';
import { Plus, Package, Check, X, AlertCircle, Info } from 'lucide-react';

interface NurseryDashboardProps {
  user: User;
}

export default function NurseryDashboard({ user }: NurseryDashboardProps) {
  const [requests, setRequests] = useState<VolunteerRequest[]>([]);
  const [seedlings, setSeedlings] = useState<Seedling[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSeedling, setNewSeedling] = useState({ type: '', count: 0, description: '', requirements: '', image_url: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      console.log('Fetching data for nursery:', user.id);
      const [reqRes, seedRes] = await Promise.all([
        fetch(`/api/requests/nursery/${user.id}`),
        fetch(`/api/seedlings/nursery/${user.id}`)
      ]);
      const reqData = await reqRes.json();
      const seedData = await seedRes.json();
      console.log('Requests received:', reqData);
      console.log('Seedlings received:', seedData);
      setRequests(reqData);
      setSeedlings(seedData);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddSeedling = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/seedlings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSeedling, nursery_id: user.id })
      });
      if (res.ok) {
        alert('تمت إضافة الشتلات بنجاح!');
        setShowAddModal(false);
        setNewSeedling({ type: '', count: 0, description: '', requirements: '', image_url: '' });
        fetchData();
      } else {
        const data = await res.json();
        alert('خطأ: ' + data.error);
      }
    } catch (e) {
      alert('فشل الاتصال بالخادم');
    }
  };

  const handleRequestAction = async (id: number, status: string, reason?: string) => {
    try {
      const res = await fetch(`/api/requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejection_reason: reason })
      });
      if (res.ok) {
        alert('تم تحديث حالة الطلب بنجاح');
        fetchData();
      }
    } catch (e) {
      alert('فشل تحديث الطلب');
    }
  };

  if (loading) return <div className="text-center py-12">جاري التحميل...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold serif">لوحة تحكم المشتل</h2>
          <p className="text-stone-500 text-sm">مرحباً بك، {user.name}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setLoading(true); fetchData(); }}
            className="p-3 bg-white border border-stone-200 rounded-2xl hover:bg-stone-50 transition-all card-shadow"
            title="تحديث البيانات"
          >
            <Package size={20} className="text-stone-600" />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-primary/90 transition-all card-shadow"
          >
            <Plus size={20} />
            <span>إضافة شتلات</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl card-shadow border-r-4 border-stone-400">
          <p className="text-stone-500 text-sm">إجمالي الشتلات المعلنة</p>
          <p className="text-3xl font-bold">
            {/* الإجمالي = المتاح حالياً + الموزع فعلياً (الموافق عليه) */}
            {seedlings.reduce((acc, s) => acc + s.count, 0) + 
             requests.filter(r => r.status !== 'pending_nursery' && !r.status.includes('rejected')).reduce((acc, r) => acc + r.count, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow border-r-4 border-amber-500">
          <p className="text-stone-500 text-sm">شتلات بانتظار الموافقة</p>
          <p className="text-3xl font-bold">
            {requests.filter(r => r.status === 'pending_nursery').reduce((acc, r) => acc + r.count, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow border-r-4 border-blue-500">
          <p className="text-stone-500 text-sm">شتلات قيد التوزيع</p>
          <p className="text-3xl font-bold">
            {requests.filter(r => ['approved_nursery', 'picked_up', 'proof_uploaded'].includes(r.status)).reduce((acc, r) => acc + r.count, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow border-r-4 border-green-500">
          <p className="text-stone-500 text-sm">إجمالي الشتلات الموزعة</p>
          <p className="text-3xl font-bold">
            {requests.filter(r => r.status === 'approved_admin').reduce((acc, r) => acc + r.count, 0)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] card-shadow overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center gap-2">
          <Package className="text-primary" size={24} />
          <h3 className="text-xl font-bold">طلبات التطوع الواردة</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-stone-50 text-stone-500 text-sm">
              <tr>
                <th className="p-4">المتطوع</th>
                <th className="p-4">النوع</th>
                <th className="p-4">العدد</th>
                <th className="p-4">الموقع</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-4 font-semibold">{req.volunteer_name}</td>
                  <td className="p-4">{req.seedling_type}</td>
                  <td className="p-4">{req.count}</td>
                  <td className="p-4 text-sm text-stone-500">{req.location}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      req.status === 'pending_nursery' ? 'bg-amber-100 text-amber-700' :
                      req.status === 'approved_nursery' ? 'bg-green-100 text-green-700' :
                      'bg-stone-100 text-stone-500'
                    }`}>
                      {req.status === 'pending_nursery' ? 'بانتظار قرارك' : 
                       req.status === 'approved_nursery' ? 'تمت الموافقة' : req.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {req.status === 'pending_nursery' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleRequestAction(req.id, 'approved_nursery')}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          title="موافقة"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            const reason = prompt('سبب الرفض:');
                            if (reason) handleRequestAction(req.id, 'rejected_nursery', reason);
                          }}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="رفض"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-stone-400">لا توجد طلبات حالياً</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] card-shadow overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center gap-2">
          <AlertCircle className="text-primary" size={24} />
          <h3 className="text-xl font-bold">الشتلات التي أعلنت عنها</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-stone-50 text-stone-500 text-sm">
              <tr>
                <th className="p-4">النوع</th>
                <th className="p-4">الكمية الكلية</th>
                <th className="p-4">المطلوب حالياً</th>
                <th className="p-4">المتبقي</th>
                <th className="p-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {seedlings.map(seed => {
                const approved = requests
                  .filter(r => r.seedling_id === seed.id && (r.status.includes('approved') || r.status === 'picked_up' || r.status === 'proof_uploaded'))
                  .reduce((acc, r) => acc + r.count, 0);
                const pending = requests
                  .filter(r => r.seedling_id === seed.id && r.status === 'pending_nursery')
                  .reduce((acc, r) => acc + r.count, 0);
                
                const total = seed.count + approved;
                const remaining = seed.count - pending;
                
                return (
                  <tr key={seed.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 font-semibold">{seed.type}</td>
                    <td className="p-4">{total}</td>
                    <td className="p-4 text-amber-600 font-bold">{pending}</td>
                    <td className="p-4 text-blue-600 font-bold">{remaining}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        remaining > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {remaining > 0 ? 'متاح' : 'نفذت الكمية'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {seedlings.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-stone-400">لم تقم بإضافة أي شتلات بعد</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] p-8 space-y-6">
            <h3 className="text-2xl font-bold serif">إضافة شتلات جديدة للتبرع</h3>
            <form onSubmit={handleAddSeedling} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">نوع الشتلة</label>
                  <input 
                    type="text" required
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
                    value={newSeedling.type}
                    onChange={e => setNewSeedling({...newSeedling, type: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">العدد المتاح</label>
                  <input 
                    type="number" required min="1"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
                    value={newSeedling.count}
                    onChange={e => setNewSeedling({...newSeedling, count: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">رابط الصورة</label>
                <input 
                  type="url"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl"
                  value={newSeedling.image_url}
                  onChange={e => setNewSeedling({...newSeedling, image_url: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">الوصف</label>
                <textarea 
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl h-24"
                  value={newSeedling.description}
                  onChange={e => setNewSeedling({...newSeedling, description: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all">حفظ ونشر</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
