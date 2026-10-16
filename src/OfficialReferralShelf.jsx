import {useState} from 'react'
import {findOfficialReferrals,REFERRAL_TOPICS} from './officialReferrals.js'
import './officialReferralShelf.css'

const COPY={
 en:{
 heading:'Official referral shelf',intro:'Reviewed public starting points, not a live resource directory. Open only when you choose. These links never send GLO notes, selected pins or coordinates as URL parameters.',
 type:'What kind of help?',topics:{all:'Any need',housing:'Shelter & housing',food:'Food',utilities:'Bills & utilities',health:'Health resources',other:'Other help'},
 description:{
  'united-way-211':'Community referral network for help with food, housing, utilities, health and other needs. You can call 211 where available or search their website.',
  'hud-find-shelter':'U.S. government search for shelter, food pantries, clinics and other services. Search happens on HUD’s website only after you choose to visit it.'
 },
 publisher:'Publisher',checked:'Link reviewed',visit:'Open external referral website',call:'Call 211',
 callNote:'Calling 211 uses your phone service, may not be available everywhere and is not an emergency call.',
 consent:'External sites have their own privacy and accessibility policies. They may ask for location or other details. GLO does not pass your location automatically.',
 offline:'Your browser reports offline. This list remains visible, but opening websites usually requires connectivity; a phone call requires cellular/phone service.',
 status:'No service-status verification. A website listing does not prove availability, safety, accessibility or legal access. Contact providers directly.',
 licensed:'Links only. GLO does not copy 211 or HUD directory data or use a private developer API.',
 noMatch:'No matching reviewed referral websites are listed.',
 contact:'For immediate emergencies use local emergency services, not this referral shelf.'
 },
 es:{
 heading:'Fuentes oficiales de referencia',intro:'Puntos de partida públicos revisados, NO un directorio de servicios en vivo. Se abren solo al elegirlos. GLO no adjunta notas, puntos ni coordenadas a los enlaces.',
 type:'¿Qué tipo de ayuda?',topics:{all:'Cualquier necesidad',housing:'Refugio y vivienda',food:'Comida',utilities:'Cuentas y servicios',health:'Recursos de salud',other:'Otras ayudas'},
 description:{
  'united-way-211':'Red comunitaria de ayuda para vivienda, comida, pagos, salud y otras necesidades. Puedes llamar al 211 donde esté disponible o visitar su sitio.',
  'hud-find-shelter':'Buscador gubernamental de refugios, bancos de alimentos, clínicas y otros servicios. Solo busca en HUD cuando decidas abrir su sitio.'
 },
 publisher:'Fuente',checked:'Enlace revisado',visit:'Abrir sitio externo',call:'Llamar al 211',
 callNote:'La llamada usa tu servicio telefónico; quizá no funcione en todas las zonas y no es una llamada de emergencia.',
 consent:'Los sitios externos tienen sus propias reglas de privacidad y accesibilidad. Pueden pedir tu ubicación u otros datos. GLO no envía tu ubicación automáticamente.',
 offline:'El navegador indica que no hay conexión. La lista sigue visible, pero los sitios suelen requerir internet; las llamadas requieren servicio telefónico.',
 status:'NINGÚN servicio está verificado. Un listado web no demuestra disponibilidad, seguridad, accesibilidad ni permiso de entrada. Contacta a los responsables.',
 licensed:'Solo enlaces. GLO no copia directorios de 211 o HUD ni usa una API privada.',
 noMatch:'No hay enlaces revisados para este tipo de ayuda.',
 contact:'Para emergencias inmediatas contacta a los servicios locales de emergencia.'
 }
}
export default function OfficialReferralShelf({language='en',onlineHint=true}){
 const t=COPY[language]||COPY.en
 const [topic,setTopic]=useState('all')
 const sources=findOfficialReferrals(topic)
 return <details className="referral-shelf">
  <summary>{t.heading}</summary>
  <div className="referral-body">
   <p>{t.intro}</p>
   <label>{t.type}<select value={topic} onChange={e=>setTopic(e.target.value)}>
    {REFERRAL_TOPICS.map(value=><option value={value} key={value}>{t.topics[value]}</option>)}
   </select></label>
   {!onlineHint&&<p className="referral-warn" role="status">{t.offline}</p>}
   <div className="referral-items">
    {sources.map(s=><article key={s.id} className="referral-item">
      <strong>{s.name}</strong>
      <small>{t.publisher}: {s.publisher} · {t.checked}: {s.reviewedOn}</small>
      <p>{t.description[s.id]}</p>
      <a href={s.url} target="_blank" rel="noopener noreferrer">{t.visit}</a>
      {s.id==='united-way-211'&&<><a href="tel:211">{t.call}</a><small>{t.callNote}</small></>}
    </article>)}
    {!sources.length&&<p>{t.noMatch}</p>}
   </div>
   <p className="referral-warn">{t.consent}</p>
   <p className="referral-warn">{t.status}</p>
   <p>{t.licensed}</p>
   <p>{t.contact}</p>
  </div>
 </details>
}
