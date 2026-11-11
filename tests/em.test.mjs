import test from 'node:test';
import assert from 'node:assert/strict';
import {labs} from '../dist/lib/em.mjs';
const get=id=>labs.find(l=>l.id===id);
const defaults=lab=>Object.fromEntries(lab.params.map(v=>[v.key,v.value]));
const close=(actual,expected,tol=1e-8)=>assert.ok(Math.abs(actual-expected)<=tol,`${actual} ≠ ${expected} within ${tol}`);
test('dipole midplane is equipotential with horizontal field and the potential gradient matches E',()=>{
  const lab=get('field'),p=defaults(lab),m=lab.build(p,lab.modes[0]);
  const s=m.at(4);
  close(s.potential,0);close(s.ey,0);assert.ok(s.ex>0);
  const t=5,h=.00001,dxdt=.25;
  close(m.at(t).ex,-(m.at(t+h).potential-m.at(t-h).potential)/(2*h*dxdt),.00001);
});
test('zero charges and single charge have correct limiting fields',()=>{
  const lab=get('field'),p={...defaults(lab),q1:0,q2:0};
  for(const mode of lab.modes){
    const s=lab.build(p,mode).at(3);
    close(s.field,0);close(s.force,0);close(s.potential,0);
  }
  p.q2=5;
  const s=lab.build(p,lab.modes[0]).at(4);
  close(s.field,8.9875517923*5/((p.d/2)**2+p.h**2));
});
test('charging and discharging match initial conditions, time constant and Kirchhoff voltage sum',()=>{
  const lab=get('rc'),p=defaults(lab);
  const charging=lab.build(p,'Charge'),discharging=lab.build(p,'Discharge');
  close(charging.at(0).voltage,0);close(discharging.at(0).voltage,p.voltage);
  const a=charging.at(1),b=discharging.at(1);
  close(a.tau,1);close(a.voltage,9*(1-Math.exp(-1)));close(a.resistor+a.voltage,9);close(b.voltage+b.resistor,0);
  close(a.current,-b.current);
});
test('discharge power matches capacitor energy loss',()=>{
  const lab=get('rc'),m=lab.build(defaults(lab),'Discharge'),h=1e-5,t=.75;
  const power=-(m.at(t+h).energy-m.at(t-h).energy)/(2*h);
  close(power,10*m.at(t).current**2,1e-7);
});
test('induction vanishes at alignment; emf is the negative derivative of linkage',()=>{
  const lab=get('induction'),p=defaults(lab);
  for(const mode of lab.modes){
    const m=lab.build(p,mode),t=m.duration*.36,h=1e-6;
    close(m.at(m.duration/2).emf,0);
    const induced=-(m.at(t+h).linkage-m.at(t-h).linkage)/(2*h)*.001;
    close(m.at(t).emf,induced,1e-6);
    close(m.at(0).flux,m.at(m.duration).flux);
    assert.ok(m.at(t).emf<0);
  }
  const m=lab.build({...p,current:0},'Forward pass');
  close(m.at(m.duration*.3).emf,0);
});
test('graphs, numeric outputs and scene geometry are finite over allowed extremes',()=>{
  for(const l of labs)for(const bound of ['min','max','value'])for(const mode of l.modes){
    const p=Object.fromEntries(l.params.map(v=>[v.key,v[bound]])),model=l.build(p,mode);
    for(const fraction of [0,.5,1]){
      const t=model.duration*fraction,state=model.at(t);
      for(const k of [...l.metrics,...l.series])assert.ok(Number.isFinite(state[k.key]),l.id+' '+k.key);
      for(const view of ['2D','3D']){
        const svg=l.scene({p,model,t,state,mode,view,project:(x,y,z)=>[380+300*x+30*z,195-150*y],showPath:true,showVectors:true});
        assert.ok(!/NaN|Infinity|undefined/.test(svg),l.id+' '+mode);
      }
    }
  }
});
