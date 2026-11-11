import test from 'node:test';
import assert from 'node:assert/strict';
import {labs} from '../dist/lib/optical.mjs';
const get=id=>labs.find(l=>l.id===id);
const defaults=l=>Object.fromEntries(l.params.map(p=>[p.key,p.value]));
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8, `${a} ≠ ${b}`);
test('One converging lens gives correct image, magnification, and focused spot',()=>{
 const lab=get('bench'),p={...defaults(lab),object:.1,screen:.9},m=lab.build(p,'Fixed detector',{x1:.4,f1:.1875});
 close(m.imageX,.9);close(m.magnification,-5/3);close(m.at(0).spot,0);
});
test('Diverging lens gives a virtual image; an object at focus gives parallel output',()=>{
 const l=get('bench'),p={...defaults(l),object:.1};
 let m=l.build(p,'Fixed detector',{x1:.4,f1:.3,s1:-1});close(m.distance,-.15);close(m.magnification,.5);
 m=l.build(p,'Fixed detector',{x1:.4,f1:.3});assert.equal(m.imageX,null);close(m.rays[0].u,m.rays[2].u);
});
test('Three-lens construction and scanning detector advance consistently',()=>{
 const l=get('bench'),p=defaults(l),m=l.build(p,'Scan detector',{count:3});
 assert.equal(m.rays[0].points.length,4);assert.ok(m.at(m.duration).screen>m.at(0).screen);
 const html=l.scene({p,model:m,state:m.at(2),showVectors:true,showPath:true});assert.doesNotMatch(html,/NaN|Infinity/);
});
test('Interference center, missing fourth order, point sources and exact symmetry',()=>{
 const l=get('interference'),p=defaults(l),m=l.build(p,'Finite double slit'),w=p.wave*1e-9*p.focal/(p.spacing*1e-3);
 close(m.point(0).intensity,1);close(m.point(4*w).intensity,0);close(m.point(.41*w).intensity,m.point(-.41*w).intensity);
 close(l.build(p,'Point slits').point(4*w).intensity,1);close(m.at(m.duration/2).phase,0);
});
