import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/index'

function Login() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isLogin) {
        const res = await login({ email: form.email, password: form.password })
        localStorage.setItem('token', res.data.access_token)
        localStorage.setItem('username', res.data.username)
        localStorage.setItem('user_id', 1)
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-blue-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-500 mb-2">TravelMind</h1>
          <p className="text-gray-500">{isLogin ? 'Hesabiniza giris yapin' : 'Yeni hesap olusturun'}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400"
              placeholder="ornek@email.com"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kullanici Adi</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400"
                placeholder="kullanici_adi"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sifre</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? 'Yukleniyor...' : isLogin ? 'Giris Yap' : 'Kayit Ol'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {isLogin ? 'Hesabiniz yok mu?' : 'Zaten hesabiniz var mi?'}
          <button
            onClick={() => { setIsLogin(!isLogin); setError('') }}
            className="text-orange-500 font-medium ml-1 hover:underline"
          >
            {isLogin ? 'Kayit Ol' : 'Giris Yap'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default Login