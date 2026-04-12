/**
 * Coolify Webhook Receiver for onetapweb_t3
 * วางไฟล์นี้ที่: app/api/webhooks/coolify/route.ts
 *
 * ตั้งค่าใน Coolify:
 *   Settings > Notifications > Custom Webhook
 *   URL: https://your-onetapweb.com/api/webhooks/coolify
 *   Authorization Header: Bearer <COOLIFY_WEBHOOK_SECRET>
 */

import { NextResponse } from 'next/server';
// import { db } from '@/lib/db'; // เปิดใช้เมื่อพร้อม

// ── Types ──────────────────────────────────────────────────────────────────

type CoolifyWebhookPayload = {
  uuid?: string;           // UUID ของ Service/Application ที่ Trigger
  name?: string;           // ชื่อ Resource
  status?: string;         // 'finished' | 'failed' | 'in_progress' | 'stopped'
  text?: string;           // Human-readable message จาก Coolify
  type?: string;           // 'deployment' | 'status_change'
  application_uuid?: string;
  service_uuid?: string;
};

// ── Handler ────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // 1. ตรวจสอบ Secret Key ที่มาจาก Coolify
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.COOLIFY_WEBHOOK_SECRET}`) {
      console.warn('[Coolify Webhook] Unauthorized attempt');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. แกะ Payload ที่ Coolify ส่งมา
    const payload: CoolifyWebhookPayload = await req.json();
    const resourceUuid = payload.service_uuid ?? payload.application_uuid ?? payload.uuid;
    const { status, text, name } = payload;

    console.log(`[Coolify Webhook] Resource: ${name} (${resourceUuid}) → Status: ${status}`);
    console.log(`[Coolify Webhook] Message: ${text}`);

    // 3. Map Coolify status → Internal status ของ T3
    const internalStatus = mapStatus(status);

    // 4. อัปเดต Database ฝั่ง T3
    if (resourceUuid && internalStatus) {
      // await db.customerSite.update({
      //   where: { coolifyUuid: resourceUuid },
      //   data: {
      //     status: internalStatus,
      //     lastUpdated: new Date(),
      //   },
      // });

      // ถ้าสร้างเสร็จแล้ว อาจ trigger email แจ้งลูกค้า
      // if (internalStatus === 'ACTIVE') {
      //   await sendWelcomeEmail(resourceUuid);
      // }
    }

    return NextResponse.json({ received: true, status: internalStatus });
  } catch (error) {
    console.error('[Coolify Webhook] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

type InternalStatus = 'ACTIVE' | 'DEPLOYING' | 'FAILED' | 'STOPPED' | null;

function mapStatus(coolifyStatus?: string): InternalStatus {
  switch (coolifyStatus) {
    case 'finished':   return 'ACTIVE';
    case 'running':    return 'ACTIVE';
    case 'in_progress': return 'DEPLOYING';
    case 'starting':   return 'DEPLOYING';
    case 'failed':     return 'FAILED';
    case 'stopped':    return 'STOPPED';
    case 'exited':     return 'STOPPED';
    default:           return null;
  }
}
