// Artifact-only classification. A missing optional favicon is not a page crash.
// No other HTTP failure, failed request, or console/page error is waived.
import {request} from 'playwright';
export const missingResource404='Failed to load resource: the server responded with a status of 404 (Not Found)';
export function isOptionalFavicon404(response,renderUrl){
  try{const u=new URL(response.url),origin=new URL(renderUrl);return u.origin===origin.origin&&u.pathname==='/favicon.ico'&&!u.search&&response.status===404&&response.method==='GET';}catch{return false;}
}
export function classifyNetwork(responses,requestFailures,consoleRecords,renderUrl){
  const failures=responses.filter(r=>r.status>=400);
  const optionalFavicon404=failures.filter(r=>isOptionalFavicon404(r,renderUrl));
  const unexplainedHttpFailures=failures.filter(r=>!isOptionalFavicon404(r,renderUrl));
  const available=[...optionalFavicon404],knownNoncriticalConsole=[],fatalConsoleErrors=[];
  for(const record of consoleRecords){
    if(record.text!==missingResource404){fatalConsoleErrors.push(record);continue;}
    // Attribute only the exact generic 404 message to an observed favicon
    // response, never to an unobserved resource or an unrelated URL.
    const index=available.findIndex(r=>r.project===record.project&&(!record.location?.url||r.url===record.location.url));
    if(index<0||unexplainedHttpFailures.length||requestFailures.length){fatalConsoleErrors.push(record);continue;}
    const response=available.splice(index,1)[0];knownNoncriticalConsole.push({...record,response,classification:'Observed optional favicon.ico GET 404; no application resource failure'});
  }
  return {valid:!unexplainedHttpFailures.length&&!requestFailures.length&&!fatalConsoleErrors.length,responses,requestFailures,optionalFavicon404,unexplainedHttpFailures,knownNoncriticalConsole,fatalConsoleErrors};
}
export async function probeImplicitFavicon(responses,consoleRecords,renderUrl){
  const complete=[...responses],confirmations=[];
  let context;
  try{
    for(const record of consoleRecords){
      const url=record.location?.url;
      if(record.text!==missingResource404||!url||!isOptionalFavicon404({url,status:404,method:'GET'},renderUrl))continue;
      if(complete.some(r=>r.url===url&&r.project===record.project&&r.method==='GET'))continue;
      context??=await request.newContext({ignoreHTTPSErrors:false});
      // Browser implicit favicon requests can escape page.response. Query only
      // the exact observed console URL; no redirects, substitution or mocking.
      const response=await context.get(url,{failOnStatusCode:false,maxRedirects:0,timeout:10000});
      const body=await response.body();
      const evidence={url:response.url(),status:response.status(),method:'GET',resourceType:'explicit-diagnostic-HTTP-probe',project:record.project,source:'Read-only Playwright API GET of exact console.location URL absent from page.response',headers:response.headers(),bodyBytes:body.length,consoleLocation:record.location,confirmedAt:new Date().toISOString()};
      if(evidence.url!==url)throw Error('Implicit favicon probe unexpectedly changed URL');
      complete.push(evidence);confirmations.push(evidence);
    }
  }finally{await context?.dispose();}
  return {responses:complete,confirmations};
}
