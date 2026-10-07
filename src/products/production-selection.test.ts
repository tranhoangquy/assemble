import {it,expect} from 'vitest';
import {defaultProductId,resolveProductSelection,productionProductLabel} from './registry';
import {formatDuration} from '@/lib/format-duration';
import {renderProfiles,defaultRenderProfileId} from '@/engine/export/RenderProfiles';
it('defaults the project and invalid URLs to the current WF311613 candidate',()=>{expect(defaultProductId).toBe('wf311613-final-micro-pass');expect(resolveProductSelection()).toBe(defaultProductId);expect(resolveProductSelection('unknown')).toBe(defaultProductId);expect(resolveProductSelection('wf311613-step01-v2')).toBe('wf311613-step01-v2');expect(productionProductLabel(defaultProductId)).not.toMatch(/QA|debug/i);});
it('formats production durations without raw floating point seconds',()=>{expect(formatDuration(524.0536938888888)).toBe('08:44');expect(formatDuration(59.9)).toBe('01:00');expect(formatDuration(0)).toBe('00:00');});
it('preserves every legacy/native profile ID, native size and compatibility default',()=>{expect(defaultRenderProfileId).toBe('1920x1080');expect(renderProfiles.map(p=>[p.id,p.width,p.height])).toEqual([['1280x720',1280,720],['1920x1080',1920,1080],['720p',1280,720],['1080p',1920,1080],['1440p',2560,1440],['vertical-1080p',1080,1920],['2160p',3840,2160]]);});
