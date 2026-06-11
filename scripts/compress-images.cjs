const webp = require('webp-converter')
const path = require('path')

webp.grant_permission()

const files = ['gym-login', 'gym-register', 'gym-onboarding']

async function run() {
  for (const name of files) {
    const src  = path.resolve(`public/images/${name}.jpg`)
    const dest = path.resolve(`public/images/${name}.webp`)
    try {
      await webp.cwebp(src, dest, '-q 75 -resize 1200 0')
      const size = require('fs').statSync(dest).size
      console.log(`✓ ${name}.webp  ${(size/1024).toFixed(0)} KB`)
    } catch (e) {
      console.error(`✗ ${name}:`, String(e))
    }
  }
}

run()
