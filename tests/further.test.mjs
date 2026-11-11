import test from 'node:test';
import assert from 'node:assert/strict';
import {labs} from '../dist/lib/further.mjs';
const get=id=>labs.find(l=>l.id===id);
const defaults=l=>Object.fromEntries(l.params.map(p=>[p.key,p.value]));
function close(a,b,rel=1e-8){assert.ok(Math.abs(a-b)<rel*Math.max(1,Math.abs(a),Math.abs(b)),a+' ≠ '+b);}
test('Force equals the negative potential slope in both landscapes',()=>{
  const l=get('potential');
  for(const mode of l.modes){
    const m=l.build(defaults(l),mode);
    for(const r of [.31,.8,2,4.2,6]){
      const h=1e-5;
      close(m.forceAt(r),-(m.energyAt(r+h)-m.energyAt(r-h))/(2*h),2e-8);
    }
  }
  close(l.build(defaults(l),l.modes[0]).forceAt(2),0);
});
test('Isolated capacitor keeps charge and connected capacitor keeps voltage',()=>{
  const l=get('capacitor'),p=defaults(l);
  for(const mode of l.modes){
    const m=l.build(p,mode),a=m.at(0),b=m.at(4),ratio=b.d/a.d;
    close(a.capacitance/b.capacitance,ratio);
    if(mode==='Fixed charge'){
      close(a.charge,b.charge);close(b.energy/a.energy,ratio);close(a.force,b.force);
    }else{
      close(a.voltage,b.voltage);close(a.charge/b.charge,ratio);close(a.force/b.force,ratio**2);
    }
    close(a.energy,0.5*a.charge*a.voltage/1000);
  }
});
test('Charge sign controls initial curvature and magnetic field conserves kinetic energy',()=>{
  const l=get('particle');
  for(const specific of [-3,3]){
    const p={...defaults(l),specific,pitch:0,electric:0},m=l.build(p),a=m.at(0);
    assert.equal(Math.sign(a.ay),-Math.sign(specific));
    const period=1/a.frequency,b=m.at(period);
    close(b.x,0);close(b.y,0);close(b.vx,p.speed);close(b.vy,0);
    for(let i=0;i<=30;i++)close(m.at(i*.1).specificEnergy,a.specificEnergy);
  }
});
test('Weak and zero fields approach straight-line motion and constant axial acceleration',()=>{
  const l=get('particle');
  for(const magnetic of [0,1e-15]){
    const p={...defaults(l),magnetic,pitch:0,electric:.5},s=l.build(p).at(2);
    close(s.x,2*p.speed);close(s.y,0);close(s.vz,3);close(s.z,3);
    close(s.specificEnergy-.5*p.speed**2,p.specific*p.electric*s.z);
  }
  const p={...defaults(l),specific:0,electric:.5};
  close(l.build(p).at(2).speed,p.speed);
});
test('All further lab modes return finite metrics, graphs and geometry at parameter extrema',()=>{
  for(const l of labs)for(const which of ['min','value','max'])for(const mode of l.modes??['']){
    const p=Object.fromEntries(l.params.map(d=>[d.key,d[which]])),model=l.build(p,mode);
    for(const t of [0,.5*model.duration,model.duration]){
      const state=model.at(t);
      for(const {key} of [...l.series,...l.metrics])assert.ok(Number.isFinite(state[key]),l.id+' '+key);
      for(const view of ['2D','3D']){
        const svg=l.scene({p,mode,model,state,t,showVectors:true,showPath:true,project:(x,y,z)=>[380+180*x+20*z,195-150*y],view});
        assert.ok(!/NaN|Infinity/.test(svg),l.id+' invalid SVG');
      }
    }
  }
});
