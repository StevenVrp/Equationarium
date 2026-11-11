import test from 'node:test';
import assert from 'node:assert/strict';
import {labs} from '../dist/lib/machines.mjs';
const lab=id=>labs.find(l=>l.id===id);
const defaults=l=>Object.fromEntries(l.params.map(p=>[p.key,p.value]));
const near=(x,y,tol=1e-7)=>assert.ok(Math.abs(x-y)<tol, [x,y,tol].join(' '));
test('nonlinear period, closure, energy and small-angle limit',()=>{
 const l=lab('pendulum'),p={...defaults(l),amplitude:120},m=l.build(p,'Nonlinear model');
 assert.ok(m.exactT>m.smallT*1.3); near(m.at(m.exactT).angle,120,1e-5);
 for(let i=0;i<25;i++)near(m.at(i*m.duration/24).energy,m.at(0).energy,1e-6);
 p.amplitude=.01;const small=l.build(p,'Small-angle model');near(small.smallT,small.exactT,1e-8);
});
test('spin-up conserves angular momentum and inertia follows both moving masses',()=>{
 const l=lab('torque'),p=defaults(l),m=l.build(p,'Moving masses');
 near(m.at(m.duration).radius,p.end);near(m.at(0).radius,p.start);
 near(m.at(3).momentum,m.at(0).momentum);assert.ok(m.at(6).energy>m.at(0).energy);
 const n=l.build({...p,torque:.8},'Fixed radius');near(n.at(6).omega,p.speed+4.8/n.at(0).inertia);
 near(n.at(6).angle,6*p.speed+.5*36*.8/n.at(0).inertia);
});
test('signed pulley dynamics satisfies both free bodies and the sticking threshold',()=>{
 const l=lab('pulley'),p=defaults(l);
 for(const hanger of [.2,1,4]){const m=l.build({...p,hanger},'Rough incline'),s=m.at(m.duration);
 near(s.tension+s.friction-s.parallel,p.cart*s.acceleration);near(hanger*9.81-s.tension,hanger*s.acceleration);
 if(!m.stuck)near(Math.abs(s.x),.6);}
 const m=l.build({...p,cart:2,hanger:1,slope:30},'Smooth incline');near(m.at(1).acceleration,0);
});
test('every machine mode and parameter extreme renders finite geometry',()=>{
 for(const l of labs)for(const mode of l.modes)for(const k of ['min','max','value']){
 const p=Object.fromEntries(l.params.map(a=>[a.key,a[k]])),model=l.build(p,mode);
 for(const f of [0,.31,1]){const t=f*model.duration,state=model.at(t);
 assert.ok(Object.values(state).every(Number.isFinite));assert.doesNotMatch(l.scene({p,mode,model,state,t,showPath:true,showVectors:true}),/NaN|Infinity|undefined/);}}
});
