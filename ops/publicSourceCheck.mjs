// Manually dispatched, narrowly scoped public *website* HEAD observation.
// Zero user-identifying inputs. No arbitrary URLs, redirects, response bodies,
// raw errors, source promotion, persistence to the live site, or credentials.
import {writeFile,mkdir} from 'node:fs/promises'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {
 PUBLIC_CHECK_SCHEMA,PUBLIC_CHECK_SOURCE,validatePublicCheckReceipt
} from '../src/publicSourceReceipt.js'

export async function checkPublicWebsite({
 fetchImpl=fetch,now=new Date(),timeoutMs=8000
}={}){
 if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw new Error('Invalid clock.')
 if(!Number.isInteger(timeoutMs)||timeoutMs<500||timeoutMs>15000)
  throw new Error('Timeout outside reviewed budget.')
 let result='request_error',httpStatus=null
 const controller=new AbortController()
 const timer=setTimeout(()=>controller.abort(),timeoutMs)
 try{
  const response=await fetchImpl(PUBLIC_CHECK_SOURCE.url,{
   method:'HEAD',redirect:'manual',signal:controller.signal,
   headers:{'User-Agent':'GLO-public-site-check/0.1 (+https://github.com/MichaelWave369/GLO)'}
  })
  if(Number.isInteger(response?.status)&&response.status>=200&&response.status<=599){
   httpStatus=response.status
   result=httpStatus<300?'responded':httpStatus<400?'redirect_unfollowed':'http_error'
  }
 }catch{
  // Deliberately do not serialize exception messages, headers, URLs or stack traces.
 }finally{clearTimeout(timer)}
 return validatePublicCheckReceipt({
  schema:PUBLIC_CHECK_SCHEMA,kind:'public-website-reachability-only',
  sourceId:PUBLIC_CHECK_SOURCE.id,sourceUrl:PUBLIC_CHECK_SOURCE.url,
  method:'HEAD',checkedAt:now.toISOString(),result,httpStatus,
  serviceStatus:'unknown',authority:'observation-not-authorization',
  publication:'not-approved'
 },now.getTime())
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const receipt=await checkPublicWebsite()
 await mkdir('out',{recursive:true})
 await writeFile('out/public-source-check.json',JSON.stringify(receipt,null,2)+'\n','utf8')
 console.log('A bounded public website observation receipt was written for human review.')
}
