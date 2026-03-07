# تعليمات نشر تطبيق "شتلة" (Shatla App Deployment)

لقد قمت بتجهيز الملفات اللازمة لنشر التطبيق بشكل احترافي. إليك الخطوات المطلوبة:

### 1. تجهيز الكود (GitHub)
*   قم برفع الكود الحالي إلى مستودع (Repository) خاص بك على **GitHub**.
*   تأكد من وجود الملفات التالية: `Dockerfile`, `.dockerignore`, `package.json`, `server.ts`.

### 2. الإعداد على منصة Railway
1.  قم بتسجيل الدخول إلى [Railway.app](https://railway.app/).
2.  اضغط على **New Project** ثم اختر **Deploy from GitHub repo**.
3.  اختر المستودع الخاص بك.
4.  **إعداد التخزين الدائم (Persistent Volume):**
    *   بعد إنشاء المشروع، اذهب إلى إعدادات الخدمة (**Settings**).
    *   ابحث عن قسم **Volumes** واضغط على **Add Volume**.
    *   قم بتسمية الـ Volume (مثلاً: `shatla-data`).
    *   اجعل مسار الربط (Mount Path) هو: `/data`.
5.  **إعداد متغيرات البيئة (Variables):**
    *   اذهب إلى تبويب **Variables** وأضف المتغيرات التالية:
        *   `NODE_ENV`: `production`
        *   `PORT`: `3000`
        *   `DATABASE_PATH`: `/data/shatla.db`
        *   `GEMINI_API_KEY`: (ضع مفتاح Gemini الخاص بك هنا)

### 3. ربط الدومين من Hostinger
1.  اذهب إلى لوحة تحكم **Hostinger** ثم إلى قسم **Domains**.
2.  اختر الدومين الخاص بك واذهب إلى إعدادات **DNS / Nameservers**.
3.  في Railway، اذهب إلى إعدادات الخدمة (**Settings**) ثم قسم **Domains**.
4.  اضغط على **Custom Domain** وأدخل الدومين الخاص بك (مثلاً: `shatla.sa`).
5.  ستعطيك Railway قيمة من نوع **CNAME**.
6.  في Hostinger، أضف سجل جديد:
    *   **Type:** `CNAME`
    *   **Name:** `@` (أو اتركه فارغاً للدومين الرئيسي)
    *   **Target:** (الصق القيمة التي حصلت عليها من Railway)
    *   **TTL:** اتركه كما هو (عادة 3600).

### ملاحظات هامة:
*   استخدام `/data/shatla.db` مع الـ Volume يضمن بقاء بياناتك حتى عند تحديث الكود أو إعادة تشغيل السيرفر.
*   تأكد من أن `PORT` في Railway هو `3000` ليتوافق مع إعدادات التطبيق.

بالتوفيق في إطلاق مشروع "شتلة"!
