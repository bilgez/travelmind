import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar, { BRAND } from '../components/Navbar'
import { updateProfile } from '../api/index'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
})

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-8 py-5 border-b border-gray-50">
        <h2 className="font-bold text-gray-900 text-base">{title}</h2>
      </div>
      <div className="px-8 py-6">{children}</div>
    </div>
  )
}

function Toast({ message, type }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg ${
        type === 'success'
          ? 'bg-[#96C8C8] text-gray-900'
          : 'bg-rose-500 text-white'
      }`}
    >
      {message}
    </motion.div>
  )
}

export default function Profile() {
  useEffect(() => { document.title = 'Profil | TravelMind' }, [])
  const navigate = useNavigate()
  const currentUsername = localStorage.getItem('username') || ''

  const [usernameForm, setUsernameForm] = useState({ username: currentUsername })
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loadingUsername, setLoadingUsername] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleUsernameSubmit = async (e) => {
    e.preventDefault()
    if (!usernameForm.username.trim() || usernameForm.username === currentUsername) return
    setLoadingUsername(true)
    try {
      const res = await updateProfile({ username: usernameForm.username.trim() })
      localStorage.setItem('username', res.data.username)
      showToast('Kullanıcı adı güncellendi!')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Bir hata oluştu', 'error')
    }
    setLoadingUsername(false)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast('Yeni şifreler eşleşmiyor', 'error')
      return
    }
    if (passwordForm.new_password.length < 6) {
      showToast('Yeni şifre en az 6 karakter olmalı', 'error')
      return
    }
    setLoadingPassword(true)
    try {
      await updateProfile({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      })
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
      showToast('Şifre güncellendi!')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Bir hata oluştu', 'error')
    }
    setLoadingPassword(false)
  }

  const inputClass = "w-full border-2 border-gray-100 bg-gray-50/50 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#96C8C8] focus:bg-white transition-all duration-200"

  return (
    <div className="min-h-screen bg-[#F8F8F6]">
      <Navbar />

      <div className="max-w-xl mx-auto px-6 py-14">
        <motion.div {...fadeUp(0)} className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Profil Ayarları</h1>
          </div>
          <p className="text-sm text-gray-400 ml-9">
            Hesap bilgilerini buradan güncelleyebilirsin.
          </p>
        </motion.div>

        {/* Avatar */}
        <motion.div {...fadeUp(0.05)} className="flex items-center gap-4 mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-sm"
            style={{ backgroundColor: BRAND }}
          >
            {currentUsername[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{localStorage.getItem('username')}</p>
            <p className="text-sm text-gray-400">{localStorage.getItem('user_id') ? `#${localStorage.getItem('user_id')}` : ''}</p>
          </div>
        </motion.div>

        <div className="space-y-5">
          {/* Username */}
          <motion.div {...fadeUp(0.1)}>
            <Section title="Kullanıcı Adı">
              <form onSubmit={handleUsernameSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Yeni kullanıcı adı
                  </label>
                  <input
                    type="text"
                    value={usernameForm.username}
                    onChange={e => setUsernameForm({ username: e.target.value })}
                    className={inputClass}
                    placeholder="kullanici_adi"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingUsername || !usernameForm.username.trim() || usernameForm.username === currentUsername}
                  className="w-full bg-gray-900 hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loadingUsername && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Kaydet
                </button>
              </form>
            </Section>
          </motion.div>

          {/* Password */}
          <motion.div {...fadeUp(0.15)}>
            <Section title="Şifre Değiştir">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Mevcut şifre
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={passwordForm.current_password}
                      onChange={e => setPasswordForm(p => ({ ...p, current_password: e.target.value }))}
                      className={inputClass + ' pr-11'}
                      required
                    />
                    <button type="button" onClick={() => setShowCurrent(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showCurrent
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                        }
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Yeni şifre
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={e => setPasswordForm(p => ({ ...p, new_password: e.target.value }))}
                      className={inputClass + ' pr-11'}
                      placeholder="En az 6 karakter"
                      required
                    />
                    <button type="button" onClick={() => setShowNew(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showNew
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                        }
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Yeni şifre (tekrar)
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={e => setPasswordForm(p => ({ ...p, confirm_password: e.target.value }))}
                    className={inputClass}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingPassword || !passwordForm.current_password || !passwordForm.new_password}
                  className="w-full bg-gray-900 hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loadingPassword && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Şifremi Değiştir
                </button>
              </form>
            </Section>
          </motion.div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
