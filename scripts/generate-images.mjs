import { Resvg } from '@resvg/resvg-js'
import { writeFileSync, mkdirSync } from 'fs'

mkdirSync('public/images', { recursive: true })

const gymLoginSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A1A18"/>
      <stop offset="55%" stop-color="#0F2820"/>
      <stop offset="100%" stop-color="#0A1510"/>
    </linearGradient>
    <radialGradient id="glow" cx="40%" cy="45%" r="55%">
      <stop offset="0%" stop-color="rgba(20,184,166,0.14)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <rect width="1200" height="800" fill="url(#glow)"/>
  <rect x="0" y="266" width="1200" height="1" fill="rgba(20,184,166,0.04)"/>
  <rect x="0" y="533" width="1200" height="1" fill="rgba(20,184,166,0.04)"/>
  <rect x="300" y="0" width="1" height="800" fill="rgba(20,184,166,0.05)"/>
  <rect x="600" y="0" width="1" height="800" fill="rgba(20,184,166,0.07)"/>
  <rect x="900" y="0" width="1" height="800" fill="rgba(20,184,166,0.05)"/>
</svg>`

const gymRegisterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
  <defs>
    <linearGradient id="bg" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0A1018"/>
      <stop offset="55%" stop-color="#0F2028"/>
      <stop offset="100%" stop-color="#0A1015"/>
    </linearGradient>
    <radialGradient id="glow" cx="60%" cy="40%" r="50%">
      <stop offset="0%" stop-color="rgba(20,184,166,0.12)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <rect width="1200" height="800" fill="url(#glow)"/>
  <rect x="0" y="200" width="1200" height="1" fill="rgba(20,184,166,0.04)"/>
  <rect x="0" y="600" width="1200" height="1" fill="rgba(20,184,166,0.04)"/>
  <rect x="400" y="0" width="1" height="800" fill="rgba(20,184,166,0.06)"/>
  <rect x="800" y="0" width="1" height="800" fill="rgba(20,184,166,0.06)"/>
</svg>`

const gymOnboardingSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0F2820"/>
      <stop offset="100%" stop-color="#0A0F0A"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="25%" r="60%">
      <stop offset="0%" stop-color="rgba(20,184,166,0.18)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>
  <rect width="800" height="500" fill="url(#bg)"/>
  <rect width="800" height="500" fill="url(#glow)"/>
  <rect x="200" y="0" width="1" height="500" fill="rgba(20,184,166,0.05)"/>
  <rect x="400" y="0" width="1" height="500" fill="rgba(20,184,166,0.08)"/>
  <rect x="600" y="0" width="1" height="500" fill="rgba(20,184,166,0.05)"/>
  <rect x="0" y="167" width="800" height="1" fill="rgba(20,184,166,0.04)"/>
  <rect x="0" y="333" width="800" height="1" fill="rgba(20,184,166,0.04)"/>
</svg>`

const images = [
  { svg: gymLoginSvg,      out: 'public/images/gym-login.png',      w: 1200 },
  { svg: gymRegisterSvg,   out: 'public/images/gym-register.png',   w: 1200 },
  { svg: gymOnboardingSvg, out: 'public/images/gym-onboarding.png', w: 800  },
]

for (const { svg, out, w } of images) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: w } })
  writeFileSync(out, resvg.render().asPng())
  console.log(`✓ ${out}`)
}
