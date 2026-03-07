import React, { useState, useEffect } from 'react';
import { User, Seedling, VolunteerRequest } from '../types';
import { Plus, Package, Check, X, AlertCircle, Info } from 'lucide-react';

interface NurseryDashboardProps {
  user: User;
}

export default function NurseryDashboard({ user }: NurseryDashboardProps) {
  const [requests, setRequests] = useState<VolunteerRequest[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSeedling, setNewSeedling] = useState({ type: '', count: 0, description: '', requirements: '', image_url: '' });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/requests/nursery/${user.id}`);
      setRequests(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddSeedling = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/seedlings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newSeedling, nursery_id: user.id })
    });
    setShowAddModal(false);
    setNewSeedling({ type: '', count: 0, description: '', requirements: '', image_url: '' });
  };

  const handleRequestAction = async (id: number, status: string, reason?: string) => {
    await fetch(`/api/requests/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, rejection_reason: reason })
    });
    fetchData();
  };

  if (loading) return <div className="text-center py-12">جاري التحميل...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold serif">لوحة تحكم المشتل</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-primary/90 transition-all card-shadow"
        >
          <Plus size={20} />
          <span>إضافة شتلات</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl card-shadow border-r-4 border-primary">
          <p className="text-stone-500 text-sm">طلبات بانتظار الموافقة</p>
          <p className="text-3xl font-bold">{requests.filter(r => r.status === 'pending_nursery').length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow border-r-4 border-blue-500">
          <p className="text-stone-500 text-sm">شتلات قيد التوزيع</p>
          <p className="text-3xl font-bold">{requests.filter(r => r.status === 'approved_nursery' || r.status === 'picked_up').length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl card-shadow border-r-4 border-green-500">
          <p className="text-stone-500 text-sm">إجمالي الشتلات الموزعة</p>
          <p className="text-3xl font-bold">{requests.filter(r => r.status === 'approved_admin').length}</p>
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
