# دليل النشر المبسط (Shatla App)

لقد قمنا بتبسيط عملية النشر لتكون أسهل وأكثر استقراراً باستخدام **Render.com** و **Supabase**.

## 1. تجهيز قاعدة البيانات (Supabase)
1. أنشئ حساباً مجانياً على [Supabase](https://supabase.com).
2. أنشئ مشروعاً جديداً (Project).
3. اذهب إلى **Project Settings** -> **Database**.
4. انسخ رابط الاتصال **Connection String** (تأكد من اختيار نمط `URI`). سيكون بهذا الشكل:
   `postgresql://postgres:[PASSWORD]@db.[ID].supabase.co:5432/postgres`

## 2. النشر على Render.com (الأسهل)
1. أنشئ حساباً على [Render.com](https://render.com) واربطه بـ GitHub.
2. اضغط على **New** -> **Web Service**.
3. اختر مستودع المشروع (Shatla App).
4. الإعدادات التلقائية:
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. اذهب إلى قسم **Environment Variables** وأضف المتغيرات التالية:
   - `DATABASE_URL`: (رابط Supabase الذي نسخته في الخطوة السابقة)
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: (مفتاح Gemini الخاص بك)
6. اضغط على **Create Web Service**.

## 3. ربط الدومين (Hostinger)
1. بعد اكتمال النشر على Render، سيعطيك رابطاً للموقع (مثلاً `shatla.onrender.com`).
2. اذهب إلى لوحة تحكم **Hostinger** -> **DNS / Nameservers**.
3. أضف سجل من نوع **CNAME**:
   - **Name**: `www`
   - **Target**: (رابط Render الخاص بك)
4. أضف سجل من نوع **A** (إذا كنت تريد توجيه الدومين الرئيسي):
   - اتبع تعليمات Render في قسم **Custom Domains**.

---

### لماذا هذه الطريقة أفضل؟
- **لا حاجة لـ Docker**: الموقع سيعمل تلقائياً بمجرد قراءة ملف `package.json`.
- **قاعدة بيانات سحابية**: بياناتك مخزنة بأمان على Supabase ولا تضيع عند تحديث الموقع.
- **مجانية**: كلا المنصتين توفران خطة مجانية ممتازة للبداية.
