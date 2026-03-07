import React, { useState, useEffect } from 'react';
import { User, VolunteerRequest, Proof } from '../types';
import { Clock, CheckCircle2, AlertCircle, Camera, Upload, MapPin, ExternalLink } from 'lucide-react';

interface VolunteerDashboardProps {
  user: User;
}

export default function VolunteerDashboard({ user }: VolunteerDashboardProps) {
  const [requests, setRequests] = useState<VolunteerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);
  const [proofData, setProofData] = useState({ before: '', after: '', notes: '' });

  const fetchRequests = async () => {
    try {
      const res = await fetch(`/api/requests/volunteer/${user.id}`);
      setRequests(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleStatusUpdate = async (id: number, status: string) => {
    await fetch(`/api/requests/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchRequests();
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadingFor) return;

    if (!proofData.before || !proofData.after) {
      alert('يرجى رفع صورتي قبل وبعد الزراعة');
      return;
    }

    try {
      const res = await fetch('/api/proofs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: uploadingFor,
          before_image_url: proofData.before,
          after_image_url: proofData.after,
          notes: proofData.notes
        })
      });
      if (res.ok) {
        setUploadingFor(null);
        setProofData({ before: '', after: '', notes: '' });
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
      alert('فشل رفع الإثبات');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofData(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const totalHours = requests.filter(r => r.status === 'approved_admin').length * 2;

  if (loading) return <div className="text-center py-12">جاري التحميل...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold serif">لوحة تحكم المتطوع</h2>
        <div className="bg-amber-100 text-amber-700 px-6 py-3 rounded-2xl flex items-center gap-3 card-shadow">
          <Clock size={24} />
          <div>
            <p className="text-xs opacity-80">رصيد الساعات</p>
            <p className="text-xl font-bold">{totalHours} ساعة</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {requests.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center card-shadow">
            <AlertCircle className="mx-auto text-stone-300 mb-4" size={48} />
            <p className="text-stone-500">لا يوجد لديك طلبات حالياً</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="bg-white p-6 rounded-3xl card-shadow flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{req.seedling_type}</h3>
                    <p className="text-stone-500 text-sm">المشتل: {req.nursery_name} | العدد: {req.count}</p>
                  </div>
                  <span className={`px-4 py-1 rounded-full text-xs font-bold ${
                    req.status === 'approved_admin' ? 'bg-green-100 text-green-700' :
                    req.status.includes('rejected') ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {req.status === 'pending_nursery' ? 'انتظار المشتل' :
                     req.status === 'approved_nursery' ? 'تمت الموافقة - يرجى الاستلام' :
                     req.status === 'picked_up' ? 'قيد التنفيذ' :
                     req.status === 'proof_uploaded' ? 'بانتظار مراجعة الإدارة' :
                     req.status === 'approved_admin' ? 'مكتمل وموثق' : req.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-stone-500 text-sm">
                  <MapPin size={16} />
                  <span>موقع الزراعة: {req.location}</span>
                </div>

                {req.status === 'approved_nursery' && (
                  <button 
                    onClick={() => handleStatusUpdate(req.id, 'picked_up')}
                    className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
                  >
                    تأكيد استلام الشتلات
                  </button>
                )}

                {req.status === 'picked_up' && (
                  <button 
                    onClick={() => setUploadingFor(req.id)}
                    className="bg-amber-500 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 transition-all flex items-center gap-2"
                  >
                    <Camera size={18} />
                    <span>رفع إثبات الزراعة</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {uploadingFor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold serif">رفع إثبات الزراعة</h3>
            <form onSubmit={handleProofSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold block">صورة قبل الزراعة</label>
                  <div className="relative h-40 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center bg-stone-50 hover:bg-stone-100 transition-all overflow-hidden">
                    {proofData.before ? (
                      <img src={proofData.before} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="text-stone-400 mb-2" size={32} />
                        <span className="text-xs text-stone-500">اختر صورة من الجهاز</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      required
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={e => handleFileChange(e, 'before')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold block">صورة بعد الزراعة</label>
                  <div className="relative h-40 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center bg-stone-50 hover:bg-stone-100 transition-all overflow-hidden">
                    {proofData.after ? (
                      <img src={proofData.after} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="text-stone-400 mb-2" size={32} />
                        <span className="text-xs text-stone-500">اختر صورة من الجهاز</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      required
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={e => handleFileChange(e, 'after')}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">ملاحظات إضافية</label>
                <textarea 
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl h-24"
                  value={proofData.notes}
                  onChange={e => setProofData({...proofData, notes: e.target.value})}
                />
              </div>
              <div className="flex gap-4">
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  <Upload size={18} />
                  <span>إرسال للإدارة</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setUploadingFor(null)}
                  className="px-8 py-3 border border-stone-200 rounded-xl font-bold hover:bg-stone-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
