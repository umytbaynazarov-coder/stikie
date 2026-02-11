import Canvas from './components/Canvas'
import TopBar from './components/TopBar'
import SearchBar from './components/SearchBar'
import UndoToast from './components/UndoToast'
import ArchivePanel from './components/ArchivePanel'
import PinLimitToast from './components/PinLimitToast'
import SpeedBadge from './components/SpeedBadge'
import InstallPrompt from './components/InstallPrompt'
import ContextMenu from './components/ContextMenu'
import MobileView from './components/MobileView'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useIsMobile } from './hooks/useIsMobile'

export default function App() {
  useKeyboardShortcuts()
  const isMobile = useIsMobile()

  return (
    <div className="w-full h-full">
      <TopBar />
      <SearchBar />
      <div className="w-full h-full pt-12">
        {isMobile ? <MobileView /> : <Canvas />}
      </div>
      <UndoToast />
      <ArchivePanel />
      <PinLimitToast />
      <SpeedBadge />
      <InstallPrompt />
      <ContextMenu />
    </div>
  )
}
