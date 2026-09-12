import { body, dayInZone, db, guard, HttpError, json, state, user } from '../../../lib/server';
export async function POST(req: Request) { return guard(async()=> {
 const u=await user(req), v=await body(req);
 // One atomic INSERT SELECT takes rewards from the current server-owned task.
 // UNIQUE(task_id) makes retries and concurrent completions idempotent.
 const result=await db().prepare(`INSERT INTO completions(id,task_id,user_id,title,category,xp,gold,day,created_at)
 SELECT ?,id,user_id,title,category,CASE difficulty WHEN 'hard' THEN 100 WHEN 'medium' THEN 50 ELSE 25 END,
 CASE difficulty WHEN 'hard' THEN 40 WHEN 'medium' THEN 20 ELSE 10 END,?,? FROM tasks
 WHERE id=? AND user_id=? AND deleted=0 ON CONFLICT(task_id) DO NOTHING`).bind(crypto.randomUUID(),dayInZone(u.timezone),new Date().toISOString(),String(v.id),u.id).run();
 if(!result.meta.changes) { const existing=await db().prepare('SELECT id FROM completions WHERE task_id=? AND user_id=?').bind(String(v.id),u.id).first(); if(!existing) throw new HttpError(404,'Quest not found.'); }
 return json(await state(u));
 },req); }

