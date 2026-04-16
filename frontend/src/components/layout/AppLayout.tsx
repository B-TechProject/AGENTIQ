import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Grid background */}
      <div className="fixed inset-0 grid-bg pointer-events-none z-0" />

      {/* Glow orbs */}
      <div className="fixed pointer-events-none z-0"
           style={{ width:400,height:400,top:-100,left:-100,borderRadius:'50%',background:'rgba(0,212,170,0.05)',filter:'blur(80px)' }} />
      <div className="fixed pointer-events-none z-0"
           style={{ width:500,height:500,bottom:-150,right:-150,borderRadius:'50%',background:'rgba(168,85,247,0.04)',filter:'blur(80px)' }} />

      <Sidebar />

      <div className="flex flex-col flex-1 min-h-screen" style={{ marginLeft: 220 }}>
        <Topbar />
        <main className="flex-1 p-6 relative z-10 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
