import '../phase-d-illustrative-v2/preview';
import {steps} from '../phase-d-illustrative-v2/timeline';
// Reuse the actual historical camera implementation, without editing its source.
const api=window.__MECHANISM_AUDIT_RENDERER__!;
for(const s of steps.slice(1))for(const [suffix,delta]of [['before',-.0001],['after',.0001]] as const)
 api.checkpoints.push({name:`boundary-${s.id}-${suffix}.png`,label:'Historical camera boundary audit',time:s.start+delta});
