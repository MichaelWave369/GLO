import { validCoordinates } from './domain.js'

// Small ODbL road/path extract. NOT routing, road safety, or a standard OSM tile download.
export const STREET_ENDPOINT='https://overpass-api.de/api/interpreter'
export const STREET_FORMAT='glo-osm-street-sketch'
export const STREET_RADIUS=1100
export const STREET_MAX_BYTES=700000
const HIGHWAYS=new Set(['motorway','trunk','primary','secondary','tertiary','residential','unclassified','living_street','service','pedestrian','footway','path','cycleway','steps'])
const WATER=new Set(['river','stream','canal'])
const rounded=n=>Number(n.toFixed(3))
const bytes=x=>new TextEncoder().encode(JSON.stringify(x)).length

export function streetCenter(center){
  if(!validCoordinates(center?.lat,center?.lon)) throw new Error('Select a valid map center.')
  return {lat:rounded(center.lat),lon:rounded(center.lon)}
}
export function buildStreetQuery(center){
  const c=streetCenter(center),around='(around:'+STREET_RADIUS+','+c.lat.toFixed(3)+','+c.lon.toFixed(3)+')'
  return '[out:json][timeout:20];('+
    'way'+around+'["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|service|pedestrian|footway|path|cycleway|steps)$"];'+
    'way'+around+'["waterway"~"^(river|stream|canal)$"];'+
    ');out geom 500;'
}
function safeWay(el,c){
  if(el?.type!=='way'||!Number.isSafeInteger(el.id)||el.id<=0)return null
  const kind=HIGHWAYS.has(el.tags?.highway)?'road':WATER.has(el.tags?.waterway)?'water':null
  const tag=kind==='road'?el.tags.highway:el.tags?.waterway
  if(!kind||!Array.isArray(el.geometry)||el.geometry.length<2||el.geometry.length>280)return null
  const coordinates=[]
  for(const point of el.geometry){
    if(!validCoordinates(point?.lat,point?.lon)||Math.abs(point.lat-c.lat)>.035||Math.abs(point.lon-c.lon)>.05)return null
    coordinates.push([Number(point.lat.toFixed(6)),Number(point.lon.toFixed(6))])
  }
  return {id:'way/'+el.id,kind,tag,name:typeof el.tags.name==='string'?el.tags.name.replace(/[<>\u0000-\u001f]/g,' ').slice(0,70):'',coordinates}
}
export function createStreetSketch(elements,center,now=new Date()){
  const c=streetCenter(center)
  if(!Array.isArray(elements)||!Number.isFinite(now.getTime()))throw new Error('Invalid public street response.')
  let vertices=0
  const records=[],ids=new Set()
  for(const el of elements.slice(0,500)){
    const line=safeWay(el,c)
    if(!line||ids.has(line.id))continue
    if(vertices+line.coordinates.length>8000)break
    ids.add(line.id);vertices+=line.coordinates.length;records.push(line)
  }
  if(!records.length)throw new Error('No usable roads or paths were returned for this neighborhood.')
  return validateStreetSketch({
    format:STREET_FORMAT,version:1,id:'street:'+c.lat.toFixed(3)+':'+c.lon.toFixed(3),
    center:c,radiusMeters:STREET_RADIUS,savedAt:now.toISOString(),
    source:'OpenStreetMap via Overpass',license:'ODbL-1.0',
    incomplete:elements.length>=500||vertices>=8000,records
  },now)
}
export function validateStreetSketch(x,now=new Date()){
  const keys=['format','version','id','center','radiusMeters','savedAt','source','license','incomplete','records']
  if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).some(k=>!keys.includes(k))||
    x.format!==STREET_FORMAT||x.version!==1||!validCoordinates(x.center?.lat,x.center?.lon)||
    x.center.lat!==rounded(x.center.lat)||x.center.lon!==rounded(x.center.lon)||
    x.id!=='street:'+x.center.lat.toFixed(3)+':'+x.center.lon.toFixed(3)||
    x.radiusMeters!==STREET_RADIUS||x.source!=='OpenStreetMap via Overpass'||x.license!=='ODbL-1.0'||
    typeof x.incomplete!=='boolean'||typeof x.savedAt!=='string'||
    !Number.isFinite(Date.parse(x.savedAt))||Date.parse(x.savedAt)>now.getTime()+300000||
    !Array.isArray(x.records)||x.records.length===0||x.records.length>500)throw new Error('Invalid street sketch manifest.')
  let vertices=0;const seen=new Set()
  for(const line of x.records){
    if(!line||typeof line!=='object'||Object.keys(line).some(k=>!['id','kind','tag','name','coordinates'].includes(k))||
      !/^way\/[1-9]\d*$/.test(line.id)||seen.has(line.id)||
      (line.kind==='road'?!HIGHWAYS.has(line.tag):line.kind==='water'?!WATER.has(line.tag):true)||
      typeof line.name!=='string'||line.name.length>70||/[<>\u0000-\u001f]/.test(line.name)||
      !Array.isArray(line.coordinates)||line.coordinates.length<2||line.coordinates.length>280)throw new Error('Invalid street geometry.')
    seen.add(line.id);vertices+=line.coordinates.length
    if(vertices>8000)throw new Error('Street pack has too many coordinates.')
    for(const p of line.coordinates)if(!Array.isArray(p)||p.length!==2||!validCoordinates(p[0],p[1])||
      Math.abs(p[0]-x.center.lat)>.035||Math.abs(p[1]-x.center.lon)>.05)throw new Error('Street geometry exceeds the selected neighborhood.')
  }
  if(bytes(x)>STREET_MAX_BYTES)throw new Error('Street sketch too large for the offline budget.')
  return x
}
export async function fetchStreetSketch(center,signal){
  const local=new AbortController()
  const abort=()=>local.abort()
  signal?.addEventListener('abort',abort,{once:true})
  const timer=setTimeout(()=>local.abort(),23000)
  try{
    const res=await fetch(STREET_ENDPOINT,{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
      body:'data='+encodeURIComponent(buildStreetQuery(center)),signal:local.signal
    })
    if(!res.ok)throw new Error('Public street service unavailable (HTTP '+res.status+').')
    const raw=await res.text()
    if(raw.length>1800000)throw new Error('Street response exceeds data budget.')
    return createStreetSketch(JSON.parse(raw).elements,center)
  }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
}
