// P1-S: independent local consistency check for a public observation and
// a non-authoritative review draft. A matched pair can be fabricated together.
// Nothing here grants reviewer identity, provider status, publish authority,
// transport authenticity, or permission to change public / private GLO records.
import {parsePublicCheckReceipt,validatePublicCheckReceipt} from './publicSourceReceipt.js'
import {parseReviewDraft} from './publicReviewGate.js'

export async function inspectPublicReviewPair(receiptJson,draftJson,now=Date.now()){
 const source=parsePublicCheckReceipt(receiptJson,now)
 return inspectReviewDraftAgainstReceipt(source,draftJson,now)
}

export async function inspectReviewDraftAgainstReceipt(receipt,draftJson,now=Date.now()){
 if(!Number.isFinite(now))throw Error('Invalid comparison time.')
 const source=validatePublicCheckReceipt(receipt,now)
 // Throws on malformed JSON, extra fields, forged authority, wrong source or
 // SHA-256 mismatch. Keep original filenames and untrusted JSON out of output.
 const matched=await parseReviewDraft(draftJson,source,now)
 return Object.freeze({
  comparison:'local-content-match-only',
  matched:true,sourceId:source.sourceId,
  checkedAt:source.checkedAt,reviewedAt:matched.reviewedAt,
  decision:matched.decision,receiptSha256:matched.checkSha256,
  sourceAuthenticity:'not-established',
  reviewerIdentity:'not-established',
  serviceStatus:'unknown',authority:'none',publication:'blocked'
 })
}
