// P1-R: human-initiated, LOCAL review-draft gate for a public website observation.
// A digest binds this draft to source bytes as projected by the P1-P validator.
// A SHA-256 hash is not a signature, proof of authorship, source authentication,
// publication approval, provider status, or evidence of a person reviewing it.
import {validatePublicCheckReceipt} from './publicSourceReceipt.js'

export const REVIEW_SCHEMA='glo.public-observation-review-draft.v1'
export const REVIEW_DECISIONS=Object.freeze([
 'retain-observation-only','request-new-check','discard-observation'
])
export const REVIEW_MAX_BYTES=1536
const KEYS=['schema','kind','sourceId','checkSha256','checkedAt','reviewedAt',
 'decision','scope','serviceStatus','authority','publication']

function exactShape(item){
 return item!==null && typeof item==='object' && !Array.isArray(item) &&
   Object.getPrototypeOf(item)===Object.prototype &&
   Object.keys(item).length===KEYS.length && KEYS.every(key=>Object.hasOwn(item,key))
}
function timestamp(value,now){
 return typeof value==='string' &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
  Number.isFinite(Date.parse(value))&&
  Date.parse(value)<=now+300000
}
async function checkFingerprint(checked){
 if(!globalThis.crypto?.subtle?.digest)throw Error('Secure digest unavailable on this device.')
 const bytes=new TextEncoder().encode(JSON.stringify(checked))
 const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes)
 return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('')
}
export async function digestPublicCheckReceipt(receipt,now=Date.now()){
 const checked=validatePublicCheckReceipt(receipt,now)
 return checkFingerprint(checked)
}
export async function validateReviewDraft(draft,originalReceipt,now=Date.now()){
 if(!Number.isFinite(now)||!exactShape(draft))
  throw Error('Review draft must contain exactly the approved fields.')
 const checked=validatePublicCheckReceipt(originalReceipt,now)
 if(draft.schema!==REVIEW_SCHEMA||
  draft.kind!=='human-initiated-review-draft-only'||
  draft.sourceId!==checked.sourceId||
  draft.scope!=='public-website-observation-only'||
  draft.serviceStatus!=='unknown'||
  draft.authority!=='none'||
  draft.publication!=='blocked'||
  !REVIEW_DECISIONS.includes(draft.decision)||
  draft.checkedAt!==checked.checkedAt||
  !timestamp(draft.reviewedAt,now)||
  Date.parse(draft.reviewedAt)<Date.parse(checked.checkedAt)||
  typeof draft.checkSha256!=='string'||
  !/^[0-9a-f]{64}$/.test(draft.checkSha256))
  throw Error('Review cannot authorize publication, claim service status, or predate the source.')
 const expected=await checkFingerprint(checked)
 if(draft.checkSha256!==expected)
  throw Error('Observation receipt and review draft do not match.')
 return {
  schema:REVIEW_SCHEMA,kind:'human-initiated-review-draft-only',
  sourceId:checked.sourceId,checkSha256:expected,
  checkedAt:checked.checkedAt,reviewedAt:draft.reviewedAt,decision:draft.decision,
  scope:'public-website-observation-only',serviceStatus:'unknown',
  authority:'none',publication:'blocked'
 }
}
export async function makeReviewDraft(receipt,{decision,acknowledged=false,now=new Date()}={}){
 if(acknowledged!==true)throw Error('Explicit acknowledgment is required.')
 if(!REVIEW_DECISIONS.includes(decision))throw Error('Unsupported review decision.')
 if(!(now instanceof Date)||!Number.isFinite(now.getTime()))
  throw Error('Review date is invalid.')
 const checked=validatePublicCheckReceipt(receipt,now.getTime())
 const draft={
  schema:REVIEW_SCHEMA,kind:'human-initiated-review-draft-only',
  sourceId:checked.sourceId,checkSha256:await checkFingerprint(checked),
  checkedAt:checked.checkedAt,reviewedAt:now.toISOString(),
  decision,scope:'public-website-observation-only',serviceStatus:'unknown',
  authority:'none',publication:'blocked'
 }
 return validateReviewDraft(draft,checked,now.getTime())
}
export async function parseReviewDraft(json,receipt,now=Date.now()){
 if(typeof json!=='string'||new TextEncoder().encode(json).length>REVIEW_MAX_BYTES)
  throw Error('Review draft exceeds 1.5KB.')
 let item
 try{item=JSON.parse(json)}catch{throw Error('Invalid review JSON.')}
 return validateReviewDraft(item,receipt,now)
}
