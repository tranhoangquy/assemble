import {it,expect} from 'vitest';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ControlPanel} from './ControlPanel';
import {ScenePanel} from './ScenePanel';
const controls={disabled:false,quickActions:[],onQuickAction:()=>{},onReset:()=>{},onResetCamera:()=>{},onExport:()=>{},onReviewState:()=>{},autoPause:false,onAutoPauseChange:()=>{}};
it('hides QA-only review controls unless debug is explicitly enabled',()=>{expect(renderToStaticMarkup(<ControlPanel {...controls}/>)).not.toContain('Product review states');expect(renderToStaticMarkup(<ControlPanel {...controls} debugMode/>)).toContain('Product review states');});
it('formats sequence durations and ranges as readable timecodes',()=>{const html=renderToStaticMarkup(<ScenePanel scenes={[{id:'a',index:0,start:460.7036938888889,end:477.1536938888889,duration:16.450000000000003,title:'Secure Cabinet to Wall',actions:[]}]} activeId="a" onSelect={()=>{}}/>);expect(html).toContain('07:41');expect(html).toContain('07:57');expect(html).toContain('00:16');expect(html).not.toContain('16.4500');});
