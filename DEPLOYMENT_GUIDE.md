# 🚀 คู่มือการนำเกม POE Idle ขึ้นออนไลน์ (Deploy Guide)

คู่มือนี้จะพาคุณนำเกมขึ้นออนไลน์ฟรี 100% โดยใช้ **Supabase + Render + Vercel** ครับ

---

## 🗄️ ขั้นตอนที่ 1: ตั้งค่าฐานข้อมูลใน Supabase (ใช้เวลา 1 นาที)

1. เข้าหน้าเว็บ [supabase.com](https://supabase.com/) แล้วเปิดโปรเจกต์ของคุณ
2. ที่เมนูด้านซ้าย เลือก **SQL Editor**
3. กดปุ่ม **New query**
4. เปิดไฟล์ `supabase_schema.sql` ในโฟลเดอร์นี้ แล้วคัดลอกโค้ดทั้งหมดไปวางใน SQL Editor
5. กดปุ่ม **Run** (ปุ่มเขียว)
   - *สำเร็จ! ตอนนี้ฐานข้อมูลของคุณมีตาราง `characters` พร้อมระบบจัดอันดับ Leaderboard แล้ว*

---

## 🐙 ขั้นตอนที่ 2: นำโค้ดขึ้น GitHub

หากในเครื่องยังไม่มีโปรแกรม **Git**:
* สามารถพิมพ์ให้ AI ติดตั้งผ่าน `winget` ให้ได้เลย หรือดาวน์โหลด [Git for Windows](https://git-scm.com/) / [GitHub Desktop](https://desktop.github.com/)

เมื่อมี Git แล้ว ทำตามคำสั่งนี้:
```bash
git init
git add .
git commit -m "Initial POE Idle commit"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
git push -u origin main
```

---

## ⚔️ ขั้นตอนที่ 3: ขึ้น Game Server บน Render.com (ฟรี)

1. เข้าเว็บ [render.com](https://render.com/) แล้วล็อกอินด้วย GitHub
2. กดปุ่ม **New +** -> เลือก **Web Service**
3. เลือก Repository `poe-idle` ของคุณ
4. ตั้งค่าดังนี้:
   - **Name:** `poe-idle-server`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. กดปุ่ม **Create Web Service**
6. เมื่อสร้างเสร็จ Render จะให้ URL มา เช่น: `https://poe-idle-server.onrender.com`
   - **จำ URL นี้ไว้สำหรับขั้นตอนถัดไป** (เปลี่ยน `https://` เป็น `wss://`)

---

## 🌐 ขั้นตอนที่ 4: ขึ้นหน้าเว็บ Frontend บน Vercel.com (ฟรี)

1. เข้าเว็บ [vercel.com](https://vercel.com/) แล้วล็อกอินด้วย GitHub
2. กด **Add New...** -> เลือก **Project**
3. เลือก Repository `poe-idle` แล้วกด **Import**
4. ในหน้าตั้งค่า:
   - **Root Directory:** กด Edit แล้วเลือกโฟลเดอร์ `client`
   - **Environment Variables:**
     - Key: `VITE_SERVER_URL`
     - Value: `wss://poe-idle-server.onrender.com` *(ใส่ URL จาก Render ในขั้นตอนที่ 3)*
5. กด **Deploy**

🎉 **เสร็จเรียบร้อย!** 
คุณจะได้ URL ประจำเกม เช่น `https://poe-idle.vercel.app` ซึ่งสามารถส่งให้เพื่อนเปิดเล่นพร้อมกันจากคอมหรือมือถือเครื่องไหนก็ได้ในโลกเลยครับ!
