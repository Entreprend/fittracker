export type BgPattern = 'dots' | 'diagonal' | 'grid' | 'circles'

const PATTERNS: Record<BgPattern, React.CSSProperties> = {
  // Dashboard — grille de points teal subtils
  dots: {
    backgroundImage: 'radial-gradient(circle, rgba(20,184,166,0.08) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  },
  // Workouts — rayures diagonales
  diagonal: {
    backgroundImage: [
      'repeating-linear-gradient(',
      '  45deg,',
      '  transparent,',
      '  transparent 20px,',
      '  rgba(20,184,166,0.04) 20px,',
      '  rgba(20,184,166,0.04) 21px',
      ')',
    ].join(''),
  },
  // Start workout — grille carrée (ambiance immersive)
  grid: {
    backgroundImage: [
      'linear-gradient(rgba(20,184,166,0.06) 1px, transparent 1px),',
      'linear-gradient(90deg, rgba(20,184,166,0.06) 1px, transparent 1px)',
    ].join(' '),
    backgroundSize: '32px 32px',
  },
  // Progress — cercles/points plus fins
  circles: {
    backgroundImage: 'radial-gradient(circle, rgba(20,184,166,0.06) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
  },
}

interface BackgroundImageProps {
  pattern: BgPattern
}

export default function BackgroundImage({ pattern }: BackgroundImageProps) {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      style={PATTERNS[pattern]}
      aria-hidden="true"
    />
  )
}
