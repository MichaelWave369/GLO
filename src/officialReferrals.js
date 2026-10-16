// P1-Q: a pinned, reviewable *link* register, never an auto-fetching service directory.
// Original GLO implementation. Outbound navigation requires deliberate user click.
const REVIEWED_SOURCE_FIELDS=['id','name','url','topics','publisher','kind','verifiedProviderStatus','dataImport','reviewedOn']
export const OFFICIAL_REFERRAL_SOURCES=Object.freeze([
 Object.freeze({
  id:'united-way-211',name:'United Way 211',url:'https://www.211.org/',
  topics:Object.freeze(['housing','food','utilities','health','other']),
  publisher:'United Way Worldwide / 211 network',kind:'external-referral-only',
  verifiedProviderStatus:'unknown',dataImport:'none',reviewedOn:'2026-10-16'
 }),
 Object.freeze({
  id:'hud-find-shelter',name:'HUD Find Shelter',url:'https://www.hud.gov/FindShelter',
  topics:Object.freeze(['housing','food','health','other']),
  publisher:'U.S. Department of Housing and Urban Development',kind:'external-referral-only',
  verifiedProviderStatus:'unknown',dataImport:'none',reviewedOn:'2026-10-16'
 })
])
const allowedUrls=Object.freeze({
 'united-way-211':'https://www.211.org/',
 'hud-find-shelter':'https://www.hud.gov/FindShelter'
})
export const REFERRAL_TOPICS=Object.freeze(['all','housing','food','utilities','health','other'])
export function validatedOfficialReferrals(sources=OFFICIAL_REFERRAL_SOURCES){
 if(!Array.isArray(sources)||sources.length!==2)throw Error('Unreviewed source count.')
 const seen=new Set()
 return sources.map(source=>{
  if(!source||typeof source!=='object'||Array.isArray(source)||
   Object.keys(source).length!==REVIEWED_SOURCE_FIELDS.length||
   REVIEWED_SOURCE_FIELDS.some(k=>!Object.hasOwn(source,k)))
   throw Error('Unreviewed source metadata.')
  if(!Object.hasOwn(allowedUrls,source.id) || seen.has(source.id)||
   allowedUrls[source.id]!==source.url ||
   source.kind!=='external-referral-only'||
   source.verifiedProviderStatus!=='unknown'||source.dataImport!=='none'||
   !Array.isArray(source.topics)||!source.topics.length||
   source.topics.some(t=>!REFERRAL_TOPICS.includes(t)||t==='all')||
   typeof source.name!=='string'||source.name.length>75||
   typeof source.publisher!=='string'||source.publisher.length>120||
   !/^\d{4}-\d\d-\d\d$/.test(source.reviewedOn))
   throw Error('Unreviewed publisher scope, URL or service-status claim.')
  seen.add(source.id)
  return {
   id:source.id,name:source.name,publisher:source.publisher,url:source.url,
   topics:[...source.topics],kind:'external-referral-only',
   verifiedProviderStatus:'unknown',dataImport:'none',reviewedOn:source.reviewedOn
  }
 })
}
export function findOfficialReferrals(topic='all'){
 if(!REFERRAL_TOPICS.includes(topic))throw Error('Unknown referral category.')
 return validatedOfficialReferrals().filter(s=>topic==='all'||s.topics.includes(topic))
}
