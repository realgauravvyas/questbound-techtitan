import { guard, json, state, user } from '../../../lib/server';
export async function GET(req: Request) { return guard(async()=>json(await state(await user(req)))); }
