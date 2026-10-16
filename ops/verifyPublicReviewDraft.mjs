// Independent offline draft/observation verifier.
// Neither artifact is a signature or permission to publish.
import {readFile} from 'node:fs/promises'
import {parsePublicCheckReceipt} from '../src/publicSourceReceipt.js'
import {parseReviewDraft} from '../src/publicReviewGate.js'
if(process.argv.length!==4)throw Error('Usage: node ops/verifyPublicReviewDraft.mjs source-check.json review-draft.json')
const [sourceBytes,draftBytes]=await Promise.all([
 readFile(process.argv[2]),readFile(process.argv[3])
])
const source=parsePublicCheckReceipt(sourceBytes.toString('utf8'))
const validated=await parseReviewDraft(draftBytes.toString('utf8'),source)
if(validated.publication!=='blocked')throw Error('Review is not gated.')
console.log('Public-only review draft matches source. Publication BLOCKED, service status UNKNOWN.')
