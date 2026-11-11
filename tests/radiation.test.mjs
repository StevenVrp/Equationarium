import assert from 'node:assert/strict';
import { test } from 'node:test';
import { labs } from '../dist/lib/radiation.mjs';
const [optics, gas, waves]=labs;
const defaults=lab=>Object.fromEntries(lab.params.map(p=>[p.key,p.value]));
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol, `${a} vs ${b}`);
test('Snell direction, reflectance and critical transition',()=>{
  let p={...defaults(optics),n1:1,n2:1.5,angle:0};
  let s=optics.build(p,'Fixed incidence').at(0);
  close(s.refl,4);close(s.trans,96);close(s.beta,0);
  p={...p,n1:1.5,n2:1,angle:30};s=optics.build(p,'Fixed incidence').at(0);
  close(s.beta,Math.asin(.75)*180/Math.PI);close(s.refl+s.trans,100);
  p.angle=s.crit;s=optics.build(p,'Fixed incidence').at(0);close(s.beta,90,1e-5);close(s.trans,0,1e-4);
  p.angle+=.01;s=optics.build(p,'Fixed incidence').at(0);assert.equal(s.tir,1);close(s.refl,100);
  p.angle=60;s=optics.build(p,'Angle scan').at(4);close(s.inc,30);
});
test('Gas path invariants and energy closure',()=>{
  const p=defaults(gas), R=8.31446261815324;
  for (const mode of gas.modes) {
    const model=gas.build(p,mode);
    for(let i=0;i<=80;i++){
      const s=model.at(model.duration*i/80);
      close(s.heat-s.work,s.internal);
      close(s.pressure*1000*s.v,p.amount*R*s.temp);
    }
    const a=model.at(0), b=model.at(model.duration);
    if(mode==='Isothermal'){close(a.temp,b.temp);close(b.work,p.amount*R*p.temperature*Math.log(p.ratio));}
    if(mode==='Adiabatic'){close(b.heat,0);close(a.temp*a.v**(2/3),b.temp*b.v**(2/3));}
    if(mode==='Isochoric'){close(a.v,b.v);close(b.work,0);}
    if(mode==='Isobaric'){close(a.pressure,b.pressure);}
    if(mode==='Four-stroke cycle'){
      close(b.work,p.amount*R*p.temperature*(p.ratio-1));close(b.internal,0);close(b.work/b.heatIn,1/6.5);
      for(const t of [2,4,6]){
        const s=model.at(t-1e-8),u=model.at(t+1e-8);
        for(const k of ['temp','v','work','heat'])close(s[k],u[k],1e-4);
      }
    }
  }
});
test('Counterpropagating waves satisfy node conditions, superposition and measured velocity',()=>{
  const p=defaults(waves), a=waves.build(p,'Standing wave'),b=waves.build(p,'Incident component'),c=waves.build(p,'Reflected component');
  close(a.at(0).frequency,1.5);close(a.at(0).wavelength,8/3);
  for(let i=0;i<=30;i++) {
    const t=i/7,x=i*p.length/30;
    close(a.sample(0,t)[0],0);close(a.sample(p.length,t)[0],0);
    close(a.sample(x,t)[0],b.sample(x,t)[0]+c.sample(x,t)[0]);
    close(a.sample(x,t)[1],(a.sample(x,t+1e-5)[0]-a.sample(x,t-1e-5)[0])/2e-5,1e-8);
  }
});
test('All permitted endpoint settings yield finite outputs and renderable geometry',()=>{
  for(const lab of labs)for(const boundary of ['min','max'])for(const mode of lab.modes){
    const p=Object.fromEntries(lab.params.map(a=>[a.key,a[boundary]])),model=lab.build(p,mode);
    for(const fraction of [0,.5,1]) {
      const t=model.duration*fraction,state=model.at(t);
      assert.ok(Object.values(state).every(Number.isFinite));
      const scene=lab.scene({p,mode,model,state,t,showVectors:true,showPath:true});
      assert.ok(!/NaN|Infinity|undefined/.test(scene));
    }
  }
});
