import * as THREE from 'three';

// Polygonal solid subtraction. Unlike separately meshing each bore, the BSP
// clips all previous bore walls and blind floors against each new cutter.
// Vertices retain source normals and UVs, including bevels and grain faces.
const EPSILON = 1e-5;

class Vertex {
  constructor(public position: THREE.Vector3, public normal: THREE.Vector3, public uv: THREE.Vector2) {}
  clone() { return new Vertex(this.position.clone(), this.normal.clone(), this.uv.clone()); }
  flip() { this.normal.negate(); }
  interpolate(other: Vertex, t: number) {
    return new Vertex(this.position.clone().lerp(other.position, t), this.normal.clone().lerp(other.normal, t).normalize(), this.uv.clone().lerp(other.uv, t));
  }
}

class Plane {
  constructor(public normal: THREE.Vector3, public distance: number) {}
  clone() { return new Plane(this.normal.clone(), this.distance); }
  flip() { this.normal.negate(); this.distance = -this.distance; }
  split(polygon: Polygon, coplanarFront: Polygon[], coplanarBack: Polygon[], front: Polygon[], back: Polygon[]) {
    const types = polygon.vertices.map(vertex => {
      const distance = this.normal.dot(vertex.position) - this.distance;
      return distance < -EPSILON ? 2 : distance > EPSILON ? 1 : 0;
    });
    const type = types.reduce<number>((a, b) => a | b, 0);
    if (type === 0) {
      (this.normal.dot(polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);
    } else if (type === 1) front.push(polygon);
    else if (type === 2) back.push(polygon);
    else {
      const f: Vertex[] = [], b: Vertex[] = [];
      for (let i = 0; i < polygon.vertices.length; i++) {
        const j = (i + 1) % polygon.vertices.length, vi = polygon.vertices[i], vj = polygon.vertices[j];
        if (types[i] !== 2) f.push(vi);
        if (types[i] !== 1) b.push(types[i] !== 2 ? vi.clone() : vi);
        if ((types[i] | types[j]) === 3) {
          const direction = vj.position.clone().sub(vi.position);
          const t = (this.distance - this.normal.dot(vi.position)) / this.normal.dot(direction);
          const vertex = vi.interpolate(vj, Math.max(0, Math.min(1, t)));
          f.push(vertex); b.push(vertex.clone());
        }
      }
      const fp = Polygon.create(f), bp = Polygon.create(b);
      if (fp) front.push(fp);
      if (bp) back.push(bp);
    }
  }
}

class Polygon {
  constructor(public vertices: Vertex[], public plane: Plane) {}
  static create(vertices: Vertex[]) {
    const cleaned = vertices.filter((v, i) => v.position.distanceToSquared(vertices[(i + vertices.length - 1) % vertices.length].position) > EPSILON * EPSILON);
    if (cleaned.length < 3) return undefined;
    const first = cleaned[0].position;
    for (let i = 1; i < cleaned.length - 1; i++) {
      const normal = cleaned[i].position.clone().sub(first).cross(cleaned[i + 1].position.clone().sub(first));
      if (normal.lengthSq() > EPSILON * EPSILON) {
        normal.normalize(); return new Polygon(cleaned, new Plane(normal, normal.dot(first)));
      }
    }
    return undefined;
  }
  flip() { this.vertices.reverse().forEach(vertex => vertex.flip()); this.plane.flip(); }
}

class Node {
  plane?: Plane;
  polygons: Polygon[] = [];
  front?: Node;
  back?: Node;
  constructor(polygons: Polygon[] = []) { this.build(polygons); }
  invert() {
    this.polygons.forEach(polygon => polygon.flip()); this.plane?.flip();
    this.front?.invert(); this.back?.invert();
    [this.front, this.back] = [this.back, this.front];
  }
  clipPolygons(polygons: Polygon[]): Polygon[] {
    if (!this.plane) return polygons.slice();
    let front: Polygon[] = [], back: Polygon[] = [];
    for (const polygon of polygons) this.plane.split(polygon, front, back, front, back);
    if (this.front) front = this.front.clipPolygons(front);
    back = this.back ? this.back.clipPolygons(back) : [];
    return front.concat(back);
  }
  clipTo(other: Node) {
    this.polygons = other.clipPolygons(this.polygons);
    this.front?.clipTo(other); this.back?.clipTo(other);
  }
  allPolygons(): Polygon[] { return this.polygons.concat(this.front?.allPolygons() ?? [], this.back?.allPolygons() ?? []); }
  build(polygons: Polygon[]) {
    if (!polygons.length) return;
    this.plane ??= polygons[0].plane.clone();
    const front: Polygon[] = [], back: Polygon[] = [];
    for (const polygon of polygons) this.plane.split(polygon, this.polygons, this.polygons, front, back);
    if (front.length) { this.front ??= new Node(); this.front.build(front); }
    if (back.length) { this.back ??= new Node(); this.back.build(back); }
  }
}

function polygonsFromGeometry(geometry: THREE.BufferGeometry): Polygon[] {
  const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal'), uv = geometry.getAttribute('uv');
  const index = geometry.getIndex(), count = index?.count ?? positions.count, result: Polygon[] = [];
  for (let i = 0; i < count; i += 3) {
    const vertices = Array.from({length: 3}, (_, k) => {
      const j = index?.getX(i + k) ?? i + k;
      return new Vertex(new THREE.Vector3(positions.getX(j),positions.getY(j),positions.getZ(j)), normals ? new THREE.Vector3(normals.getX(j),normals.getY(j),normals.getZ(j)) : new THREE.Vector3(), uv ? new THREE.Vector2(uv.getX(j),uv.getY(j)) : new THREE.Vector2());
    });
    const polygon = Polygon.create(vertices);
    if (polygon) result.push(polygon);
  }
  return result;
}

/** Both inputs must describe closed, consistently outward-wound solids. */
export function subtractSolid(input: THREE.BufferGeometry, cutter: THREE.BufferGeometry): THREE.BufferGeometry {
  return subtractSolids(input,[cutter]);
}

/** Retain the exact common volume, including proper closing surfaces. */
export function intersectSolid(input:THREE.BufferGeometry,bounds:THREE.BufferGeometry):THREE.BufferGeometry{
  const a=new Node(polygonsFromGeometry(input)),b=new Node(polygonsFromGeometry(bounds));
  a.invert();b.clipTo(a);b.invert();a.clipTo(b);b.clipTo(a);a.build(b.allPolygons());a.invert();
  return geometryFromPolygons(a.allPolygons());
}

/** Subtract a union without rebuilding a fragmented source BSP per bore. */
export function subtractSolids(input:THREE.BufferGeometry,cutters:THREE.BufferGeometry[]):THREE.BufferGeometry{
  const source=polygonsFromGeometry(input),inside=new Node(source.map(p=>new Polygon(p.vertices.map(v=>v.clone()),p.plane.clone())));
  inside.invert();
  const cutterPolygons=cutters.map(polygonsFromGeometry),trees=cutterPolygons.map(p=>new Node(p));
  let exterior=source;
  for(const tree of trees)exterior=tree.clipPolygons(exterior);
  const surfaces=[...exterior];
  for(let i=0;i<cutterPolygons.length;i++){
    let surface=cutterPolygons[i].map(p=>new Polygon(p.vertices.map(v=>v.clone()),p.plane.clone()));
    surface.forEach(p=>p.flip());
    surface=inside.clipPolygons(surface);
    for(let j=0;j<trees.length;j++)if(j!==i)surface=trees[j].clipPolygons(surface);
    surfaces.push(...surface);
  }
  return geometryFromPolygons(surfaces);
}

function geometryFromPolygons(surfaces:Polygon[]):THREE.BufferGeometry{
  const positions: number[] = [], normals: number[] = [], uvs: number[] = [];
  for (const polygon of surfaces) for (let i = 1; i < polygon.vertices.length - 1; i++) {
    const vertices = [polygon.vertices[0], polygon.vertices[i], polygon.vertices[i + 1]];
    const area = vertices[1].position.clone().sub(vertices[0].position).cross(vertices[2].position.clone().sub(vertices[0].position)).lengthSq();
    if (area < 1e-14) continue;
    for (const vertex of vertices) { positions.push(...vertex.position.toArray()); normals.push(...vertex.normal.toArray()); uvs.push(...vertex.uv.toArray()); }
  }
  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  result.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  result.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  result.computeBoundingBox(); result.computeBoundingSphere();
  return result;
}
