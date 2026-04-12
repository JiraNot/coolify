/**
 * Server Action: Provision Customer Site
 * วางไฟล์นี้ที่: app/actions/site.actions.ts
 *
 * ใช้งาน (เรียกจาก Client Component):
 *   const result = await provisionSite({ name, domainName, siteType, plan });
 */

'use server';

import { auth } from '@/auth'; // หรือ getServerSession ตาม setup ของคุณ
import { db } from '@/lib/db';
import { provisionWordPressSite } from '@/lib/services/coolify.service';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ── Validation Schema ──────────────────────────────────────────────────────

const ProvisionSiteSchema = z.object({
  name: z.string().min(3).max(60),
  domainName: z.string().regex(/^[a-z0-9-]+$/, 'ใช้ได้เฉพาะ a-z, 0-9, และ -'),
  siteType: z.enum(['WORDPRESS', 'NEXTJS', 'STATIC']),
  plan: z.enum(['STARTER', 'PRO', 'BUSINESS']),
});

type ProvisionSiteInput = z.infer<typeof ProvisionSiteSchema>;

// ── Server Action ──────────────────────────────────────────────────────────

export async function provisionSite(input: ProvisionSiteInput) {
  // 1. ตรวจสอบว่า Login อยู่
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Validate Input
  const parsed = ProvisionSiteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  const { name, domainName, siteType, plan } = parsed.data;
  const fullDomain = `${domainName}.onetapweb.com`;

  try {
    // 3. สร้าง Record ใน DB ก่อน (status: PROVISIONING)
    const site = await db.customerSite.create({
      data: {
        userId: session.user.id,
        name,
        domainName: fullDomain,
        siteType,
        plan,
        status: 'PROVISIONING',
      },
    });

    // 4. สั่ง Coolify ให้สร้างเว็บ (Fire & Forget — Coolify จะ Webhook กลับมา)
    if (siteType === 'WORDPRESS') {
      const { projectUuid, serviceUuid } = await provisionWordPressSite({
        customerName: name,
        domainName: fullDomain,
        dbPassword: generatePassword(),
        email: session.user.email ?? '',
      });

      // 5. อัปเดต Coolify UUIDs ลง DB
      await db.customerSite.update({
        where: { id: site.id },
        data: {
          coolifyProjectUuid: projectUuid,
          coolifyServiceUuid: serviceUuid,
        },
      });
    }

    revalidatePath('/dashboard/sites');
    return { success: true, siteId: site.id };

  } catch (error) {
    console.error('[provisionSite] Error:', error);

    // Mark as FAILED ถ้า Coolify ล้มเหลว
    // await db.customerSite.update({ where: { ... }, data: { status: 'FAILED' }});
    return { success: false, error: 'ไม่สามารถสร้างเว็บไซต์ได้ กรุณาลองใหม่อีกครั้ง' };
  }
}

// ── Helper ──────────────────────────────────────────────────────────────────

function generatePassword(length = 24): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}
