import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { login, register } from '../api/index'

// Kullanilacak videolarin listesi (public klasorundeki isimler)
const LOGIN_VIDEOS = [
  '/antalya_login_1.mp4',
  '/antalya_login_2.mp4',
  '/antalya_login_3.mp4',
  '/antalya_login_4.mp4',
  '/antalya_login_5.mp4',
  '/antalya_login_6.mp4',
  '/antalya_login_7.mp4',
  '/antalya_login_8.mp4',
  '/antalya_login_9.mp4'
]
export default function Login() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Sayfa ilk acildiginda rastgele bir video secmek icin state
  const [randomVideo, setRandomVideo] = useState('')

  useEffect(() => {
    // Sayfa her yuklendiginde listeden rastgele bir index secer
    const randomIndex = Math.floor(Math.random() * LOGIN_VIDEOS.length)
    setRandomVideo(LOGIN_VIDEOS[randomIndex])
  }, [isLogin]) // isLogin her degistiginde (Giris/Kayit gecislerinde) de video degisir, cok dinamik olur!
  

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isLogin) {
        const res = await login({ email: form.email, password: form.password })
        localStorage.setItem('token', res.data.access_token)
        localStorage.setItem('username', res.data.username)
        localStorage.setItem('user_id', res.data.user_id || 1)
        navigate('/planner')
      } else {
        await register({ email: form.email, username: form.username, password: form.password })
        setIsLogin(true)
        setError('Kayit basarili! Giris yapabilirsiniz.')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Bir hata olustu')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full flex bg-stone-50 overflow-hidden select-none">
      
      {/* SOL PANEL - TIIMO & TRIPADVISOR ESINTILI GORSEL ALAN */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden bg-gray-900 flex-col justify-between p-12">
        {/* Dinamik Video Etiketi */}
        {randomVideo && (
          <video 
            key={randomVideo} // Key vermek React'in videoyu tamamen yeniden yuklemesini saglar
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover opacity-70 pointer-events-none"
          >
            <source src={randomVideo} type="video/mp4" />
          </video>
        )}

        {/* Cam Efekti Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-black/20" />
        
        {/* Üst Logo Bölümü */}
        <div className="relative z-10">
          <span className="text-2xl font-bold text-white tracking-tight">
            Travel<span className="text-sky-400">Mind</span>
          </span>
        </div>

        {/* Alt Dinamik Metin Bölümü */}
        <div className="relative z-10 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login-txt' : 'register-txt'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl font-medium text-white leading-tight mb-2">
                {isLogin ? 'Tekrar hos geldin!' : 'Yeni bir maceraya basla.'}
              </h2>
              <p className="text-sm text-gray-300 font-light max-w-sm leading-relaxed">
                {isLogin 
                  ? 'Akilli seyahat planlayicin ile Antalya rotani kaldigin yerden organize etmeye hazir misin?' 
                  : 'Kisisel yapay zeka asistaninla seyahat tarzina en uygun rotalari kesfetmek icin hesabini olustur.'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* SAG PANEL - MINIMALIST VE MODERN FORM ALANI */}
      <div className="w-full lg:w-3/5 flex flex-col justify-center items-center px-6 md:px-20 py-12 bg-white">
        <div className="w-full max-w-[440px] space-y-8">
          
          {/* Mobil Cihazlar İçin Logo */}
          <div className="lg:hidden text-center mb-2">
            <span className="text-3xl font-bold text-gray-900">
              Travel<span className="text-sky-500">Mind</span>
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {isLogin ? 'Giris Yap' : 'Hesap Olustur'}
            </h1>
            <p className="text-sm text-gray-500">
              {isLogin ? 'Seyahat potansiyelini aciga cikarmaya hazir misin?' : 'Ucretsiz kaydolun ve hemen planlamaya baslayin'}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-2xl text-sm ${
                error.includes('basarili') 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                  : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">E-Posta</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-2xl px-4 py-3.5 text-base text-gray-900 placeholder-gray-400 outline-none focus:border-sky-400 focus:bg-white transition-all duration-200"
                placeholder="örn. merhaba@travelmind.com"
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Kullanici Adi</label>
                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-2xl px-4 py-3.5 text-base text-gray-900 placeholder-gray-400 outline-none focus:border-sky-400 focus:bg-white transition-all duration-200"
                  placeholder=""
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sifre</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-2xl px-4 py-3.5 text-base text-gray-900 placeholder-gray-400 outline-none focus:border-sky-400 focus:bg-white transition-all duration-200"
                placeholder=""
                required
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gray-950 hover:bg-gray-800 disabled:bg-gray-200 text-white font-bold py-4 rounded-full text-base transition-colors duration-200 shadow-md shadow-gray-950/10 mt-2 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLogin ? (
                'Giris Yap'
              ) : (
                'Hesabimi Olustur'
              )}
            </motion.button>
          </form>

          <div className="text-center pt-2">
            <p className="text-sm text-gray-500">
              {isLogin ? 'Hesabiniz yok mu?' : 'Zaten bir hesabiniz var mi?'}
              <button
                onClick={() => { setIsLogin(!isLogin); setError('') }}
                className="text-sky-500 font-bold ml-1.5 hover:underline"
              >
                {isLogin ? 'Yeni hesap olustur' : 'Giris yap'}
              </button>
            </p>
          </div>

        </div>
      </div>

    </div>
  )
}