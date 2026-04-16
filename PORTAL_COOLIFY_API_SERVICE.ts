/// <reference path="../projects/onetapweb_t3/node_modules/@types/node/index.d.ts" />
/**
 * Coolify API Service for onetapweb_t3
 * ไฟล์นี้เป็น wrapper สำหรับเรียก Coolify REST API (/api/v1/)
 * นำไปวางที่: lib/services/coolify.service.ts
 *
 * ต้องตั้งค่า environment variables ใน .env.local:
 *   COOLIFY_BASE_URL=https://your-coolify-instance.com
 *   COOLIFY_API_TOKEN=your-personal-access-token
 *   COOLIFY_WEBHOOK_SECRET=a-random-secret-you-choose
 *   COOLIFY_SERVER_UUID=uuid-of-your-main-server
 *   COOLIFY_DESTINATION_UUID=uuid-of-your-docker-network
 */

const COOLIFY_BASE_URL = process.env.COOLIFY_BASE_URL!;
const COOLIFY_API_TOKEN = process.env.COOLIFY_API_TOKEN!;

// ── Helper ─────────────────────────────────────────────────────────────────

async function coolifyFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${COOLIFY_BASE_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${COOLIFY_API_TOKEN}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Coolify API Error [${res.status}]: ${error}`);
  }

  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type CoolifyServiceStatus =
  | 'running'
  | 'stopped'
  | 'starting'
  | 'stopping'
  | 'restarting'
  | 'degraded'
  | 'exited';

export interface CoolifyProject {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
}

export interface CoolifyService {
  id: number;
  uuid: string;
  name: string;
  status: CoolifyServiceStatus;
  fqdn: string | null;
}

export interface CreateServicePayload {
  /** ชื่อแสดงสำหรับ Service (หน้า Coolify Dashboard) */
  name: string;
  /** Docker Compose YAML content */
  docker_compose_raw: string;
  /** UUID ของ Project ที่ต้องการสร้าง Service ใต้ */
  project_uuid: string;
  /** ชื่อ Environment (default: production) */
  environment_name?: string;
  /** UUID ของ Server ที่ต้องการ Deploy */
  server_uuid: string;
  /** UUID ของ Docker Network (Destination) */
  destination_uuid?: string;
}

// ── Project APIs ───────────────────────────────────────────────────────────

/** ดึง Project ทั้งหมดของ Team ปัจจุบัน */
export async function listProjects(): Promise<CoolifyProject[]> {
  return coolifyFetch('/projects');
}

/** สร้าง Project ใหม่สำหรับลูกค้า 1 ราย */
export async function createProject(name: string, description?: string): Promise<CoolifyProject> {
  return coolifyFetch('/projects', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
}

/** ลบ Project (และทุก Resource ภายใน) */
export async function deleteProject(projectUuid: string): Promise<void> {
  await coolifyFetch(`/projects/${projectUuid}`, { method: 'DELETE' });
}

// ── Service APIs (WordPress, Ghost, Plausible ฯลฯ) ─────────────────────────

/** ดึง Service โดย UUID */
export async function getService(serviceUuid: string): Promise<CoolifyService> {
  return coolifyFetch(`/services/${serviceUuid}`);
}

/** สร้าง Service ใหม่จาก Docker Compose */
export async function createService(payload: CreateServicePayload): Promise<CoolifyService> {
  return coolifyFetch('/services', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      environment_name: payload.environment_name ?? 'production',
    }),
  });
}

/** เริ่ม Deploy Service (Start/Build) */
export async function startService(serviceUuid: string): Promise<void> {
  await coolifyFetch(`/services/${serviceUuid}/start`, { method: 'POST' });
}

/** หยุด Service */
export async function stopService(serviceUuid: string): Promise<void> {
  await coolifyFetch(`/services/${serviceUuid}/stop`, { method: 'POST' });
}

/** Restart Service */
export async function restartService(serviceUuid: string): Promise<void> {
  await coolifyFetch(`/services/${serviceUuid}/restart`, { method: 'POST' });
}

/** ลบ Service และ Resources ภายใน */
export async function deleteService(
  serviceUuid: string,
  options?: { deleteVolumes?: boolean }
): Promise<void> {
  await coolifyFetch(`/services/${serviceUuid}`, {
    method: 'DELETE',
    body: JSON.stringify({ delete_volumes: options?.deleteVolumes ?? false }),
  });
}

// ── Environment Variables ──────────────────────────────────────────────────

/** ตั้ง Environment Variables ให้ Service (bulk) */
export async function setServiceEnvs(
  serviceUuid: string,
  envs: Record<string, string>
): Promise<void> {
  const data = Object.entries(envs).map(([key, value]) => ({ key, value }));
  await coolifyFetch(`/services/${serviceUuid}/envs/bulk`, {
    method: 'PATCH',
    body: JSON.stringify({ data }),
  });
}

// ── Preset Templates ───────────────────────────────────────────────────────

/** Template สำหรับ WordPress + MariaDB แบบ One-Click */
export function wordpressComposeTemplate(opts: {
  domainName: string;
  dbPassword: string;
  wpAdminEmail: string;
}): string {
  return `
services:
  wordpress:
    image: wordpress:latest
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: ${opts.dbPassword}
      WORDPRESS_DB_NAME: wordpress
      WORDPRESS_CONFIG_EXTRA: '$_SERVER["HTTPS"] = "on"; define("FORCE_SSL_ADMIN", true);'
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.wordpress.rule=Host(\`${opts.domainName}\`)"
    depends_on:
      - db

  db:
    image: mariadb:11
    environment:
      MYSQL_ROOT_PASSWORD: ${opts.dbPassword}
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress  
      MYSQL_PASSWORD: ${opts.dbPassword}
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
`.trim();
}

// ── Full Flow: สร้างเว็บ WordPress ให้ลูกค้า 1 ราย ─────────────────────────

/**
 * ฟังก์ชัน All-in-One สำหรับสร้างเว็บ WordPress ให้ลูกค้า
 * เรียกจาก Server Action หรือ API Route ใน T3 ได้เลย
 *
 * @returns UUID ของ Service บน Coolify สำหรับแปะลง DB ลูกค้า
 */
export async function provisionWordPressSite(opts: {
  customerName: string;
  domainName: string;
  dbPassword: string;
  email: string;
}): Promise<{ projectUuid: string; serviceUuid: string }> {
  // 1. สร้าง Project ใหม่แยกให้ลูกค้าคนนี้
  const project = await createProject(
    `[OTW] ${opts.customerName}`,
    `Site for ${opts.domainName}`
  );

  // 2. สร้าง WordPress Service
  const service = await createService({
    name: `${opts.customerName}-wordpress`,
    project_uuid: project.uuid,
    server_uuid: process.env.COOLIFY_SERVER_UUID!,
    destination_uuid: process.env.COOLIFY_DESTINATION_UUID,
    docker_compose_raw: wordpressComposeTemplate({
      domainName: opts.domainName,
      dbPassword: opts.dbPassword,
      wpAdminEmail: opts.email,
    }),
  });

  // 3. เริ่ม Deploy ทันที
  await startService(service.uuid);

  return { projectUuid: project.uuid, serviceUuid: service.uuid };
}
