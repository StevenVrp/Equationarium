import test from 'node:test';
import assert from 'node:assert/strict';
import {labs} from '../dist/lib/cycles.mjs';
const [cycle,kinetic]=labs;
const defaults=l=>Object.fromEntries(l.params.map(p=>[p.key,p.value]));
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol,`${a} vs ${b}`);
test('clockwise rectangular cycle closes and absorbs 650 J',()=>{
 const m=cycle.build(defaults(cycle),cycle.modes[0]),s=m.at(m.duration);near(s.work,100);near(s.heat,100);near(s.internal,0);near(m.absorbed,650);near(s.efficiency,100/650*100);
 for(let i=0;i<100;i++){const v=m.at(m.duration*i/99);near(v.heat-v.work,v.internal)}
});
test('triangle can reverse and power-law isotherms integrate logarithmically',()=>{
 const p=defaults(cycle),m=cycle.build(p,cycle.modes[0],{vertices:'3',v0:'1',p0:'1',v1:'2',p1:'1',v2:'1',p2:'2'});near(m.net,-50);
 const c=cycle.build(p,cycle.modes[0],{v0:'1',p0:'2',v1:'2',p1:'1',s0:'power'});const s=c.at(2);near(s.work,200*Math.log(2));near(s.internal,0);near(s.heat,s.work);
});
test('heat-in quadrature agrees with the positive heat increments of a path with reversals',()=>{
 const m=cycle.build(defaults(cycle),cycle.modes[0],{v0:'.5',p0:'4',v1:'4',p1:'.5'});let prev=0,inQ=0;for(let i=1;i<=40000;i++){let q=m.at(m.duration*i/40000).heat;inQ+=Math.max(0,q-prev);prev=q}near(m.absorbed,inQ,.001);
});
test('Maxwell tail spans all speeds, normalizes and thermally rescales',()=>{
 const p=defaults(kinetic);const zero=kinetic.build({...p,threshold:0},kinetic.modes[0]);near(zero.at(0).tail,100);const base=kinetic.build(p,kinetic.modes[0]).at(0),hot=kinetic.build({...p,threshold:p.threshold*Math.sqrt(2)},kinetic.modes[0]).at(8);near(base.tail,hot.tail);near(hot.rms/base.rms,Math.sqrt(2));near(base.peak,Math.sqrt(2*8.31446261815324*300/.028));
 const v=base.peak;let sum=0,count=0;const dv=8*v/10000;for(let j=0;j<10000;j++){const x=(j+.5)*dv,u=x/v,dP=4/Math.sqrt(Math.PI)*u*u*Math.exp(-u*u)*dv/v;sum+=dP;if(x>p.threshold)count+=dP}near(sum,1);near(base.tail,100*count,.06);
});
test('cycle and kinetic scenes render finite coordinates throughout supported modes',()=>{
 for(const lab of labs)for(const mode of lab.modes)for(const k of ['min','value','max']){const p=Object.fromEntries(lab.params.map(q=>[q.key,q[k]]));const model=lab.build(p,mode);for(const t of [0,model.duration*.4,model.duration]){const state=model.at(t);assert.ok(Object.values(state).every(Number.isFinite));assert.doesNotMatch(lab.scene({model,state,p,mode,showVectors:true,showPath:true}),/NaN|Infinity/)}}
});
