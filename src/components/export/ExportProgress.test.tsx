import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ExportProgress } from './ExportProgress';
import { ExportVideoModal } from './ExportVideoModal';
import { getProductPackage } from '@/products/registry';
import type { ExportJobView, ExportJobStatus } from '@/types/export';
import type { AssemblyValidationResult } from '@/engine/assembly/AssemblyValidator';
const view={id:'job',productId:'example',productName:'Example',status:'rendering',progress:38,totalFrames:1500,validFrames:640,currentFrame:640,totalChunks:5,completedChunks:2,currentChunk:{index:2,start:600,end:899,status:'rendering',validFrames:40,retries:0},elapsedSeconds:123,canCancel:true,message:'Rendering work chunk 3 of 5…'} as ExportJobView;
const render=(job:ExportJobView)=>renderToStaticMarkup(<ExportProgress job={job} onResume={()=>{}} onCancel={()=>{}} onDelete={()=>{}}/>);
describe('Generate File user-facing status',()=>{
  it('shows derived ready summary and preserves legacy/native/FPS choices',()=>{
    const product=getProductPackage('demo-cabinet');
    const validation={valid:true,errors:[]} as unknown as AssemblyValidationResult;
    const html=renderToStaticMarkup(<ExportVideoModal open product={product} validation={validation} onClose={()=>{}}/>);
    expect(html).toContain('Ready to generate');expect(html).toContain('Generate File');expect(html).toContain(Math.ceil(product.video.scenes.reduce((sum,s)=>sum+s.duration,0)*30).toLocaleString());
    for(const profile of ['1280x720','1920x1080','720p','1080p','1440p','2160p'])expect(html).toContain(`data-profile-id="${profile}"`);
    expect(html).toContain('60 FPS');
  });
  it('renders backend frame/chunk/range/elapsed values and keeps overall progress below completion',()=>{
    const html=render(view);for(const text of ['640','1,500','600','899','40','300','02:03','38% overall','Cancel generation'])expect(html).toContain(text);
    expect(html).not.toContain('Delete render');expect(html).not.toContain('Resume generation');
  });
  it.each(['preparing','validating_frames','encoding','muxing_audio','verifying','completed','interrupted','waiting_for_resume','error','cancelled','stale'] as ExportJobStatus[])('distinguishes %s and exposes only backend-authorized actions',status=>{
    const paused=['interrupted','waiting_for_resume','error','cancelled'].includes(status);
    const html=render({...view,status,canResume:paused,canCancel:false,canDelete:true,progress:status==='completed'?100:85});
    expect(html).toContain('Delete render');expect(html.includes('Resume generation')).toBe(paused);expect(html).not.toContain('Cancel generation');
    if(['encoding','muxing_audio','verifying'].includes(status))expect(html).toContain('exact percentage is not measured');
  });
  it('keeps structured diagnostics behind details and shows a friendly interruption',()=>{
    const html=render({...view,status:'waiting_for_resume',canResume:true,canCancel:false,errorCode:'FRAME_TIMEOUT',error:'renderer frame timed out'});
    expect(html).toContain('<details>');expect(html).toContain('Your validated work is preserved');expect(html).toContain('FRAME_TIMEOUT');
  });
});
