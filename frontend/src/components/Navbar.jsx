import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export const BRAND = '#96C8C8'

export default function Navbar({ transparent = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('user_id')
    setMenuOpen(false)
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  const linkClass = (path) => `text-sm font-medium transition-colors ${
    transparent
      ? isActive(path) ? 'text-white' : 'text-white/70 hover:text-white'
      : isActive(path) ? '' : 'text-gray-500 hover:text-gray-900'
  }`
  const linkStyle = (path) => isActive(path) && !transparent ? { color: '#96C8C8' } : {}

  return (
    <nav className={`h-14 px-6 flex items-center justify-between sticky top-0 z-50 ${
      transparent
        ? 'bg-transparent'
        : 'bg-white/90 backdrop-blur-md border-b border-gray-100'
    }`}>

      <button
        onClick={() => navigate('/')}
        className={`font-bold text-xl ${transparent ? 'text-white' : 'text-gray-900'}`}
      >
        Travel<span style={{ color: transparent ? '#C5E8E6' : BRAND }}>Mind</span>
      </button>

      <div className="hidden md:flex items-center gap-7">
        <button onClick={() => navigate('/')} className={linkClass('/')} style={linkStyle('/')}>Ana Sayfa</button>
        <button onClick={() => navigate('/planner')} className={linkClass('/planner')} style={linkStyle('/planner')}>Planlayıcı</button>
        <button onClick={() => navigate('/plans')} className={linkClass('/plans')} style={linkStyle('/plans')}>Planlarım</button>
        <button onClick={() => navigate('/about')} className={linkClass('/about')} style={linkStyle('/about')}>Hakkında</button>
      </div>

      <div className="flex items-center gap-3">
        {token ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-full border transition-all"
              style={{
                borderColor: transparent ? 'rgba(255,255,255,0.3)' : '#e5e7eb',
                color: transparent ? 'white' : '#374151',
                backgroundColor: transparent ? 'rgba(255,255,255,0.1)' : 'white',
              }}
            >
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: BRAND }}>
                {(username || 'U')[0].toUpperCase()}
              </span>
              <span className="hidden sm:block max-w-[100px] truncate">{username}</span>
              <svg className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${menuOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-50">
                  <p className="text-xs text-gray-400">Giriş yapıldı</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{username}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); navigate('/plans') }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Planlarım
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate('/profile') }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Profil Ayarları
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              onClick={() => navigate('/login')}
              className={`text-sm font-medium transition-colors ${transparent ? 'text-white/80 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => navigate('/planner')}
              className="text-sm font-semibold text-gray-900 px-4 py-2 rounded-full transition-all hover:opacity-90"
              style={{ background: BRAND }}
            >
              Plan Oluştur
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
