import { useNavigate } from 'react-router-dom'

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-lg font-bold text-gray-900">
          Travel<span className="text-sky-500">Mind</span>
        </button>
        <button
          onClick={() => navigate('/planner')}
          className="text-sm font-semibold bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-full transition-colors"
        >
          Plan Oluştur
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-14">
          <p className="text-sky-500 text-xs font-semibold uppercase tracking-widest mb-3">Hakkımızda</p>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Antalya'yı daha iyi<br />
            <span className="text-gray-400 font-light">keşfetmek için yaptık.</span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-lg">
            TravelMind, THK Üniversitesi Yazılım Mühendisliği programı kapsamında geliştirilen
            yapay zeka destekli bir seyahat planlama uygulamasıdır.
          </p>
        </div>

        {/* Project info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
          {[
            {
              title: 'Proje',
              lines: ['Yazılım Mühendisliği Capstone', 'THK Üniversitesi · 2025–2026', 'Türkçe NLP Tabanlı Sistem'],
            },
            {
              title: 'Teknolojiler',
              lines: ['FastAPI + SQLite (Backend)', 'React + Vite + Tailwind (Frontend)', 'Google Maps API · Framer Motion'],
            },
            {
              title: 'Kapsam',
              lines: ['65+ Antalya mekanı', '7 kategori', 'Türkçe doğal dil işleme'],
            },
            {
              title: 'Özellikler',
              lines: ['AI destekli plan oluşturma', 'Mesafeye göre rota optimizasyonu', 'Bütçe takibi ve plan kaydetme'],
            },
          ].map((card, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{card.title}</p>
              <ul className="space-y-1.5">
                {card.lines.map((line, j) => (
                  <li key={j} className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="w-1 h-1 bg-sky-400 rounded-full flex-shrink-0" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="border-t border-gray-100 pt-12 mb-14">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Neden TravelMind?</h2>
          <p className="text-gray-500 text-base leading-relaxed mb-4">
            Antalya'ya gelen ziyaretçilerin büyük çoğunluğu nereye gideceğini, ne kadar harcayacağını
            ve günlük rotasını nasıl planlayacağını bilmiyor. Mevcut uygulamalar ya çok genel ya da
            Türkçe desteği yok.
          </p>
          <p className="text-gray-500 text-base leading-relaxed">
            TravelMind, kullanıcının kendi dilinde — "3 günlük tarihi tur, 1500 TL, çift kişi" gibi —
            doğal bir cümleyle isteğini iletmesine ve saniyeler içinde kişiselleştirilmiş, bütçeye uygun
            ve coğrafi olarak optimize edilmiş bir plan almasına olanak tanır.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-gray-950 rounded-3xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Deneyin</h3>
          <p className="text-gray-400 text-sm mb-5">Hesap açmadan, ücretsiz, hemen şimdi.</p>
          <button
            onClick={() => navigate('/planner')}
            className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Plan Oluştur
          </button>
        </div>

      </div>
    </div>
  )
}
