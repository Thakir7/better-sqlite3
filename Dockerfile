# مرحلة البناء (Build stage)
FROM node:20-slim AS builder

WORKDIR /app

# تثبيت الأدوات اللازمة لبناء better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# نسخ ملفات الإعدادات
COPY package*.json ./

# استخدام npm install بدلاً من npm ci لتجنب أخطاء ملف الـ lock
RUN npm install

# نسخ بقية الكود وبناء الواجهة
COPY . .
RUN npm run build

# مرحلة التشغيل (Production stage)
FROM node:20-slim

WORKDIR /app

# تثبيت الأدوات اللازمة لتشغيل better-sqlite3 في البيئة النهائية
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# نسخ الملفات الضرورية فقط من مرحلة البناء
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/tsconfig.json ./

# تحديد المنفذ
EXPOSE 3000

# إعداد متغيرات البيئة
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/shatla.db

# إنشاء مجلد البيانات لقاعدة البيانات (Persistent Volume)
RUN mkdir -p /data

# أمر تشغيل التطبيق
CMD ["npm", "start"]
