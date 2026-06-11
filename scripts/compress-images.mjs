import webp from 'webp-converter'
import { resolve } from 'path'

webp.grant_permission()

const files = ['gym-login', 'gym-register', 'gym-onboarding']

for (const name of files) {
  const src  = resolve(`public/images/${name}.jpg`)
  const dest = resolve(`public/images/${name}.webp`)
  try {
    const result = await webp.cwebp(src, dest, '-q 75 -resize 1200 0')
    console.log(`✓ ${name}.webp`)
  } catch (e) {
    console.error(`✗ ${name}:`, e)
  }
}
