import { env } from 'cloudflare:workers';
import { categories, difficulties, progression, shop, streakFromDays } from './game';
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export const db = () => { if (!env.DB) throw new HttpError(503, 'Your journal is temporarily unavailable. Please try again.'); return env.DB; };
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
export const hash = async (s: string) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
export async function passwordHash(password: string, salt: string) {
 const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
 return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256));
}
export function equal(a: string, b: string) { let diff = a.length ^ b.length; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ (b.charCodeAt(i) || 0); return diff === 0; }
export function json(data: unknown, status = 200, headers: Record<string, string> = {}) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } }); }
export async function body(req: Request) {
 if (req.headers.get('x-questbound') !== '1') throw new HttpError(403, 'Please use Questbound to make this change.');
 const origin = req.headers.get('origin');
 if (origin && origin !== new URL(req.url).origin) throw new HttpError(403, 'This request came from another website.');
 if (!req.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415, 'JSON is required.');
 const raw = await req.text(); if (raw.length > 10000) throw new HttpError(413, 'This request is too large.');
 try { const value = JSON.parse(raw); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value; } catch { throw new HttpError(400, 'Invalid request.'); }
}
export async function guard(fn: () => Promise<Response>) { try { return await fn(); } catch(e) { if (e instanceof HttpError) return json({error:e.message},e.status); console.error('Questbound request failed:', e instanceof Error ? e.message : 'unknown'); return json({error:'Your journal could not be updated. Please try again.'},503); } }
export async function user(req: Request) {
 const token = /(?:^|;\s*)qb_session=([^;]+)/.exec(req.headers.get('cookie') || '')?.[1];
 if (!token) throw new HttpError(401,'Sign in to open your journal.');
 const result = await db().prepare('SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires_at>?').bind(await hash(token), Date.now()).first<any>();
 if (!result) throw new HttpError(401,'Your session has ended. Please sign in again.'); return result;
}
export async function newSession(id: string, req: Request) { const token = hex(crypto.getRandomValues(new Uint8Array(32)).buffer); await db().prepare('INSERT INTO sessions(token,user_id,expires_at) VALUES(?,?,?)').bind(await hash(token),id,Date.now()+7*86400000).run(); return `qb_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${new URL(req.url).protocol === 'https:' ? '; Secure' : ''}`; }
export function dayInZone(timezone: string) { return new Intl.DateTimeFormat('en-CA', {timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
export async function rateLimit(req: Request, email: string) {
 const now = Date.now(); const ip = req.headers.get('cf-connecting-ip') || 'local';
 for (const key of [await hash('ip:'+ip), await hash('email:'+email)]) {
  const row = await db().prepare('INSERT INTO rate_limits(key,attempts,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN expires<? THEN 1 ELSE attempts+1 END, expires=CASE WHEN expires<? THEN excluded.expires ELSE expires END RETURNING attempts').bind(key, now+900000, now, now).first<any>();
  if(row.attempts>30) throw new HttpError(429,'Too many sign-in attempts. Please try again in 15 minutes.');
 }
}
export function taskInput(v: any) {
 const title = typeof v.title === 'string' ? v.title.trim() : '';
 if (!title || title.length > 160) throw new HttpError(400,'Give your quest a name between 1 and 160 characters.');
 if (!categories.includes(v.category)) throw new HttpError(400,'Choose a valid attribute.');
 if (!Object.hasOwn(difficulties,v.difficulty)) throw new HttpError(400,'Choose a valid difficulty.');
 const date = v.dueDate || null;
 if (date && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date)) throw new HttpError(400,'Choose a valid due date.');
 return {title,category:v.category,difficulty:v.difficulty,dueDate:date};
}
export async function state(u: any) {
 const results = await db().batch([
 db().prepare('SELECT t.*,c.created_at AS completed_at FROM tasks t LEFT JOIN completions c ON c.task_id=t.id WHERE t.user_id=? AND t.deleted=0 ORDER BY t.created_at DESC').bind(u.id),
 db().prepare('SELECT * FROM completions WHERE user_id=? ORDER BY created_at DESC').bind(u.id),
 db().prepare('SELECT * FROM purchases WHERE user_id=? ORDER BY created_at DESC').bind(u.id),
 ]);
 const [tasks, history, inventory] = results.map(r => r.results as any[]);
 const xp = history.reduce((s,r)=>s+r.xp,0), earned = history.reduce((s,r)=>s+r.gold,0), spent = inventory.reduce((s,r)=>s+r.price,0);
 const today=dayInZone(u.timezone);
 return {user:{id:u.id,name:u.name,email:u.email,timezone:u.timezone,theme:u.theme,badge:u.badge},tasks,history,inventory,shop,xp,gold:earned-spent,progression:progression(xp),streak:streakFromDays(history.map(r=>r.day),today),today,attributes:Object.fromEntries(categories.map(c=>[c,history.filter(r=>r.category===c).reduce((s,r)=>s+r.xp,0)]))};
}
