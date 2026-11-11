import test from 'node:test';
import assert from 'node:assert/strict';
import {labs} from '../dist/lib/magnetpass.mjs';
const [lab]=labs,p=Object.fromEntries(lab.params.map(x=>[x.key,x.value]));
test('Moving dipole linkage follows Faraday and mechanical power supplies Joule heating',()=>{
 for(const mode of lab.modes){const m=lab.build(p,mode),dt=1e-6;
 for(let i=1;i<10;i++){const t=i*m.duration/12,s=m.at(t),slope=(m.at(t+dt).linkage-m.at(t-dt).linkage)/(2*dt);
 assert.ok(Math.abs(s.voltage+slope)<1e-6);assert.ok(Math.abs(s.force*s.v+s.heat)<1e-7)}}
});
test('Zero EMF at coil center and a stationary turning point; reversal changes voltage sign',()=>{
 const m=lab.build(p,'Harmonic drive'),reverse=lab.build({...p,moment:-p.moment},'Harmonic drive');
 assert.ok(Math.abs(m.at(0).voltage)<1e-10);assert.ok(Math.abs(m.at(m.duration/4).voltage)<1e-10);
 assert.ok(Math.abs(m.at(.1).voltage+reverse.at(.1).voltage)<1e-9);
});
