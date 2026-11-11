import test from 'node:test';
import assert from 'node:assert/strict';
import {labs} from '../dist/lib/mechanics.mjs';
function create(id,mode,overrides={}){const l=labs.find(l=>l.id===id);return l.build({...Object.fromEntries(l.params.map(p=>[p.key,p.value])),...overrides},mode);}
function near(a,b,eps=1e-8){assert.ok(Math.abs(a-b)<=eps*Math.max(1,Math.abs(b)),a+' vs '+b);}
test('Ideal projectile range and apex match analytic symmetric launch',()=>{
 const m=create('projectile','Ideal flight',{speed:20,angle:45,height:0,gravity:10});
 near(m.range,40);near(m.at(m.apexTime).y,10);near(m.at(m.apexTime).vy,0);
});
test('Weak quadratic drag approaches vacuum solution continuously',()=>{
 const ideal=create('projectile','Ideal flight'),weak=create('projectile','Quadratic drag',{drag:1e-9});
 near(weak.range,ideal.range,1e-6);near(weak.duration,ideal.duration,1e-6);
});
test('Drag model locates landing on descent and dissipates mechanical energy',()=>{
 const m=create('projectile','Quadratic drag',{height:17,drag:.03});
 const landed=m.at(m.duration);near(landed.y,0,1e-7);assert.ok(landed.vy<0);
 assert.ok(m.at(m.duration-.001).y>0);assert.ok(landed.energy<m.at(0).energy);
});
test('Mass–spring kinetic plus potential energy is constant over a period',()=>{
 const m=create('shm','Free oscillation'),initial=m.at(0);
 for(let i=0;i<=20;i++)near(m.at(m.period*i/20).energy,initial.energy);
 near(m.at(m.period).x,initial.x);near(m.at(m.period/4).x,0);
});
test('Exactly resonant undamped finite-time solution develops secular velocity',()=>{
 const frequency=1,omega=2*Math.PI,m=create('shm','Driven oscillator',{mass:1,stiffness:omega*omega,frequency,damping:0,force:2,amplitude:.2});
 near(m.at(1).v,1);near(m.at(2).v,2);near(m.at(2).x,.2);
});
test('Eccentric orbit conserves specific energy and angular momentum at apsides',()=>{
 const m=create('orbit','Earth',{eccentricity:.75}),a=m.at(0),b=m.at(m.duration/2);
 near(b.r/a.r,7);near(a.r*a.speed,b.r*b.speed);near(a.energy,b.energy);
 near(a.accel/b.accel,49);
});
test('Orbital period obeys Kepler scaling and the state closes on three bodies',()=>{
 for(const body of ['Earth','Moon','Mars']){
  const m=create('orbit',body,{eccentricity:0}),a=m.at(0),b=m.at(m.duration);
  near(m.duration**2,4*Math.PI**2*a.r**3/m.body.mu);near(b.x,a.x);near(b.z,a.z,1e-7);near(b.vz,a.vz);
 }
});
