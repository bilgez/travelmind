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
  const [showPassword, setShowPassword] = useState(false)

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
        localStorage.setItem('user_id', res.data.user_id)
        navigate('/plans')
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
          <button onClick={() => navigate('/')} className="text-2xl font-bold text-white tracking-tight hover:opacity-80 transition-opacity">
            Travel<span className="text-[#96C8C8]">Mind</span>
          </button>
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
              Travel<span className="text-[#4A9898]">Mind</span>
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
                className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-2xl px-4 py-3.5 text-base text-gray-900 placeholder-gray-400 outline-none focus:border-[#96C8C8] focus:bg-white transition-all duration-200"
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
                  className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-2xl px-4 py-3.5 text-base text-gray-900 placeholder-gray-400 outline-none focus:border-[#96C8C8] focus:bg-white transition-all duration-200"
                  placeholder=""
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sifre</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border-2 border-gray-100 bg-gray-50/50 rounded-2xl px-4 py-3.5 pr-12 text-base text-gray-900 placeholder-gray-400 outline-none focus:border-[#96C8C8] focus:bg-white transition-all duration-200"
                  placeholder=""
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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
                className="text-[#4A9898] font-bold ml-1.5 hover:underline"
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