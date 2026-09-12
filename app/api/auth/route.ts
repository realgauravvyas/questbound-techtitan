import { body, db, equal, guard, hash, HttpError, json, newSession, passwordHash, rateLimit } from '../../../lib/server';
export async function POST(req: Request) { return guard(async () => {
 const v = await body(req);
 if (v.action === 'logout') {
  const token = /(?:^|;\s*)qb_session=([^;]+)/.exec(req.headers.get('cookie') || '')?.[1];
  if(token) await db().prepare('UPDATE sessions SET expires_at=0 WHERE token=?').bind(await hash(token)).run();
  return json({ok:true},200,{'Set-Cookie':'qb_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'});
 }
 if (!['signup','login'].includes(v.action)) throw new HttpError(400,'Invalid action.');
 const email = typeof v.email === 'string' ? v.email.trim().toLowerCase() : '';
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254) throw new HttpError(400,'Enter a valid email address.');
 if (typeof v.password !== 'string' || v.password.length<10 || v.password.length>128) throw new HttpError(400,'Use a password between 10 and 128 characters.');
 await rateLimit(req,email);
 let u = await db().prepare('SELECT * FROM users WHERE email=?').bind(email).first<any>();
 if (v.action === 'signup') {
  if(u) throw new HttpError(409,'An account already uses this email. Please sign in.');
  const name=typeof v.name==='string'?v.name.trim():'';
  if(!name || name.length>40) throw new HttpError(400,'Choose an adventurer name between 1 and 40 characters.');
  const timezone=typeof v.timezone==='string'?v.timezone:'UTC';
  try { new Intl.DateTimeFormat('en',{timeZone:timezone}); } catch { throw new HttpError(400,'Invalid timezone.'); }
  const id=crypto.randomUUID(), salt=crypto.randomUUID(), password=await passwordHash(v.password,salt);
  try { await db().prepare('INSERT INTO users(id,email,name,password,salt,timezone,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,email,name,password,salt,timezone,new Date().toISOString()).run(); }
  catch(e) { if(String(e).includes('UNIQUE')) throw new HttpError(409,'An account already uses this email. Please sign in.'); throw e; }
  u={id};
 } else {
  const candidate=await passwordHash(v.password,u?.salt || 'questbound-constant-time-fallback');
  if(!u || !equal(candidate,u.password)) throw new HttpError(401,'Email or password is incorrect.');
 }
 return json({ok:true},200,{'Set-Cookie':await newSession(u.id,req)});
 },req); }


