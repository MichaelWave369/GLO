// Review-only public organization WEBSITE response receipt, not a resource status.
// Fixed public allowlist; no user input becomes a worker URL, GPS lookup or publish action.
export const PUBLIC_CHECK_SCHEMA='glo.public-website-check.v1'
export const PUBLIC_CHECK_SOURCE=Object.freeze({
 id:'united-way-211',
 label:'United Way 211 (national referral website)',
 url:'https://www.211.org/'
})
export const PUBLIC_CHECK_MAX_BYTES=2048
const KEYS=Object.freeze(['schema','kind','sourceId','sourceUrl','method','checkedAt',
 'result','httpStatus','serviceStatus','authority','publication'])
const RESULT_STATES=['responded','redirect_unfollowed','http_error','request_error']

function plainObject(obj){
 return obj!==null&&typeof obj==='object'&&!Array.isArray(obj)&&
  Object.getPrototypeOf(obj)===Object.prototype
}
function exactKeys(obj,keys){
 return plainObject(obj)&&Object.keys(obj).length===keys.length&&
  keys.every(key=>Object.hasOwn(obj,key))
}
export function validatePublicCheckReceipt(receipt,now=Date.now()){
 if(!exactKeys(receipt,KEYS))throw new Error('Receipt must contain only public allowlisted fields.')
 if(receipt.schema!==PUBLIC_CHECK_SCHEMA||
  receipt.kind!=='public-website-reachability-only'||
  receipt.sourceId!==PUBLIC_CHECK_SOURCE.id||
  receipt.sourceUrl!==PUBLIC_CHECK_SOURCE.url||
  receipt.method!=='HEAD'||
  receipt.serviceStatus!=='unknown'||
  receipt.authority!=='observation-not-authorization'||
  receipt.publication!=='not-approved'||
  !RESULT_STATES.includes(receipt.result))
  throw new Error('Source, scope, or authorization fields are invalid.')
 const time=typeof receipt.checkedAt==='string'?Date.parse(receipt.checkedAt):NaN
 if(!Number.isFinite(time)||receipt.checkedAt.length>35||
  !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(receipt.checkedAt)||
  time>now+300000)
  throw new Error('Invalid receipt observation timestamp.')
 if(receipt.result==='request_error'){
  if(receipt.httpStatus!==null)throw new Error('Network error must not claim an HTTP response.')
 }else{
  if(!Number.isInteger(receipt.httpStatus)||receipt.httpStatus<200||receipt.httpStatus>599)
   throw new Error('Invalid HTTP response status.')
  const status=receipt.httpStatus
  const expected=status<300?'responded':status<400?'redirect_unfollowed':'http_error'
  if(receipt.result!==expected)throw new Error('HTTP response and receipt result disagree.')
 }
 // Explicit projection ensures no untrusted object references or extra sensitive data.
 return {
  schema:PUBLIC_CHECK_SCHEMA,kind:'public-website-reachability-only',
  sourceId:PUBLIC_CHECK_SOURCE.id,sourceUrl:PUBLIC_CHECK_SOURCE.url,
  method:'HEAD',checkedAt:receipt.checkedAt,result:receipt.result,
  httpStatus:receipt.httpStatus,serviceStatus:'unknown',
  authority:'observation-not-authorization',publication:'not-approved'
 }
}
export function parsePublicCheckReceipt(json,now=Date.now()){
 if(typeof json!=='string'||new TextEncoder().encode(json).length>PUBLIC_CHECK_MAX_BYTES)
  throw new Error('Not a small public source check receipt.')
 let obj
 try{obj=JSON.parse(json)}catch{throw new Error('Not valid JSON.')}
 return validatePublicCheckReceipt(obj,now)
}
export function receiptIsStale(receipt,now=Date.now()){
 return now-Date.parse(receipt.checkedAt)>24*60*60*1000
}
