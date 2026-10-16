import {useEffect} from 'react'
import {useMap} from 'react-leaflet'

// Leaflet may calculate a zero/stale viewport if React initially mounts a map
// inside a hidden/just-resized region. ResizeObserver + a bounded deferred
// recalculation recover the tiles and markers without fetching anything on
// their own, without navigating, and without changing user tile consent.
export default function MapViewportSync({tilesEnabled=false}){
 const map=useMap()
 useEffect(()=>{
  let active=true
  const refresh=()=>{
   if(!active)return
   map.invalidateSize({animate:false,pan:false})
  }
  const frame=window.requestAnimationFrame(refresh)
  const afterLayout=window.setTimeout(refresh,140)
  const observer=typeof ResizeObserver==='function'
   ? new ResizeObserver(refresh) : null
  observer?.observe(map.getContainer())
  window.addEventListener('resize',refresh)
  return ()=>{
   active=false
   window.cancelAnimationFrame(frame)
   window.clearTimeout(afterLayout)
   observer?.disconnect()
   window.removeEventListener('resize',refresh)
  }
 },[map,tilesEnabled])
 return null
}
