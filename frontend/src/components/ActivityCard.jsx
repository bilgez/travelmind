function ActivityCard({ activity, selected, onToggle }) {
  return (
    <div className={`border rounded-xl p-4 transition-all cursor-pointer ${
      selected ? 'border-[#96C8C8] bg-[#E8F7F6]' : 'border-gray-200 hover:border-[#B8E0DC]'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-medium text-gray-800 text-sm">{activity.name}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-yellow-500 text-xs">⭐ {activity.rating}</span>
            <span className="text-gray-500 text-xs">{activity.price} TL</span>
            <span className="text-gray-400 text-xs">{activity.category}</span>
          </div>
        </div>
        <button
          onClick={() => onToggle(activity)}
          className={`ml-3 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            selected
              ? 'bg-[#96C8C8] text-gray-900'
              : 'bg-gray-100 text-gray-600 hover:bg-[#E8F7F6]'
          }`}
        >
          {selected ? 'Cikar' : 'Ekle'}
        </button>
      </div>
    </div>
  )
}

export default ActivityCard