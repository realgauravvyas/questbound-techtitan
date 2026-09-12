import { body, db, guard, HttpError, json, state, taskInput, user } from '../../../lib/server';
export async function POST(req: Request) { return guard(async()=> {
 const u=await user(req), v=taskInput(await body(req));
 const count=await db().prepare('SELECT COUNT(*) AS n FROM tasks WHERE user_id=? AND deleted=0').bind(u.id).first<any>();
 if(count.n>=1000) throw new HttpError(400,'Your journal holds up to 1,000 quests. Archive some before adding more.');
 await db().prepare('INSERT INTO tasks(id,user_id,title,category,difficulty,due_date,created_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),u.id,v.title,v.category,v.difficulty,v.dueDate,new Date().toISOString()).run();
 return json(await state(u),201);
 }); }
export async function PATCH(req: Request) { return guard(async()=> {
 const u=await user(req), raw=await body(req), v=taskInput(raw);
 const result=await db().prepare('UPDATE tasks SET title=?,category=?,difficulty=?,due_date=? WHERE id=? AND user_id=? AND deleted=0 AND NOT EXISTS(SELECT 1 FROM completions WHERE task_id=tasks.id)').bind(v.title,v.category,v.difficulty,v.dueDate,String(raw.id),u.id).run();
 if(!result.meta.changes) throw new HttpError(409,'This quest was completed, removed, or is not yours. Refresh your journal.');
 return json(await state(u));
 }); }
export async function DELETE(req: Request) { return guard(async()=> {
 const u=await user(req), v=await body(req);
 await db().prepare('UPDATE tasks SET deleted=1 WHERE id=? AND user_id=?').bind(String(v.id),u.id).run();
 return json(await state(u));
 }); }
