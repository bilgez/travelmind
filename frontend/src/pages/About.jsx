import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar, { BRAND } from '../components/Navbar'
import Footer from '../components/Footer'

const ACCENT = BRAND

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
})

const FAQS = [
  {
    q: 'TravelMind nasıl çalışıyor?',
    a: 'Türkçe olarak yazdığın isteği — süre, bütçe ve tercihlerini — analiz eder; ardından Antalya\'nın en uygun mekanlarını seçerek gün gün bir rota oluşturur. Harita üzerinde görselleştirilmiş bu rotayı dilediğin gibi düzenleyebilir ve kaydedebilirsin.',
  },
  {
    q: 'Hesap açmam gerekiyor mu?',
    a: 'Planlayıcıyı giriş yapmadan kullanabilirsin, ancak planlarını kaydetmek ve "Planlarım" sayfasına eklemek için bir hesabın olması gerekiyor. Kayıt ücretsiz ve yalnızca e-posta + şifre yeterli.',
  },
  {
    q: 'Hangi tür aktiviteler öneriliyor?',
    a: 'Tarihi alanlar, plajlar, doğa yürüyüşleri, restoranlar, gece hayatı ve alışveriş — 7 farklı kategoride 65\'ten fazla Antalya mekanı arasından bütçene ve tercihine göre seçim yapılır.',
  },
  {
    q: 'Bütçemi aşan planlar oluşturuyor mu?',
    a: 'Her aktivitenin gerçek fiyatıyla çalışır. Belirttiğin bütçe içinde kalacak şekilde plan optimize edilir ve tahmini toplam maliyet her adımda gösterilir.',
  },
  {
    q: 'Planımı sonradan değiştirebilir miyim?',
    a: 'Evet. Oluşturduğun planları "Planlarım" sayfasından açabilir, aktivite ekleyip çıkarabilir ya da tamamen yeni bir plan oluşturabilirsin.',
  },
]

function Accordion({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left"
      >
        <span className="text-base font-semibold text-gray-900">{q}</span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="text-gray-500 text-sm leading-relaxed pb-5">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function About() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ── */}
      <section className="border-b border-gray-100 bg-[#F8F8F6]">
        <div className="max-w-3xl mx-auto px-6 py-28">
          <motion.p {...fadeUp(0)} className="text-xs font-bold uppercase tracking-widest mb-5 text-gray-400">
            Hakkında
          </motion.p>
          <motion.h1 {...fadeUp(0.08)} className="text-5xl md:text-6xl font-bold text-gray-900 leading-[1.1] mb-8">
            Antalya'yı keşfetmenin<br />
            <span style={{ color: BRAND }}>en akıllı yolu.</span>
          </motion.h1>
          <motion.p {...fadeUp(0.15)} className="text-xl text-gray-500 leading-relaxed max-w-2xl">
            TravelMind, Türkçe yazdığın bir cümleyi birkaç saniyede kişisel bir Antalya rotasına dönüştürür.
            Saatler süren araştırma yerine tek bir cümle yeterli.
          </motion.p>
        </div>
      </section>

      {/* ── Uzun metin ── */}
      <section className="max-w-3xl mx-auto px-6 py-20 space-y-6">
        <motion.p {...fadeUp()} className="text-lg text-gray-700 leading-relaxed">
          Antalya'ya gelen ziyaretçilerin büyük çoğunluğu nereye gideceğini, ne kadar harcayacağını
          ve günlük rotasını nasıl düzenleyeceğini bilmiyor. Onlarca sekme, çelişkili tavsiyeler,
          belirsiz bütçeler — seyahat planlamak çoğu zaman tatilin kendisinden daha yorucu oluyor.
        </motion.p>
        <motion.p {...fadeUp(0.05)} className="text-lg text-gray-700 leading-relaxed">
          <strong className="text-gray-900">TravelMind bunu tersine çeviriyor.</strong> "3 günlük tarihi tur,
          2.000 TL bütçe, ailecek" gibi doğal bir Türkçe cümle yazman yeterli. Yapay zeka süreyi,
          bütçeyi ve tercihleri otomatik olarak analiz eder; bütçene uyan aktiviteleri seçer,
          mekanların birbirine olan mesafesini hesaplar ve gereksiz gidip gelmeler olmadan
          gün gün bir rota oluşturur.
        </motion.p>
        <motion.p {...fadeUp(0.1)} className="text-lg text-gray-700 leading-relaxed">
          Oluşturulan plan harita üzerinde görselleştirilir, her aktivite için tahmini fiyat gösterilir
          ve toplam maliyet anlık olarak hesaplanır. İstediğin aktiviteyi kaldırabilir, ekleyebilir
          ya da sıfırdan yeni bir plan oluşturabilirsin. Beğendiğin planı kaydet, istediğin zaman geri dön.
        </motion.p>
      </section>

      {/* ── Nasıl çalışır ── */}
      <section className="border-t border-gray-100 bg-[#F8F8F6]">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <motion.h2 {...fadeUp()} className="text-3xl font-bold text-gray-900 mb-16">
            Nasıl çalışır?
          </motion.h2>

          <div className="space-y-14">
            {[
              {
                n: '01',
                title: 'İsteğini Türkçe yaz',
                body: 'Form yok, kategori seçimi yok. "Hafta sonu plaj turu, 1.500 TL" ya da "3 günlük tarihi gezi, çift kişi" gibi doğal bir cümle yeterli. TravelMind süreyi, bütçeyi ve tercihini otomatik olarak anlıyor.',
              },
              {
                n: '02',
                title: 'Yapay zeka planı oluşturuyor',
                body: 'İsteğin analiz edilir; bütçene, süreye ve tercihlerine göre Antalya\'nın en uygun mekanları seçilir. Her gün ayrı bir tema ve program olacak şekilde aktiviteler atanır, mekanlar arasındaki mesafeler gözetilerek rota optimize edilir.',
              },
              {
                n: '03',
                title: 'Rotanı gör, düzenle, kaydet',
                body: 'Plan harita üzerinde adım adım gösterilir. Beğenmediğin aktiviteyi değiştirebilir, yeni mekan ekleyebilirsin. Her şey hazır olduğunda planını kaydet — istediğin zaman geri dönebilirsin.',
              },
            ].map((item, i) => (
              <motion.div key={i} {...fadeUp(i * 0.1)} className="flex gap-10 items-start">
                <span className="text-[13px] font-bold text-gray-200 tracking-widest flex-shrink-0 pt-1 w-6 text-right">
                  {item.n}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Öne çıkan özellikler ── */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <motion.h2 {...fadeUp()} className="text-3xl font-bold text-gray-900 mb-12">
          Neden TravelMind?
        </motion.h2>

        <div className="space-y-6">
          {[
            { title: 'Türkçe anlıyor', body: 'İngilizce bilmene gerek yok. Türkçe yazdığın cümleden süreyi, bütçeyi ve tercihlerini çıkarır.' },
            { title: 'Bütçeni aşmıyor', body: 'Her aktivitenin gerçek fiyatıyla çalışır. Toplam maliyet her adımda güncel olarak gösterilir.' },
            { title: 'Zaman kaybettirmiyor', body: 'Hangi mekanların birbirine yakın olduğunu bilir. Gereksiz gidip gelmeler olmadan optimal rota çizer.' },
            { title: '65\'ten fazla mekan', body: 'Tarihi alanlar, plajlar, doğa, restoranlar, gece hayatı ve alışveriş — Antalya\'nın tamamı kapsanıyor.' },
            { title: 'Hesap gerektirmiyor', body: 'Kayıt olmadan, form doldurmadan hemen başlarsın. Bir cümle yaz, planın hazır.' },
          ].map((f, i) => (
            <motion.div key={i} {...fadeUp(i * 0.06)} className="flex gap-6 items-start py-2 border-b border-gray-50 last:border-0">
              <div className="w-1.5 h-1.5 rounded-full mt-2.5 flex-shrink-0" style={{ backgroundColor: ACCENT }} />
              <div>
                <p className="font-semibold text-gray-900 mb-1">{f.title}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{f.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SSS ── */}
      <section className="border-t border-gray-100 bg-[#F8F8F6]">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <motion.h2 {...fadeUp()} className="text-3xl font-bold text-gray-900 mb-10">
            Sık sorulan sorular
          </motion.h2>
          <div>
            {FAQS.map((faq, i) => <Accordion key={i} {...faq} />)}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-gray-950 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-[#96C8C8] text-xs font-semibold uppercase tracking-widest mb-5">Hazır mısın?</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            <span className="italic font-light">Antalya</span> gezini<br />şimdi planla.
          </h2>
          <p className="text-gray-400 text-base mb-10 max-w-md mx-auto">
            Ücretsiz. Türkçe yaz, rotanı birkaç saniyede al.
          </p>
          <button
            onClick={() => navigate('/planner')}
            className="bg-[#96C8C8] hover:bg-[#7DBCBC] text-gray-900 font-bold px-10 py-4 rounded-2xl transition-colors text-sm shadow-lg shadow-[#96C8C8]/20"
          >
            Planlamaya Başla
          </button>
        </div>
      </section>

      <Footer />

    </div>
  )
}
