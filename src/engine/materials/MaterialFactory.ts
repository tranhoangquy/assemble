import * as THREE from 'three';
import type { MaterialDefinition } from '@/types/product';

export class MaterialFactory {
  static create(definition: MaterialDefinition): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      color: definition.color,
      roughness: definition.roughness ?? 0.7,
      metalness: definition.metalness ?? 0,
      emissive: definition.emissive ?? '#000000',
      emissiveIntensity: 0,
      transparent: true,
      opacity: 1,
    });
    if (definition.finish === 'oak-review') {
      const width = 1024, height = 512;
      const color = new Uint8Array(width * height * 4);
      const relief = new Uint8Array(width * height * 4);
      const base = new THREE.Color(definition.color).convertLinearToSRGB();
      const hash = (x: number,y:number) => { const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v); };
      const noise = (x:number,y:number) => { const ix=Math.floor(x),iy=Math.floor(y);let fx=x-ix,fy=y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),fx),THREE.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),fx),fy); };
      // Periodic value-noise removes the visible cross-panel seams at texture repeats.
      const periodic = (x:number,y:number,sx:number,sy:number) => {
        const u=x/width,v=y/height,fx=u*u*(3-2*u),fy=v*v*(3-2*v);
        return THREE.MathUtils.lerp(THREE.MathUtils.lerp(noise(x/sx,y/sy),noise((x-width)/sx,y/sy),fx),THREE.MathUtils.lerp(noise(x/sx,(y-height)/sy),noise((x-width)/sx,(y-height)/sy),fx),fy);
      };
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const warp = (periodic(x,y,260,180)-0.5)*45 + Math.sin(x/width*Math.PI*2+y/height*Math.PI*2)*7;
        const line = y + warp;
        const rings = Math.sin(line / height * Math.PI * 2 * 9 + periodic(x,y,350,42)*8);
        const fiber = Math.pow(0.5 + 0.5 * Math.sin(line / height * Math.PI * 2 * 76 + periodic(x,y,80,11)*5), 20) * periodic(x,y,35,80);
        const n = periodic(x,y,2,2);
        const v = 0.88 + rings * 0.07 - fiber * 0.12 + (n - 0.5) * 0.035 + (periodic(x,y,180,90)-0.5)*0.14;
        const i = (y * width + x) * 4;
        color[i] = Math.min(255, base.r * 255 * v); color[i+1] = Math.min(255, base.g * 255 * v); color[i+2] = Math.min(255, base.b * 255 * v); color[i+3] = 255;
        relief[i] = relief[i+1] = relief[i+2] = 150 + rings * 8 - fiber * 22; relief[i+3] = 255;
      }
      const texture = (data: Uint8Array, srgb = false) => {
        const t = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
        t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
        if (srgb) t.colorSpace = THREE.SRGBColorSpace;
        t.needsUpdate = true; return t;
      };
      material.map = texture(color, true); material.bumpMap = texture(relief); material.bumpScale = 0.025;
      material.roughnessMap = texture(relief); material.roughness = 0.86; material.color.set('#ffffff');
    } else if (definition.surface === 'wood' || definition.surface === 'painted-wood') {
      const width = 256;
      const height = 64;
      const data = new Uint8Array(width * height * 4);
      const base = new THREE.Color(definition.color);
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const index = (y * width + x) * 4;
          const longGrain = Math.sin(y * 0.34 + Math.sin(x * 0.018) * 1.25) * 0.028;
          const fineGrain = Math.sin(y * 1.12 + x * 0.012) * 0.012;
          const pores = ((((x * 17 + y * 31) % 29) / 29) - 0.5) * 0.012;
          const variation = 0.98 + longGrain + fineGrain + pores;
          data[index] = Math.round(Math.min(255, base.r * 255 * variation));
          data[index + 1] = Math.round(Math.min(255, base.g * 255 * variation));
          data[index + 2] = Math.round(Math.min(255, base.b * 255 * variation));
          data[index + 3] = 255;
        }
      }
      const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(definition.grainScale ?? 2.4, 1);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      material.map = texture;
      material.color.set('#ffffff');
    }
    return material;
  }
}
