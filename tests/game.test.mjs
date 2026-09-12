import test from 'node:test';
import assert from 'node:assert/strict';
import { progression, streakFromDays } from '../lib/game.ts';
test('nonlinear level boundaries',()=>{assert.deepEqual(progression(0),{level:1,current:0,required:100,percent:0});assert.equal(progression(99).level,1);assert.deepEqual(progression(100),{level:2,current:0,required:400,percent:0});assert.equal(progression(499).level,2);assert.equal(progression(500).level,3);assert.equal(progression(1399).level,3);assert.equal(progression(1400).level,4);});
test('streak counts distinct days, crosses month boundaries and preserves yesterday',()=>{assert.equal(streakFromDays([], '2026-09-01'),0);assert.equal(streakFromDays(['2026-09-01','2026-09-01','2026-08-31'],'2026-09-01'),2);assert.equal(streakFromDays(['2026-08-31','2026-08-30'],'2026-09-01'),2);assert.equal(streakFromDays(['2026-08-30'],'2026-09-01'),0);assert.equal(streakFromDays(['2026-03-01','2026-02-28'],'2026-03-01'),2);});
