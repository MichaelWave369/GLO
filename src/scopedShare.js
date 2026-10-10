// FamilyVault-inspired least disclosure for account-free peer handoffs.
// These are public bearer links after sharing: there is NO authentication or revocation.
import { CATEGORIES, validCoordinates } from './domain.js'

export const SHARE_SCOPES = Object.freeze(['area','exact'])
const FIELDS=['version','type','scope','nameShared','category','title','lat','lon']
const near=(n,precision)=>Number(n.toFixed(precision))
function cleanTitle(value) {
  return String(value||'').replace(/[<>\u0000-\u001f\u007f]/g,' ').trim().slice(0,90)
}
function categoryLabel(category) {
  if(!Object.hasOwn(CATEGORIES,category))throw new Error('Unsupported public resource category.')
  return CATEGORIES[category].label
}
export function makeScopedSharedPin(pin,{scope='area',includeName=false}={}) {
  if(!SHARE_SCOPES.includes(scope))throw new Error('Unsupported location sharing scope.')
  const fallback=categoryLabel(pin?.category)
  if(!validCoordinates(pin?.lat,pin?.lon))throw new Error('Invalid coordinates for sharing.')
  const name=includeName?cleanTitle(pin.title):''
  return {
    version:2,type:'glo-shared-location',scope,nameShared:Boolean(name),
    category:pin.category,title:name||fallback,
    lat:near(pin.lat,scope==='area'?2:6),
    lon:near(pin.lon,scope==='area'?2:6)
  }
}
export function scopedShareUrl(pin,baseUrl,options={}) {
  const url=new URL(baseUrl)
  // URL fragment is client-side only, but browsers, copies and recipients can retain it.
  url.hash='pin='+encodeURIComponent(JSON.stringify(makeScopedSharedPin(pin,options)))
  return url.toString()
}
export function parseScopedSharedPin(item) {
  if(!item||typeof item!=='object'||Array.isArray(item)||
    Object.keys(item).length!==FIELDS.length||Object.keys(item).some(key=>!FIELDS.includes(key))||
    item.version!==2||item.type!=='glo-shared-location'||!SHARE_SCOPES.includes(item.scope)||
    typeof item.nameShared!=='boolean'||!Object.hasOwn(CATEGORIES,item.category)||
    !validCoordinates(item.lat,item.lon)||typeof item.title!=='string'||
    !item.title.trim()||item.title.length>90||/[<>\u0000-\u001f\u007f]/.test(item.title))return null
  if(!item.nameShared&&item.title!==categoryLabel(item.category))return null
  if(item.scope==='area'&&(item.lat!==near(item.lat,2)||item.lon!==near(item.lon,2)))return null
  return {...item,id:'shared-preview',provenance:'peer-shared',condition:'not-verified'}
}
