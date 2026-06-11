import { Resvg } from '@resvg/resvg-js'
import { writeFileSync } from 'fs'

// SVG icon: dark background + teal rounded square + white dumbbell
function makeSvg(size) {
  const scale = size / 512
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0A0F0A"/>
  <rect x="80" y="80" width="352" height="352" rx="80" fill="#14B8A6"/>
  <rect x="104" y="208" width="32" height="96" rx="12" fill="white"/>
  <rect x="136" y="224" width="48" height="64" rx="8" fill="white"/>
  <rect x="184" y="244" width="144" height="24" rx="6" fill="white"/>
  <rect x="328" y="224" width="48" height="64" rx="8" fill="white"/>
  <rect x="376" y="208" width="32" height="96" rx="12" fill="white"/>
</svg>`
}

for (const size of [512, 192]) {
  const svg = makeSvg(size)
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render().asPng()
  writeFileSync(`public/icon-${size}.png`, png)
  console.log(`✓ public/icon-${size}.png (${size}x${size})`)
}
