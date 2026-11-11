import test from 'node:test';
import assert from 'node:assert/strict';
import {labs} from '../dist/lib/magnetic.mjs';
const near=(x,y,tol=1e-9)=>assert.ok(Math.abs(x-y)<=tol*Math.max(1,Math.abs(y)),x+' vs '+y);
const lab=id=>labs.find(l=>l.id===id);
const args=(l,extra={})=>({...Object.fromEntries(l.params.map(p=>[p.key,p.value])),...extra});
const build=(id,extra={},mode)=>{const l=lab(id);return l.build(args(l,extra),mode||l.modes?.[0])};
test('Loop center field, axial symmetry, sign and quadrature agreement',()=>{
 const p={current:2,turns:10,radius:.1,span:.3},m=build('magnet',p);
 near(m.at(4).by,40*Math.PI);near(m.at(0).by,m.at(8).by);
 near(build('magnet',{...p,current:-2}).at(4).by,-m.at(4).by);
 for(const g of m.glyphs.filter(g=>g.x===0)){near(g.field[0],0);near(g.field[1]*1e6,4*Math.PI*1e-7*20*.1**2/(2*(.1**2+g.y**2)**1.5)*1e6)}
});
test('Ampere wire field has inverse-radius dependence and correct right-hand sign',()=>{
 const m=build('magnet',{current:5,span:.1},'Straight wire');
 near(m.at(0).bz,-100);near(m.at(8).bz,-10);near(build('magnet',{current:0}).at(3).field,0);
});
test('Float draft, neutral equilibrium and open mesh support',()=>{
 const light=build('buoyancy',{rho:1000,solid:750,height:.20},'Free equilibrium').at(1);
 near(light.depth,.15);near(light.support,0);near(light.buoyant,light.weight);
 const neutral=build('buoyancy',{solid:1000},'Free equilibrium').at(3);near(neutral.support,0);
 const dense=build('buoyancy',{solid:2000,rho:1000},'Free equilibrium').at(3);near(dense.support,dense.buoyant);
 const sweep=build('buoyancy',{width:.12}).at(3);near(sweep.pressure*.12**2,sweep.buoyant);
});
test('Doppler pressure period, stationary and equal-speed limits',()=>{
 const p={c:340,f:17,ms:.1,mr:.05},m=build('doppler',p),s=m.at(.1);
 near(s.front,18);near(s.freq,323/18);near(m.at(.1+1/s.freq).pressure,s.pressure);
 near(build('doppler',{ms:.42,mr:.42,f:10}).at(0).freq,10);
 near(build('doppler',{ms:0,mr:0,f:10}).at(0).offset,0);
});
test('Zero uncertainty reproduces gravity; interval bias divides across cycles',()=>{
 const p={length:1,uL:0,scatter:0,bias:0},m=build('uncertainty',p),s=m.at(m.duration);
 near(s.g,9.81);near(s.ug,0);near(s.count,20);
 const p1=build('uncertainty',{...p,bias:.12}),p10=build('uncertainty',{...p,bias:.12},'Time ten oscillations');
 near(p1.at(0).mean-m.truePeriod,.12);near(p10.at(0).mean-m.truePeriod,.012);
 near(build('uncertainty',{...p,uL:.01}).at(0).ug,.0981);
});
test('Seeded uncertainty ensemble is repeatable and sample statistics use Bessel correction',()=>{
 const m=build('uncertainty'),again=build('uncertainty');
 assert.deepEqual(m.records,again.records);assert.notDeepEqual(m.records,build('uncertainty',{sampleSeed:33}).records);
 const [a,b]=m.records;near(m.at(0).uMean,Math.abs(a-b)/2);near(m.at(m.duration).count,20);
});
test('Magnetic, buoyancy, Doppler and uncertainty scenes survive controls at limits',()=>{
 for(const l of labs)for(const key of ['min','value','max'])for(const mode of l.modes||['']){
  const p=Object.fromEntries(l.params.map(k=>[k.key,k[key]])),model=l.build(p,mode);
  for(const t of [0,model.duration/2,model.duration])for(const view of ['2D','3D']){
   const state=model.at(t);for(const s of [...l.metrics,...l.series])assert.ok(Number.isFinite(state[s.key]),l.id+' '+s.key);
   const svg=l.scene({p,mode,model,t,state,view,showPath:true,showVectors:true,project:(x,y,z)=>[380+160*(x-.3*z),195-145*(y+.2*z)]});
   assert.doesNotMatch(svg,/NaN|undefined|Infinity/);
  }
 }
});
