import Header from './Header'
import BottomNav from './BottomNav'

interface AppShellProps {
  children: React.ReactNode
  /** Titre affiché dans le header. Si absent → logo Fittracker. */
  title?: string
  /** Affiche le bouton retour dans le header. */
  showBack?: boolean
  /** Masque l'avatar utilisateur (utile sur les pages avec showBack). */
  hideAvatar?: boolean
  /** Contenu custom injecté dans le slot droit du header. */
  headerRight?: React.ReactNode
}

/**
 * Wrapper pour toutes les pages authentifiées.
 * Layout flex-col h-screen : header fixe 60px / contenu scrollable / nav fixe 72px.
 * Max-width 430px centré, fond #0A0F0A.
 */
export default function AppShell({
  children,
  title,
  showBack = false,
  hideAvatar = false,
  headerRight,
}: AppShellProps) {
  return (
    <div
      className="flex flex-col max-w-[430px] mx-auto bg-bg"
      style={{
        height: '100vh',
        paddingTop: 'max(env(safe-area-inset-top), 20px)',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
      }}
    >
      <Header
        title={title}
        showBack={showBack}
        hideAvatar={hideAvatar || showBack}
        rightContent={headerRight}
      />

      <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain bg-bg">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
