import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  useEffect(() => { document.title = 'Sayfa Bulunamadı | TravelMind' }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <p className="text-8xl font-bold text-[#96C8C8] mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Sayfa bulunamadı</h1>
      <p className="text-gray-400 text-sm mb-8 max-w-xs">
        Aradığın sayfa mevcut değil ya da taşınmış olabilir.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-3 rounded-full text-sm font-semibold text-white transition-colors"
        style={{ background: '#96C8C8' }}
      >
        Ana Sayfaya Dön
      </button>
    </div>
  )
}
