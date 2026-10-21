// Copies the chiptune3 S3M player into public/vendor.
//
// chiptune3 loads its AudioWorklet and the libopenmpt WebAssembly build via relative
// URLs. Bundlers do not follow those, so the files are served as static files instead.

import { copyFileSync, mkdirSync } from 'node:fs';

const files = ['chiptune3.js', 'chiptune3.worklet.js', 'libopenmpt.worklet.js'];
const targetDir = 'public/vendor/chiptune3';

mkdirSync(targetDir, { recursive: true });
for (const file of files) {
    copyFileSync(`node_modules/chiptune3/${file}`, `${targetDir}/${file}`);
}
console.log(`chiptune3 copied to ${targetDir}`);
