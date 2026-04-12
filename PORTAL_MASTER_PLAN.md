# Coolify Custom Portal (Reforged) - Master Plan & Setup Guide

เอกสารฉบับนี้รวบรวมแผนงาน เทคนิค สถาปัตยกรรม และคู่มือการติดตั้งของการสร้าง Custom Portal (สไตล์ Vercel) เพื่อครอบทับและทำงานร่วมกับระบบแกนหลักของ Coolify ตั้งแต่จุดเริ่มต้นจนถึงเป้าหมายสุดท้าย

---

## 🏗️ สถาปัตยกรรม (Architecture)

การทำงานของ Portal ระบบใหม่ ถูกออกแบบโดย **ไม่ทำลายระบบเก่า (Non-destructive)** โค้ดเดิมที่เป็น Livewire และ Blade ยังคงปกติดีทั้งหมด แต่เราสร้างเส้นทางและ Layer ใหม่เข้ามาเสริม:

1. **Frontend**: ใช้ **React.js + Tailwind CSS + Framer Motion + Lucide Icons** โดยเขียนแบบแนบเนียน (Glassmorphism & Vercel Aesthetic) คุมโทนสีเข้ม (Dark-mode primary) ผ่าน `resources/js/portal/`
2. **Bridge**: ใช้ **Inertia.js** เพื่อเชื่อมต่อระหว่างข้อมูลของฝั่ง Laravel กับ React ให้เป็น Single Page App (SPA) โดยไม่ต้องโหลดหน้าเว็บใหม่
3. **Backend**: สร้าง Controller คู่ขนานภายใต้ `App\Http\Controllers\Portal` เพื่อส่งข้อมูลผ่าน `$request->user()->currentTeam()` แบบเดียวกับระบบเดิม

---

## 🌳 กฎการจัดการเวอร์ชัน (Git Branching & Syncing)

ระบบพัฒนาอยู่ภายใต้กฎเหล็กการแยกกิ่ง (Branching Strategy) เพื่อให้สามารถรับอัปเดตจาก Coolify ต้นฉบับได้อย่างราบรื่น:

1. **ห้ามแก้ไขโค้ดใน `main` หรือ `master` เด็ดขาด!** กิ่งหลักมีหน้าที่คงสภาพให้ตรงกับ Upstream เสมอ
2. **กิ่งทำงานหลัก**: `feature/shared-hosting` (หรือกิ่งฟีเจอร์อื่นๆ) จะเป็นที่สำหรับเขียนโค้ดเพิ่มฟังก์ชันลักษณะ CyberPanel (Shared Hosting) หรือ Portal นี้

### วิธีการอัปเดต (The Syncing Process)
เมื่อ Coolify ต้นฉบับมีการอัปเดตเวอร์ชันใหม่ ให้ทำตาม Workflow นี้:
```bash
# 1. ไปที่กิ่งหลักของคุณ
git checkout main

# 2. ดึงของใหม่มา (ตอนนี้ main ในเครื่องคุณจะล้ำหน้าเหมือนต้นฉบับแล้ว)
git pull upstream main 

# 3. เอาของใหม่ไปรวมกับกิ่งฟีเจอร์ที่คุณแก้
git checkout feature/shared-hosting
git merge main
```

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
6. **ระบบจัดการ Database (Advanced Management - High Parity)**
    - บรรลุ Feature Parity 100% เทียบเท่า dashboard หลักของ Coolify
    - แยก Tab ชัดเจน: Connection, Performance (Metrics), Logs (Stylized Terminal), Backups, Environment และ Settings
    - ระบบ Deletion Flow ที่ปลอดภัย (Graceful Stop + Volume/Cleanup options)
7. **Email Server Settings**
    - พัฒนาหน้าจอตั้งค่า Email สำหรับ Team โดยเฉพาะ รองรับการเชื่อมต่อผ่าน SMTP และ Resend API
    - ระบบ "Use Instance Settings" fallback และยูทิลิตี้ "Send Test Email"
8. **Real-time Synchronization & Health Metrics**
    - ติดตั้ง Laravel Echo เชื่อมต่อกับ Soketi อัปเดตสถานะแบบ Real-time
    - MetricsChart (Premium UI) สำหรับ CPU/RAM Usage
9. **ระบบจัดการ Service (Service Stack Logic)**
    - แสดงโครงสร้าง ServiceApplications และ ServiceDatabases ภายใต้ Stack เดียวกัน
10. **Application & Service Portal Revamp (High Parity)**
    - ปรับปรุงหน้า Application และ Service ให้มี Tabbed UI มาตรฐานเดียวกับ Database
    - ระบบ Log Streaming แบบ Real-time ที่รองรับการสลับ Target ใน Service Stack
    - Standardized Action Buttons และ Danger Zone ครบทุก Resource Type

---

## ⏳ สิ่งที่ต้องทำต่อไป (To Do)

ส่วนนี้เป็นเป้าหมายในอนาคตเพื่อทำให้ Portal สมบูรณ์ที่สุด:

- `[x]` **Application & Service UI Parity**: ปรับปรุงหน้า Application และ Service ให้มี Tabbed UI มาตรฐานเดียวกับ Database (เพิ่ม dedicated Logs & Backups tab)
- `[x]` **Deep Links Configuration**: ปุ่ม Setting (รูปฟันเฟือง) ลิงก์หน้าต่างใหม่กลับไปที่หน้า Livewire ดั้งเดิม
- `[x]` **Creation Flow (Add Resource)**: สร้างหน้าต่างหรือ Modal แบบ Vercel สำหรับเลือก Type ของ Resource ที่ต้องการสร้าง
- `[x]` **Team Switcher & Settings Profile**: ระบบสลับ Team และจัดการสิทธิ์ User

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

---

## 🚀 แผนพัฒนาฟีเจอร์แชร์โฮสติ้ง (Shared Hosting / CyberPanel-like Features)

ส่วนต่อขยายที่เหนือกว่าระบบจัดการ Docker ปกติของ Coolify สู่การเป็น One-Stop Hosting Platform สำหรับลูกค้าแบบครบวงจร (`onetapweb.com`):

### 1. หมวดหมู่: ระบบหลังบ้าน (Legacy Hosting Suite)
ฟังก์ชันที่ CyberPanel มี แต่เดิม Coolify ไม่มี (หรือทำได้ยาก):
- **Email Server**: ระบบสร้าง Email Account (`@domain.com`) พร้อม Webmail (เสมือนการเพิ่ม "ตู้จดหมาย" ให้แต่ละห้องพัก)
- **DNS Management**: จัดการ Record (A, CNAME, MX) ผ่านหน้า UI (เสมือนมี "ป้ายบอกทาง" หน้าหอพัก)
- **File Manager**: หน้าเว็บสำหรับ Upload/Edit/Unzip ไฟล์โดยตรง (เสมือนมี "กุญแจไขเข้าห้อง" ให้ลูกค้าเข้าไปจัดเฟอร์นิเจอร์เองได้)
- **Database Manager**: ระบบจัดการ DB User และ Database แบบแชร์ทรัพยากร (เสมือนมี "ถังเก็บน้ำส่วนกลาง" แล้วแยกมิเตอร์น้ำเอา)

### 2. หมวดหมู่: การคุมทรัพยากร (Resource & Quota)
หัวใจสำคัญของการทำ Shared Hosting เพื่อไม่ให้ลูกค้ารายใดรายหนึ่งดึงสเปคเซิร์ฟเวอร์หลัก (เช่น Dell R230) จนค้างเต็มพิกัด:
- **RAM/CPU Limiter**: ล็อกสเปค Docker Container ตามแพ็กเกจที่ลูกค้าซื้อ (เช่น 512MB / 1 Core)
- **Disk Quota**: จำกัดพื้นที่เก็บข้อมูลของแต่ละ User ไม่ให้ใช้จน Harddisk เต็ม
- **Bandwidth Monitor**: ติดตามการรับ-ส่งข้อมูล เพื่อดูว่าใครดึงเน็ตเยอะผิดปกติ

### 3. หมวดหมู่: ประสบการณ์ผู้ใช้ (User Experience)
เปลี่ยนหน้าตาจาก "เครื่องมือ Dev" ให้เป็น "หน้าจอลูกค้าทั่วไป":
- **One-Click Installer**: ปุ่มกดติดตั้ง WordPress, Laravel, Ghost หรือแอปยอดนิยมในคลิกเดียว
- **Client Dashboard**: หน้า UI (React) แบบเรียบง่าย ตัดเมนูเทคนิคของฝั่ง Coolify เดิมทิ้ง ให้เหลือแค่ปุ่มที่ลูกค้าใช้งานจริงๆ (ดำเนินการใกล้เสร็จสมบูรณ์ในเฟสแรก)
- **Backup & Restore**: ระบบสำรองข้อมูลไปยัง S3 หรือ External Storage ให้ลูกค้ากดกู้คืนด้วยตัวเองเผื่อพลาดลบลืมสำรองไฟล์

### 4. หมวดหมู่: การทำธุรกิจ (SaaS Layer)
โครงสร้างหลักสำหรับใช้เปิดบริหารแพลตฟอร์มธุรกิจ (`onetapweb.com`):
- **Package System**: สร้างแผนราคา (เช่น Mini, Pro, Business) ที่ผูกซ่อนไว้กับทรัพยากรที่จำกัดตามเพดานโควตา
- **User Role**: แยกสิทธิ์ระหว่าง Admin (คุณ) ที่เห็นและปรับแต่งทุกอย่าง กับ Client (ลูกค้า) ที่เห็นเฉพาะแค่เว็บไซต์ของตัวเอง
---

## 🔗 แผนเชื่อมต่อ onetapweb_t3 (API Integration - เป้าหมายปัจจุบัน)

สถาปัตยกรรมใหม่: Coolify ทำหน้าที่เป็น **Headless Deployment Engine** สำหรับ `onetapweb_t3`
โดย Portal UI ยังคงอยู่ในฐานะ **Admin Dashboard** สำหรับทีม

> [!NOTE]
> แผน Shared Hosting (CyberPanel-like) ถูกระงับชั่วคราว โฟกัสไปที่การเชื่อมต่อกับ `onetapweb_t3` โดยตรงแทน

### สถาปัตยกรรม (Architecture)

| Layer | Role |
|---|---|
| **onetapweb_t3** (Master) | Auth, Billing, CRM, หน้าเว็บลูกค้า |
| **Coolify** (Engine) | Deploy T3 เอง + สร้างเว็บย่อยลูกค้า |
| **Bridge** | REST API /api/v1/ + Sanctum Personal Access Token |
| **Feedback** | Webhook (Event-driven) จาก Coolify กลับหา T3 |

### Workflow การสร้างเว็บย่อยให้ลูกค้า

1. ลูกค้ากดจอง = T3 เรียก `POST /api/v1/services` (สร้าง WordPress + MariaDB)
2. T3 เรียก `POST /api/v1/services/{uuid}/start` เพื่อ Deploy
3. Coolify สร้างเสร็จ = ยิง Webhook กลับหา T3 อัตโนมัติ
4. T3 รับ Webhook และอัปเดตสถานะลูกค้าในฐานข้อมูล

### Next.js Webhook Receiver

```typescript
// app/api/webhooks/coolify/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. เช็คความปลอดภัย (ตรวจสอบ Secret Key ที่มาจาก Coolify)
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.COOLIFY_WEBHOOK_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. แกะข้อมูลพัสดุ (Payload) ที่ Coolify ส่งมาให้
    const payload = await req.json();
    const { uuid, status, text } = payload; 
    
    // 3. นำสถานะล่าสุดไปอัปเดตเว็บของลูกค้าใน Database
    console.log(`[Coolify] โปรเจกต์ ${uuid} อัปเดตสถานะเป็น: ${status}`);
    // await db.customerSites.update({ 
    //   where: { coolifyUuid: uuid }, 
    //   data: { status: status === 'finished' ? 'ACTIVE' : 'DEPLOYING' }
    // });

    return NextResponse.json({ received: true });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
```

### ไฟล์ Reference ที่เตรียมไว้แล้ว (ใน Coolify repo)

| ไฟล์ | วางที่ใน `onetapweb_t3` | สถานะ |
|---|---|---|
| `PORTAL_COOLIFY_API_SERVICE.ts` | `lib/services/coolify.service.ts` | ✅ พร้อม |
| `PORTAL_T3_WEBHOOK_RECEIVER.ts` | `app/api/webhooks/coolify/route.ts` | ✅ พร้อม |
| `PORTAL_T3_SERVER_ACTION.ts` | `app/actions/site.actions.ts` | ✅ พร้อม |
| `PORTAL_T3_PRISMA_SCHEMA.prisma` | เพิ่มใน `prisma/schema.prisma` | ✅ พร้อม |
| `PORTAL_T3_ENV_EXAMPLE.env` | เพิ่มใน `.env.local` | ✅ พร้อม |
| `PORTAL_INTEGRATION_SETUP_GUIDE.md` | คู่มือ Step-by-Step | ✅ พร้อม |

### สิ่งที่ต้องทำ (ต้องทำเอง)

- `[ ]` Deploy `onetapweb_t3` บน Coolify ผ่าน Portal UI
- `[ ]` สร้าง Coolify API Token (Permission: read, write, deploy)
- `[ ]` คัดลอกไฟล์ Reference ทั้งหมดใส่ใน `onetapweb_t3` และเติม env vars
- `[ ]` ตั้งค่า Custom Webhook URL ใน Coolify Notifications Settings
- `[ ]` ทดสอบ End-to-End Flow: T3 → Coolify API → Webhook กลับมา T3
