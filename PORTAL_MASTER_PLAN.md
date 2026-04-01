# Coolify Custom Portal (Reforged) - Master Plan & Setup Guide

เอกสารฉบับนี้รวบรวมแผนงาน เทคนิค สถาปัตยกรรม และคู่มือการติดตั้งของการสร้าง Custom Portal (สไตล์ Vercel) เพื่อครอบทับและทำงานร่วมกับระบบแกนหลักของ Coolify ตั้งแต่จุดเริ่มต้นจนถึงเป้าหมายสุดท้าย

---

## 🏗️ สถาปัตยกรรม (Architecture)

การทำงานของ Portal ระบบใหม่ ถูกออกแบบโดย **ไม่ทำลายระบบเก่า (Non-destructive)** โค้ดเดิมที่เป็น Livewire และ Blade ยังคงปกติดีทั้งหมด แต่เราสร้างเส้นทางและ Layer ใหม่เข้ามาเสริม:

1. **Frontend**: ใช้ **React.js + Tailwind CSS + Framer Motion + Lucide Icons** โดยเขียนแบบแนบเนียน (Glassmorphism & Vercel Aesthetic) คุมโทนสีเข้ม (Dark-mode primary) ผ่าน `resources/js/portal/`
2. **Bridge**: ใช้ **Inertia.js** เพื่อเชื่อมต่อระหว่างข้อมูลของฝั่ง Laravel กับ React ให้เป็น Single Page App (SPA) โดยไม่ต้องโหลดหน้าเว็บใหม่
3. **Backend**: สร้าง Controller คู่ขนานภายใต้ `App\Http\Controllers\Portal` เพื่อส่งข้อมูลผ่าน `$request->user()->currentTeam()` แบบเดียวกับระบบเดิม

---

## ✅ สิ่งที่ทำเสร็จไปแล้ว (Completed)

> [!NOTE]
> ฟีเจอร์หลักทั้งหมดที่ใช้สำหรับ Dashboard ส่วนหน้าบ้านถูกพัฒนาและเชื่อมต่อกับ Core Logic แล้ว

1. **โครงสร้างพื้นฐาน (Scaffolding)**
   - ผูก `vite.config.js` ให้รันไฟล์ฝั่ง Portal แยกจากระบบเดิม (แยก Entrypoint `portal.css` และ `portal.jsx`)
   - นำเข้าฟอนต์ Geist หรือ Inter และตีกรอบ `resources/css/portal.css` เพื่อครอบการแสดงผลทั้งหมดไม่ให้กระทบ UI เก่า
2. **ระบบยืนยันตัวตน (Authentication & Auth Flow)**
   - Override ระบบล็อกอินหลักของ Laravel (`FortifyServiceProvider`) ให้มาใช้ไฟล์หน้า `Login.jsx` แทนที่หน้า Blade เดิม
   - เขียนเงื่อนไข Redirect หลังเข้าสู่ระบบสำเร็จให้วิ่งมาที่ `/portal` ทันที แทนที่จะเป็น `/`
   - รองรับปุ่ม OAuth (Github, Gitlab, Bitbucket) ตามที่ตั้งค่าไว้แบบไดนามิก
3. **Dashboard & Layouts**
   - **`PortalLayout.jsx`**: แถบนำทางด้านบน (Navbar) พร้อม Sub-nav ที่สามารถระบุพิกัดว่าเราอยู่ที่ Project ไหน
   - **`Dashboard.jsx`**: หน้ารวมโปรเจกต์ทั้งหมด (Projects Grid View) พร้อมแสดงกล่องสถานะสวยงาม และมีช่องค้นหาแบบ Real-time (Client-side Search)
4. **Project Details & Resources Grid**
   - **`Show.jsx`**: ลิสต์รายการ Application, Service และ Database ออกมาเป็นตาราง/Grid พร้อมสถานะ (Running, Stopped ฯลฯ)
   - **Environment Switcher**: เพิ่ม Dropdown เลือก Environment พร้อมเชื่อมโยงข้อมูล Resources แบบไดนามิก
5. **ระบบจัดการ Resource (Action Buttons)**
   - เชื่อมปุ่ม "Start", "Stop", "Restart" ให้ทำงานผ่าน Controller พิเศษ `ResourceActionController.php`
   - สั่งการผ่าน Inertia `router.post()` ทำให้ UI หมุน (Loading spinner) ระหว่างรอคำสั่งเข้าคิวของ Native Coolify

---

## ⏳ สิ่งที่ต้องทำต่อไป (To Do)

ส่วนนี้เป็นเป้าหมายในอนาคตเพื่อทำให้ Portal สมบูรณ์ที่สุด:

- `[ ]` **Deep Links Configuration**: เนื่องจาก Portal ออกแบบมาให้ "ดูเรียบง่าย" ปุ่ม Setting (รูปฟันเฟือง) จะลิงก์หน้าต่างใหม่กลับไปที่หน้า Livewire ดั้งเดิมเพื่อให้ผู้ใช้แก้ไขตัวแปรลึกๆ (Env, Deploy) ได้
- `[ ]` **Creation Flow (Add Resource)**: สร้างหน้าต่างหรือ Modal แบบ Vercel เวลาผู้ใช้ต้องการเพิ่ม App, Database, หรือ Service ใหม่ ให้เลือกจากรูปไอคอนสวยๆ ใน Portal
- `[ ]` **Team Switcher & Settings Profile**: เพิ่มเมนูการปรับแต่ง Profile หรือ สลับ Team ด้านบนขวาแทนที่สัญลักษณ์ย่อตัวอักษร

---

## ⚙️ การติดตั้ง (Installation & Setup)

หากมีการนำโปรเจกต์นี้ไปติดตั้งใหม่ หรือรันบนเครื่องอื่นๆ ให้ปฏิบัติตามขั้นตอนนี้:

### 1. ติดตั้ง NPM Packages ฝั่ง Frontend
เนื่องจากเราได้เพิ่ม React และไอบรารี่ที่เกี่ยวข้องลงไป คุณต้องรัน:
```bash
npm install # หรือ npm ci (หากมีปัญหาเวอร์ชั่น)
npm install @inertiajs/inertia @inertiajs/react react react-dom framer-motion lucide-react clsx tailwind-merge
```

### 2. อัปเดตและ Compile โค้ด
รัน Vite เพื่อ Build Bundle สร้างไฟล์สำหรับหน้า Production
```bash
npm run build
```

*(หากคุณอยู่บนสภาพแวดล้อมที่ตั้งใจรันใน Development ให้ใช้ `npm run dev` เพื่อทำ HMR ให้ไฟล์อัปเดตแบบ Realtime ได้)*

### 3. Clear Cache ระบบ Laravel
ทุกครั้งที่มีการอัปเดต Route ใหม่ๆ หรือแก้ การเชื่อมต่อไปยัง Fortify
```bash
php artisan optimize:clear
php artisan view:clear
php artisan route:clear
```

### 4. การตั้งค่า Environment / Configuration (`.env`)
ระบบ Portal พึ่งพาการล็อกอินด้วย Session พิเศษ กรุณาเช็คให้แน่ใจว่าตัวแปรต่อไปนี้มีอยู่จริง หรืออ้างอิงของเดิม:
```env
APP_URL=http://localhost:8000 # หรือโดเมนจริง
SESSION_DRIVER=redis # ควรใช้ Redis ถ้าเป็นไปได้
```

---

## 🔎 สรุปภาพรวมโค้ดสำคัญ

- **หน้าบ้าน (UI)**: ทุกอย่างเขียนใน `resources/js/portal/`
- **เครื่องเจาะระบบ (Router)**:
  - `routes/web.php` (ภายใน Block `prefix('portal')`)
- **สมองกล (Controllers)**:
  - `app/Http/Controllers/Portal/DashboardController.php` (ดึงข้อมูล)
  - `app/Http/Controllers/Portal/AuthController.php` (Login/Logout)
  - `app/Http/Controllers/Portal/ResourceActionController.php` (Restart/Stop/Start)
- **สิทธิเข้าถึงหน้า Login (Fortify)**: `app/Providers/FortifyServiceProvider.php` (ดูตรงส่วนของ `$this->app->singleton(LoginResponse::class)` และ `Fortify::loginView`)

> [!TIP]
> **การแก้ไขปัญหา**: หากพบว่าหน้า Portal แสดงผลพัง ลองตรวจเช็คหน้าต่าง Network Inspector ว่าระบบสามารถดึง Asset เช่น `build/assets/portal.css` ออกมาได้หรือไม่ (ถ้าไม่ได้ ให้ไปรัน `npm run build` ใหม่)
