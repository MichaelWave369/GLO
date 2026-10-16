// Independent reviewer-side schema validation; never creates publication approval.
import {readFile} from 'node:fs/promises'
import {parsePublicCheckReceipt} from '../src/publicSourceReceipt.js'
const path=process.argv[2]
if(!path||process.argv.length!==3)throw new Error('Provide exactly one receipt file path.')
const bytes=await readFile(path)
parsePublicCheckReceipt(bytes.toString('utf8'))
console.log('Public-only source receipt validated; publication remains NOT approved.')
