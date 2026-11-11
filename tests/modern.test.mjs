import test from 'node:test';
import assert from 'node:assert/strict';
import {labs} from '../dist/lib/modern.mjs';
const lab=id=>labs.find(v=>v.id===id);
const values=l=>Object.fromEntries(l.params.map(v=>[v.key,v.value]));
const near=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<=eps*Math.max(1,Math.abs(b)),a+' vs '+b);
test('A returning light pulse measures the invariant interval and leading-clock lag',()=>{
 const l=lab('relativity'),p=values(l),m=l.build(p,l.modes[0]),s=m.at(m.duration);
 near(s.lab/s.proper,1.25);near(s.lab**2-(s.shuttleX*1e9/299792458)**2,s.proper**2);
 near(s.proper-s.frontClock,.6*1.2e9/299792458);near(s.rayY,0);near(m.at(m.duration/2).rayY,p.gap);
 const rest=l.build({...p,beta:0},l.modes[1]).at(1);
 near(rest.frontClock,rest.lab);near(rest.obsLength,p.length);
});
test('Photon threshold and saturation current distinguish frequency from power',()=>{
 const l=lab('photoelectric'),p=values(l);
 const s=l.build(p,l.modes[0]).at(0),twice=l.build({...p,power:2*p.power},l.modes[0]).at(0);
 near(twice.maxCurrent,2*s.maxCurrent);near(twice.stopping,s.stopping);
 near(s.stopping+p.work,6.62607015e-34*p.freq*1e12/1.602176634e-19);
 const dark=l.build({...p,freq:200},l.modes[0]).at(0);
 assert.equal(dark.emitted,0);near(dark.maxCurrent,0);
 assert.equal(l.build({...p,bias:s.stopping+.1},l.modes[0]).at(0).passes,0);
});
test('Calorimetry resolves fully frozen, two-phase and fully melted regimes',()=>{
 const l=lab('calorimetry'),p={...values(l),ice:.2,initial:-10,water:.1,warm:50};
 const m=l.build(p,l.modes[0]),f=m.at(m.duration);
 near(m.at(0).temp,-10);near(f.temp,0);near(f.ice,.15);near(f.liquid,.15);
 const heater=l.build(p,l.modes[1]),end=heater.at(heater.duration);near(end.temp,45);near(end.ice,0);near(end.liquid,p.ice);near(end.enthalpy,p.ice*(334000+4180*45)/1000);
});
test('Scenes and numeric readings remain finite across supported extremes',()=>{
 for(const l of labs)for(const mode of l.modes)for(const bound of ['min','max','value']){
  const p=Object.fromEntries(l.params.map(x=>[x.key,x[bound]])),model=l.build(p,mode);
  for(const fraction of [0,.31,.5,.89,1]){
   const t=model.duration*fraction,state=model.at(t);
   assert.ok(Object.values(state).every(Number.isFinite),l.id);
   assert.doesNotMatch(l.scene({p,mode,model,t,state,showPath:true,showVectors:true}),/NaN|undefined|Infinity/);
  }
 }
});
