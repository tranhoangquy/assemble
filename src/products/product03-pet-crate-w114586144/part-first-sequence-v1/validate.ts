import {writeFileSync} from 'node:fs';
import {sequenceAudit} from './checks';
const a=sequenceAudit();writeFileSync(new URL('../../../../output/product03-pet-crate-w114586144/part-first-sequence-v1/SEQUENCE-RAW-AUDIT.json',import.meta.url),JSON.stringify(a,null,2));
console.log(JSON.stringify(a.result.map(({rawCandidates,...rest})=>({...rest,rawCandidates})),null,2));
