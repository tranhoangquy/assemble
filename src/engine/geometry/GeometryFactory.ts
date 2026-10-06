import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { GeometryDefinition } from '@/types/product';
import {applyFaceBores,type BoreFaceRegions} from './FaceBores';
import {intersectSolid} from './SolidSubtraction';

export class GeometryFactory {
  static create(definition: GeometryDefinition): THREE.BufferGeometry {
    switch (definition.type) {
      case 'compound': {
        const pieces=definition.pieces.map(piece=>{
          const source=this.create(piece.geometry),g=source.index?source.toNonIndexed():source;
          if(g!==source)source.dispose();
          if(piece.rotation)g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...piece.rotation.map(a=>a*Math.PI/180) as [number,number,number])));
          if(piece.position)g.translate(...piece.position);
          return g;
        });
        const result=mergeGeometries(pieces);
        for(const g of pieces)g.dispose();
        if(!result)throw new Error('Invalid compound geometry');
        return result;
      }
      case 'profile-prism': {
        if(definition.points.length<3||definition.depth<=0)throw new Error('Invalid planar profile');
        // ExtrudeGeometry only reverses hole winding when it also reverses
        // the outer contour. Normalize both explicitly, so a clockwise
        // product profile cannot produce outward-facing cavity walls.
        const outline=definition.points.map(p=>new THREE.Vector2(...p));
        if(!THREE.ShapeUtils.isClockWise(outline))outline.reverse();
        const shape=new THREE.Shape(outline);
        shape.closePath();
        for(const h of definition.holes??[]){const cut=new THREE.Path();cut.absarc(h.x,h.y,h.radius,0,Math.PI*2,false);shape.holes.push(cut);}
        const g=new THREE.ExtrudeGeometry(shape,{depth:definition.depth,bevelEnabled:false,curveSegments:32});
        g.translate(0,0,-definition.depth/2);
        const p=g.getAttribute('position'),n=g.getAttribute('normal');
        if(definition.axis==='x')for(const a of [p,n])for(let i=0;i<a.count;i++)a.setXYZ(i,a.getZ(i),a.getX(i),a.getY(i));
        if(definition.axis==='y')g.rotateX(-Math.PI/2);
        let regions:BoreFaceRegions|undefined;
        if(definition.preserveEndProfile&&definition.size){
          regions={};const extrusion=definition.axis??'z';
          const map=(a:number,b:number,t:number):[number,number,number]=>extrusion==='x'?[t,a,b]:extrusion==='y'?[a,t,-b]:[a,b,t];
          for(const [k,axis]of (['x','y','z'] as const).entries()){
            const project=(p:[number,number,number]):[number,number]=>axis==='x'?[p[1],p[2]]:axis==='y'?[p[0],p[2]]:[p[0],p[1]];
            const faces={positive:[] as [number,number][][],negative:[] as [number,number][][]};
            for(const side of [-1,1]){
              const list=faces[side>0?'positive':'negative'];
              if(axis===extrusion)list.push(definition.points.map(([a,b])=>project(map(a,b,side*definition.depth/2))));
              else for(let i=0;i<definition.points.length;i++){
                const a=definition.points[i],b=definition.points[(i+1)%definition.points.length],pa=map(...a,0),pb=map(...b,0),edge=side*definition.size[k]/2;
                if(Math.abs(pa[k]-edge)<1e-6&&Math.abs(pb[k]-edge)<1e-6)list.push([project(map(...a,-definition.depth/2)),project(map(...b,-definition.depth/2)),project(map(...b,definition.depth/2)),project(map(...a,definition.depth/2))]);
              }
            }regions[axis]=faces;
          }
        }
        return definition.faceBores?.length&&definition.size?applyFaceBores(g,definition.size,definition.faceBores,true,regions):g;
      }
      case 'bored-panel': {
        const [w, h, d] = definition.size;
        const across = definition.boreAxis === 'z' ? h : d;
        const depth = definition.boreAxis === 'z' ? d : h;
        // ExtrudeGeometry grows its bevel outside the declared core. Clip
        // only this generated overrun to the finished nominal envelope;
        // retain the closed, flush joining faces and original hole contours.
        const bevel=Math.max(0,Math.min(definition.bevel??0.04,Math.min(w,across,depth)/2-1e-6));
        const halfW=w/2,halfAcross=across/2;
        const shape = new THREE.Shape();
        shape.moveTo(-halfW, -halfAcross); shape.lineTo(halfW, -halfAcross);
        shape.lineTo(halfW, halfAcross); shape.lineTo(-halfW, halfAcross); shape.closePath();
        for (const hole of definition.holes) {
          const cut = new THREE.Path();
          cut.absarc(hole.x, -hole.z, hole.radius, 0, Math.PI * 2, true);
          shape.holes.push(cut);
        }
        const raw = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel>0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 24 });
        raw.translate(0, 0, -depth / 2);
        let g:THREE.BufferGeometry=raw;
        if (definition.boreAxis !== 'z') g.rotateX(-Math.PI / 2);
        if(bevel>0){const envelope=new THREE.BoxGeometry(...definition.size);g=intersectSolid(raw,envelope);raw.dispose();envelope.dispose();}
        if (definition.edgeBores?.length && definition.boreAxis !== 'z') {
          // Replace the two edge faces, not overlay black disks: openings have real bore walls.
          const position=g.getAttribute('position'),normal=g.getAttribute('normal'),uv=g.getAttribute('uv');
          const p:number[]=[],n:number[]=[],u:number[]=[];
          for(let i=0;i<position.count;i+=3){
            if ([i,i+1,i+2].every(k=>Math.abs(normal.getZ(k))>0.9999)) continue;
            for(let k=i;k<i+3;k++){p.push(position.getX(k),position.getY(k),position.getZ(k));n.push(normal.getX(k),normal.getY(k),normal.getZ(k));u.push(uv.getX(k),uv.getY(k));}
          }
          const shell=new THREE.BufferGeometry();shell.setAttribute('position',new THREE.Float32BufferAttribute(p,3));shell.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));shell.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));
          const pieces:THREE.BufferGeometry[]=[shell];
          for(const side of [-1,1]){
            const face=new THREE.Shape();face.moveTo(-w/2,-h/2);face.lineTo(w/2,-h/2);face.lineTo(w/2,h/2);face.lineTo(-w/2,h/2);face.closePath();
            for(const bore of definition.edgeBores){const hole=new THREE.Path();hole.absarc(side*bore.x,0,bore.radius,0,Math.PI*2,true);face.holes.push(hole);}
            const edge=new THREE.ShapeGeometry(face,32);if(side<0)edge.rotateY(Math.PI);edge.translate(0,0,side*d/2);pieces.push(edge);
            for(const bore of definition.edgeBores){
              const wall=new THREE.CylinderGeometry(bore.radius,bore.radius,2.2,32,1,true).toNonIndexed();wall.rotateX(Math.PI/2);wall.translate(bore.x,0,side*(d/2-1.1));
              const wp=wall.getAttribute('position'),wn=wall.getAttribute('normal'),wu=wall.getAttribute('uv');
              for(let i=0;i<wp.count;i+=3){
                for(const attr of [wp,wn,wu]){const a=Array.from({length:attr.itemSize},(_,j)=>attr.getComponent(i+1,j));for(let j=0;j<attr.itemSize;j++){attr.setComponent(i+1,j,attr.getComponent(i+2,j));attr.setComponent(i+2,j,a[j]);}}
              }
              for(let i=0;i<wn.count;i++)wn.setXYZ(i,-wn.getX(i),-wn.getY(i),-wn.getZ(i));
              pieces.push(wall);
            }
          }
          const merged=mergeGeometries(pieces.map(piece=>piece.index?piece.toNonIndexed():piece))!;g.dispose();return definition.faceBores?.length?applyFaceBores(merged,definition.size,definition.faceBores):merged;
        }
        return definition.faceBores?.length?applyFaceBores(g,definition.size,definition.faceBores):g;
      }
      case 'tabbed-stile':{
        const [w,h,d]=definition.size;
        const body=new RoundedBoxGeometry(w,h,d,3,0.08);
        const tabs=[-1,1].map(side=>new THREE.BoxGeometry(definition.tabWidth,definition.tabHeight,definition.tabDepth).translate(0,side*(h+definition.tabHeight)/2,0));
        return mergeGeometries([body,...tabs].map(g=>g.index?g.toNonIndexed():g))!;
      }
      case 'fluted-dowel': {
        const g = new THREE.CylinderGeometry(definition.radius, definition.radius, definition.height, 64, 1);
        const p = g.getAttribute('position');
        for (let i = 0; i < p.count; i++) {
          const a = Math.atan2(p.getZ(i), p.getX(i));
          const r = 1 - 0.065 * (0.5 + 0.5 * Math.cos(a * 16));
          p.setXYZ(i, p.getX(i) * r, p.getY(i), p.getZ(i) * r);
        }
        g.computeVertexNormals(); return g;
      }
      case 'horizontal-cam': {
        const shape = new THREE.Shape();
        shape.absarc(0, 0, definition.radius, 0, Math.PI * 2, false);
        const slot = new THREE.Path();
        slot.moveTo(-definition.radius * 0.65, -0.1); slot.lineTo(-definition.radius * 0.65, 0.1);
        slot.lineTo(definition.radius * 0.65, 0.1); slot.lineTo(definition.radius * 0.65, -0.1); slot.closePath();
        shape.holes.push(slot);
        const g = new THREE.ExtrudeGeometry(shape, { depth: definition.height, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, curveSegments: 32 });
        g.translate(0, 0, -definition.height / 2); g.rotateX(-Math.PI / 2); return g;
      }
      case 'socket-bolt': {
        const shaft = new THREE.CylinderGeometry(definition.radius * 0.84, definition.radius * 0.84, definition.height, 24);
        const head = new THREE.Shape(); head.absarc(0, 0, definition.radius * 2.05, 0, Math.PI * 2, false);
        const recess = new THREE.Path();
        for (let i = 0; i < 6; i++) { const a = -i * Math.PI / 3; const x = Math.cos(a) * definition.radius * 0.72; const y = Math.sin(a) * definition.radius * 0.72; if (!i) recess.moveTo(x,y); else recess.lineTo(x,y); }
        recess.closePath(); head.holes.push(recess);
        const cap = new THREE.ExtrudeGeometry(head, { depth: 0.22, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, curveSegments: 32 });
        cap.rotateX(-Math.PI / 2); cap.translate(0, definition.height / 2, 0);
        const curve = new THREE.CatmullRomCurve3(Array.from({ length: 401 }, (_, i) => { const a = i / 400 * Math.PI * 2 * 32; return new THREE.Vector3(Math.cos(a) * definition.radius, -definition.height / 2 + i / 400 * definition.height, Math.sin(a) * definition.radius); }));
        const thread = new THREE.TubeGeometry(curve, 800, 0.045, 5, false);
        return mergeGeometries([shaft.toNonIndexed(), cap, thread.toNonIndexed()])!;
      }
      case 'box': {
        const [width, height, depth] = definition.size;
        if (width <= 0 || height <= 0 || depth <= 0) throw new Error('Box dimensions must be positive');
        if (definition.bevel && definition.bevel > 0) {
          return new RoundedBoxGeometry(width, height, depth, 3, Math.min(definition.bevel, Math.min(...definition.size) / 2));
        }
        return new THREE.BoxGeometry(width, height, depth);
      }
      case 'cylinder':
        if (definition.radius <= 0 || definition.height <= 0) throw new Error('Cylinder dimensions must be positive');
        return new THREE.CylinderGeometry(definition.radius, definition.radius, definition.height, definition.segments ?? 24);
      case 'sphere':
        if (definition.radius <= 0) throw new Error('Sphere radius must be positive');
        return new THREE.SphereGeometry(definition.radius, definition.segments ?? 24, definition.segments ?? 16);
      case 'screw': {
        if (definition.radius <= 0 || definition.length <= 0 || definition.headRadius <= 0 || definition.headHeight <= 0) throw new Error('Screw dimensions must be positive');
        const points = [
          new THREE.Vector2(0, -definition.length / 2),
          new THREE.Vector2(definition.radius * 0.35, -definition.length / 2 + definition.radius),
          new THREE.Vector2(definition.radius, -definition.length / 2 + definition.radius * 1.5),
          new THREE.Vector2(definition.radius, definition.length / 2 - definition.headHeight),
          new THREE.Vector2(definition.headRadius, definition.length / 2 - definition.headHeight * 0.72),
          new THREE.Vector2(definition.headRadius, definition.length / 2 - definition.headHeight * 0.2),
          new THREE.Vector2(definition.headRadius * 0.72, definition.length / 2),
          new THREE.Vector2(0, definition.length / 2),
        ];
        const body=new THREE.LatheGeometry(points, definition.segments ?? 32);
        if(!definition.threaded)return body;
        body.dispose();
        const shaft=new THREE.LatheGeometry(points.slice(0,4).concat([new THREE.Vector2(0,definition.length/2-definition.headHeight)]),32);
        const head=new THREE.Shape();head.absarc(0,0,definition.headRadius,0,Math.PI*2,false);
        const slot=new THREE.Path(),r=definition.headRadius*.72,w=definition.headRadius*.15;
        for(const [i,[x,y]]of [[-w,-r],[w,-r],[w,-w],[r,-w],[r,w],[w,w],[w,r],[-w,r],[-w,w],[-r,w],[-r,-w],[-w,-w]].entries()){if(i)slot.lineTo(x,y);else slot.moveTo(x,y);}slot.closePath();head.holes.push(slot);
        const cap=new THREE.ExtrudeGeometry(head,{depth:definition.headHeight,bevelEnabled:false,curveSegments:32});cap.rotateX(-Math.PI/2);cap.translate(0,definition.length/2-definition.headHeight,0);
        const floor=new THREE.CylinderGeometry(definition.headRadius,definition.headRadius,.025,32).translate(0,definition.length/2-definition.headHeight,0);
        const height=definition.length-definition.headHeight-0.15;
        const turns=Math.max(5,height/0.22);
        const curve=new THREE.CatmullRomCurve3(Array.from({length:301},(_,i)=>{const a=i/300*Math.PI*2*turns;return new THREE.Vector3(Math.cos(a)*definition.radius,-definition.length/2+0.15+i/300*height,Math.sin(a)*definition.radius);}));
        const thread=new THREE.TubeGeometry(curve,600,0.025,5,false);
        return mergeGeometries([shaft.toNonIndexed(),cap,floor.toNonIndexed(),thread.toNonIndexed()])!;
      }
      case 'washer': {
        if (definition.innerRadius <= 0 || definition.outerRadius <= definition.innerRadius || definition.thickness <= 0) throw new Error('Washer dimensions must be positive');
        const shape = new THREE.Shape();
        shape.absarc(0, 0, definition.outerRadius, 0, Math.PI * 2, false);
        const hole = new THREE.Path();
        hole.absarc(0, 0, definition.innerRadius, 0, Math.PI * 2, true);
        shape.holes.push(hole);
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: definition.thickness, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, curveSegments: definition.segments ?? 24 });
        geometry.translate(0, 0, -definition.thickness / 2);
        geometry.rotateX(Math.PI / 2);
        return geometry;
      }
      case 'nut': {
        if (definition.innerRadius <= 0 || definition.outerRadius <= definition.innerRadius || definition.thickness <= 0) throw new Error('Nut dimensions must be positive');
        const shape = new THREE.Shape();
        for (let index = 0; index < 6; index += 1) {
          const angle = Math.PI / 6 + index * Math.PI / 3;
          const x = Math.cos(angle) * definition.outerRadius;
          const y = Math.sin(angle) * definition.outerRadius;
          if (index === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
        }
        shape.closePath();
        const hole = new THREE.Path();
        hole.absarc(0, 0, definition.innerRadius, 0, Math.PI * 2, true);
        shape.holes.push(hole);
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: definition.thickness, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.15, curveSegments: 20 });
        geometry.translate(0, 0, -definition.thickness / 2);
        geometry.rotateX(Math.PI / 2);
        return geometry;
      }
      case 'model':
        throw new Error(`GLB model loading is reserved for a future adapter: ${definition.src}`);
    }
  }
}
