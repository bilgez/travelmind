import { useNavigate } from 'react-router-dom'

export default function Footer() {
  const navigate = useNavigate()

  return (
    <footer className="bg-gray-950 border-t border-white/5 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-1">
            <p className="text-xl font-bold mb-3">Travel<span className="text-[#96C8C8]">Mind</span></p>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Antalya için Türkçe yapay zeka destekli seyahat planlama platformu.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Sayfalar</p>
            <ul className="space-y-2.5">
              {[
                { label: 'AI Planlayıcı', path: '/planner' },
                { label: 'Planlarım', path: '/plans' },
                { label: 'Hakkında', path: '/about' },
                ...(!localStorage.getItem('token') ? [{ label: 'Giriş Yap', path: '/login' }] : []),
              ].map((l, i) => (
                <li key={i}>
                  <button onClick={() => navigate(l.path)} className="text-sm text-gray-500 hover:text-white transition-colors">{l.label}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Kategoriler</p>
            <ul className="space-y-2.5">
              {['Tarihi Yerler', 'Plajlar', 'Doğa & Aktivite', 'Restoranlar', 'Gece Hayatı'].map((cat, i) => (
                <li key={i}>
                  <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-white transition-colors">{cat}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">İletişim</p>
            <ul className="space-y-3">
              <li>
                <a href="mailto:iletisim@travelmind.app" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  iletisim@travelmind.app
                </a>
              </li>
              <li>
                <button onClick={() => navigate('/about')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Hakkında
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-6">
          <p className="text-sm text-gray-600">© 2026 TravelMind · THK Üniversitesi Yazılım Mühendisliği</p>
        </div>
      </div>
    </footer>
  )
}
