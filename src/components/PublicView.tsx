import React, { useState, useEffect } from 'react';
import { Stats, Seedling, User } from '../types';
import { Leaf, Users, Clock, TreePine, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface PublicViewProps {
  onSelectSeedling: (seedling: Seedling) => void;
}

export default function PublicView({ onSelectSeedling }: PublicViewProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [seedlings, setSeedlings] = useState<Seedling[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, seedlingsRes, settingsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/seedlings'),
          fetch('/api/settings')
        ]);
        setStats(await statsRes.json());
        setSeedlings(await seedlingsRes.json());
        setSettings(await settingsRes.json());
      } catch (error) {
        console.error('Error fetching public data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <section className="relative h-[500px] rounded-3xl overflow-hidden card-shadow">
        <img 
          src={settings.hero_image || "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=2000"} 
          alt="Environmental volunteering"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center px-12 text-white">
          <motion.h2 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl font-bold mb-4 serif"
          >
            ازرع شتلة، <br />اصنع مستقبلاً أخضر
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl max-w-lg opacity-90"
          >
            منصة "شتلة" تربط أصحاب المشاتل بالمتطوعين البيئيين لزراعة الشتلات وتوثيق الأثر البيئي في مجتمعنا.
          </motion.p>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: TreePine, label: 'إجمالي الشتلات', value: stats?.totalSeedlings, color: 'bg-emerald-100 text-emerald-700' },
          { icon: Leaf, label: 'شتلات مزروعة', value: stats?.plantedSeedlings, color: 'bg-green-100 text-green-700' },
          { icon: Users, label: 'متطوعون نشطون', value: stats?.totalVolunteers, color: 'bg-blue-100 text-blue-700' },
          { icon: Clock, label: 'ساعات تطوعية', value: stats?.totalHours, color: 'bg-amber-100 text-amber-700' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl card-shadow flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-stone-500 text-sm">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Available Seedlings */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-3xl font-bold serif">الشتلات المتاحة</h3>
            <p className="text-stone-500">اختر الشتلة التي ترغب في زراعتها وابدأ رحلة التطوع</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {seedlings.map((seedling) => (
            <motion.div 
              key={seedling.id}
              whileHover={{ y: -10 }}
              className="bg-white rounded-3xl overflow-hidden card-shadow group"
            >
              <div className="h-56 overflow-hidden relative">
                <img 
                  src={seedling.image_url || `https://picsum.photos/seed/${seedling.type}/600/400`} 
                  alt={seedling.type}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold text-primary">
                  {seedling.count} شتلة متاحة
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-xl font-bold text-stone-800">{seedling.type}</h4>
                  <p className="text-sm text-stone-500">مقدم من: {seedling.nursery_name}</p>
                </div>
                <p className="text-stone-600 line-clamp-2 text-sm">{seedling.description}</p>
                <button 
                  onClick={() => onSelectSeedling(seedling)}
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <span>طلب تطوع</span>
                  <ArrowLeft size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Top Volunteers */}
      <section className="bg-secondary text-white p-12 rounded-[3rem] card-shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-4xl font-bold mb-6 serif">المتطوعون المميزون</h3>
            <p className="text-white/80 text-lg mb-8">
              نحتفي بأبطال البيئة الذين ساهموا بأكبر عدد من الساعات التطوعية في زراعة الشتلات.
            </p>
            <div className="space-y-4">
              {stats?.topVolunteers.map((vol, i) => (
                <div key={i} className="flex justify-between items-center bg-white/10 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-white/30">0{i + 1}</span>
                    <span className="font-semibold">{vol.name}</span>
                  </div>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{vol.hours} ساعة</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <img 
              src={settings.stats_image || "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=1000"} 
              alt="Planting"
              className="rounded-3xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
