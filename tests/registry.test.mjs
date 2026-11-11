import test from 'node:test';
import assert from 'node:assert/strict';
import {labs} from '../dist/lib/registry.mjs';
import math from '../dist/lib/math.mjs';
import {sample,drawPlot} from '../dist/lib/plot.mjs';
import {lengthCalibration,events} from '../dist/lib/instruments.mjs';

test('every module has a working experiment; ids, formula assets and controls agree',()=>{
 assert.equal(new Set(labs.map(l=>l.module)).size,13);
 assert.equal(new Set(labs.map(l=>l.id)).size,labs.length);
 for(const l of labs){
  const p=Object.fromEntries(l.params.map(q=>[q.key,q.value]));
  for(const f of l.formulas){assert.ok(math[f.tex]?.startsWith('<math'),l.id+': '+f.tex);assert.ok(f.meaning&&f.derivation&&f.example&&f.variables.length)}
  assert.ok(l.challenges.length>=2,l.id);for(const c of l.challenges){assert.ok(Number.isFinite(c.answer)&&c.tolerance>0&&c.hints.length&&c.solution,l.id)}
  for(const mode of l.modes||['']){
   const model=l.build(p,mode,{...l.defaultConfig});assert.ok(model.duration>0,l.id);
   const data=sample(model,16);
   for(const s of [...l.metrics,...l.series])assert.ok(data.some(row=>Number.isFinite(row[s.key])),l.id+' / '+s.key);
   for(const s of l.series){const g=drawPlot(data,s,[0,model.duration],0,null,{model});assert.ok(!g.includes('NaN'),l.id+' / '+s.key)}
  }
 }
});
test('orbital ruler measures the major axis in physical kilometres',()=>{
 const l=labs.find(l=>l.id==='orbit'),p=Object.fromEntries(l.params.map(q=>[q.key,q.value])),m=l.build(p,'Earth'),c=lengthCalibration('orbit',m,'2D');
 assert.ok(Math.abs(c.x*2*154*1.08-2*m.a/1000)<1e-8);assert.equal(events('orbit',m)[1][1],m.duration/2);
});
