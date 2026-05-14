import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { optimizeRoute, getBudget } from '../api/index'

function RoutePage() {
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [route, setRoute] = useState(null)
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('selected_activities')
    if (saved) setActivities(JSON.parse(saved))
  }, [])

  const handleOptimize = async () => {
    setLoading(true)
    try {
      const activityIds = activities.map(a => a.id)
      const res = await optimizeRoute({ trip_id: 1, activity_ids: activityIds })
      setRoute(res.data)
      const budgetRes = await getBudget(1)
      setBudget(budgetRes.data)
    } catch {
      alert('Hata olustu')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-orange-500">TravelMind</h1>
        <button onClick={() => navigate('/planner')} className="text-gray-500 hover:text-orange-500 text-sm">
          Geri Don
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Secilen Aktiviteler ({activities.length})</h2>
          <div className="space-y-2">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">{activity.name}</p>
                  <p className="text-xs text-gray-500">{activity.price} TL - {activity.rating} puan</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleOptimize}
            disabled={loading || activities.length === 0}
            className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Hesaplaniyor...' : 'Rotami Optimize Et'}
          </button>
        </div>

        {route && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Optimize Edilmis Rota</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-orange-500">{route.total_distance} km</p>
                <p className="text-xs text-gray-500 mt-1">Toplam Mesafe</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-500">{route.total_duration} saat</p>
                <p className="text-xs text-gray-500 mt-1">Tahmini Sure</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{route.total_cost_estimate} TL</p>
                <p className="text-xs text-gray-500 mt-1">Aktivite Maliyeti</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-3">Onerilen Siralama:</p>
              {route.optimized_order.map((id, index) => {
                const activity = activities.find(a => a.id === id)
                return activity ? (
                  <div key={id} className="flex items-center gap-3 p-2">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <p className="text-sm text-gray-700">{activity.name}</p>
                  </div>
                ) : null
              })}
            </div>
          </div>
        )}

        {budget && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Butce Ozeti</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Aktivite Maliyeti</span>
                <span className="font-medium">{budget.activity_cost_sum} TL</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Ulasim Maliyeti</span>
                <span className="font-medium">{budget.transport_cost} TL</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Yedek Pay</span>
                <span className="font-medium">{budget.contingency} TL</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold">Toplam Tahmini Butce</span>
                <span className="font-bold text-orange-500 text-lg">{budget.total_estimate} TL</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default RoutePage