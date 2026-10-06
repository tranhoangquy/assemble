// ONE ordered orchestration retry. No source/test/validator/config changes.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const ledgerPath=path.join(dir,'execution-order.json');
if(fs.existsSync(ledgerPath))throw new Error('This controlled retry has already been started');
const node=process.execPath,gate=path.join(dir,'run-approved-gate.mjs');
// Reporting arguments only: default test scheduling/assertions/timeouts/config
// are unchanged. JSON reporter records actual per-test durations from this run.
const commands=[
  ['1 frozen source/data identity',node,['--import','tsx',path.join(dir,'check-frozen-identity.mjs'),'before'],'identity.log'],
  ['2 native approved mechanical gates',node,['--import','tsx',gate,'mechanical'],'gates.log'],
  ['3 native final-micro-pass validation',node,['--import','tsx',gate,'micro'],'micro-native.log'],
  ['4 Polish 02B presentation checker',node,['--import','tsx',gate,'props'],'props.log'],
  ['5 typecheck','npm',['run','typecheck'],'typecheck.log'],
  ['6 application-source lint','npm',['run','lint','--','--ignore-pattern','output/**'],'lint.log'],
  ['7 complete test suite','npm',['run','test','--','--reporter=default','--reporter=json',`--outputFile.json=${path.join(dir,'tests-results.json')}`],'tests.log'],
  ['8 production build','npm',['run','build'],'build.log'],
  ['post-run byte/history identity',node,['--import','tsx',path.join(dir,'check-frozen-identity.mjs'),'after'],'identity-after.log'],
];
const report={candidate:'wf311613-final-micro-pass',retry:1,sequential:true,noRenderAuthorized:true,startedAt:new Date().toISOString(),commands:[]};
fs.writeFileSync(ledgerPath,JSON.stringify(report,null,2));
for(const [name,cmd,args,logName]of commands){
  const started=Date.now(),log=path.join(dir,logName),fd=fs.openSync(log,'wx');
  const row={name,command:[cmd,...args],log,startedAt:new Date(started).toISOString(),status:'RUNNING'};
  report.commands.push(row);fs.writeFileSync(ledgerPath,JSON.stringify(report,null,2));console.log('START',name);
  const result=await new Promise(resolve=>{
    const child=spawn(cmd,args,{cwd:process.cwd(),env:process.env,stdio:['ignore',fd,fd]});
    child.on('error',e=>resolve({code:null,signal:null,error:String(e)}));
    child.on('exit',(code,signal)=>resolve({code,signal}));
  });
  fs.closeSync(fd);Object.assign(row,result,{elapsedMs:Date.now()-started,endedAt:new Date().toISOString(),status:result.code===0?'PASS':'FAIL'});
  fs.writeFileSync(ledgerPath,JSON.stringify(report,null,2));console.log(row.status,name,row.elapsedMs+' ms');
  if(result.code!==0){report.valid=false;report.stoppedAt=name;report.endedAt=new Date().toISOString();fs.writeFileSync(ledgerPath,JSON.stringify(report,null,2));process.exitCode=1;break;}
}
if(report.valid!==false){report.valid=true;report.endedAt=new Date().toISOString();fs.writeFileSync(ledgerPath,JSON.stringify(report,null,2));console.log('COMPLETE: all sequential pre-render checks PASS; no rendering initiated');}
