import { shop } from '../../../lib/game';
import { body, db, guard, HttpError, json, state, user } from '../../../lib/server';
export async function POST(req: Request) { return guard(async()=> {
 const u=await user(req),v=await body(req),item=shop.find(i=>i.id===v.itemId);
 if(!item) throw new HttpError(400,'This item is not in the shop.');
 // The balance check and debit are the same serialized database statement.
 const result=await db().prepare(`INSERT INTO purchases(id,user_id,item_id,price,created_at)
 SELECT ?,?,?,?,? WHERE COALESCE((SELECT SUM(gold) FROM completions WHERE user_id=?),0)-COALESCE((SELECT SUM(price) FROM purchases WHERE user_id=?),0)>=?
 ON CONFLICT(user_id,item_id) DO NOTHING`).bind(crypto.randomUUID(),u.id,item.id,item.price,new Date().toISOString(),u.id,u.id,item.price).run();
 if(!result.meta.changes) { const owned=await db().prepare('SELECT id FROM purchases WHERE user_id=? AND item_id=?').bind(u.id,item.id).first(); if(!owned) throw new HttpError(409,'You need more gold to unlock this reward.'); }
 return json(await state(u));
 },req); }
export async function PATCH(req: Request) { return guard(async()=> {
 const u=await user(req), v=await body(req);
 if(v.itemId==='daylight') { await db().prepare('UPDATE users SET theme=? WHERE id=?').bind('daylight',u.id).run(); return json(await state({...u,theme:'daylight'})); }
 const item=shop.find(i=>i.id===v.itemId);
 if(!item || !await db().prepare('SELECT id FROM purchases WHERE user_id=? AND item_id=?').bind(u.id,item.id).first()) throw new HttpError(403,'Unlock this reward before equipping it.');
 const field=item.kind==='theme'?'theme':'badge';
 await db().prepare(`UPDATE users SET ${field}=? WHERE id=?`).bind(item.id,u.id).run();
 return json(await state({...u,[field]:item.id}));
 },req); }

