// Offline-first, user-reviewed handoff for optional outside research.
// This is a single copyable question, never an agent credential, live feed, or proof of safety.
import { CATEGORIES, validCoordinates } from './domain.js'

export const RESEARCH_SCOPES=Object.freeze(['area','exact'])
export const MAX_RESEARCH_NOTES=12
const round=(v,d)=>Number(v.toFixed(d))
const clean=(s,max)=>typeof s==='string' && s.trim().length>0 && s.trim().length<=max &&
  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s)
const safeId=s=>typeof s==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(s)

export function makeResearchPacket({point,scope='area',category='',question}) {
  if(!RESEARCH_SCOPES.includes(scope))throw new Error('Choose an area or exact-point scope.')
  if(!point||!validCoordinates(point.lat,point.lon))throw new Error('Select a valid location explicitly.')
  if(!clean(question,300))throw new Error('Enter a research question (1–300 characters).')
  if(category!==''&&!Object.hasOwn(CATEGORIES,category))throw new Error('Invalid resource category.')
  const decimals=scope==='area'?2:6
  return {
    format:'glo-manual-research-handoff',schemaVersion:1,
    location:{scope:scope==='area'?'approximate-area':'exact-point',
      lat:round(point.lat,decimals),lon:round(point.lon,decimals)},
    ...(category?{category}:{}),
    question:question.trim()
  }
}

// No private note, title, pin ID, recorded position history, or source-linked account ID is serialized.
// Clipboard copy is only done by a direct user action outside this pure function.
export function researchMessage(packet) {
  if(!packet||packet.format!=='glo-manual-research-handoff')throw new Error('Invalid handoff.')
  return [
    'GLO Pin | manually shared, single-question research request',
    'This message was copied deliberately by a person; it does NOT grant app access or permission to track them.',
    'Location precision: '+(packet.location.scope==='exact-point'?'EXACT point (sensitive)':'APPROXIMATE area (not an entrance or verified position)'),
    'Research context JSON:',
    JSON.stringify(packet,null,2),
    'Please distinguish source-backed records from assumptions. Cite source links, dates and uncertainty.',
    'Do not assert a resource is open, safe, accessible, legal to enter or operational from map/ownership data alone.',
    'Your answer will be treated as UNVERIFIED research until the person reviews it.'
  ].join('\n\n')
}

export function createResearchAnnotation({pinId,title,details,sourceUrl=''},now=new Date(),makeId=()=>crypto.randomUUID()){
  const candidate={
    id:makeId(),pinId,title:String(title??'').trim(),details:String(details??'').trim(),
    sourceUrl:String(sourceUrl??'').trim(),recordedAt:now.toISOString(),
    provenance:'manually-copied-research',condition:'not-verified',visibility:'device-only'
  }
  return validateResearchAnnotation(candidate)
}
export function validateResearchAnnotation(value){
  const keys=['id','pinId','title','details','sourceUrl','recordedAt','provenance','condition','visibility']
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||
    Object.keys(value).some(k=>!keys.includes(k))||
    !safeId(value.id)||!safeId(value.pinId)||!clean(value.title,80)||!clean(value.details,900)||
    typeof value.sourceUrl!=='string'||value.sourceUrl.length>300||
    typeof value.recordedAt!=='string'||!Number.isFinite(Date.parse(value.recordedAt))||
    Date.parse(value.recordedAt)>Date.now()+300000||
    value.provenance!=='manually-copied-research'||value.condition!=='not-verified'||
    value.visibility!=='device-only')throw new Error('Invalid or untrusted research annotation.')
  if(value.sourceUrl){
    let url
    try{url=new URL(value.sourceUrl)}catch{throw new Error('Source link must be a valid HTTPS URL.')}
    if(url.protocol!=='https:'||!url.hostname||url.username||url.password)throw new Error('Source link must be a plain HTTPS URL.')
  }
  return {...value}
}
