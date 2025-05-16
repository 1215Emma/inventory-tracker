// components/OrderTracker.tsx
'use client'
import { useState, useEffect } from 'react'

export default function OrderTracker() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/gmail/orders')
      if (!response.ok) throw new Error('Failed to fetch orders')
      const data = await response.json()
      setOrders(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const totalSpent = orders.reduce((sum, order) => {
    return sum + (order.amount ? parseFloat(order.amount.replace('$', '')) : 0)
  }, 0)

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Order Tracking</h1>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        <p>Total Orders: {orders.length}</p>
        <p>Total Spent: ${totalSpent.toFixed(2)}</p>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Refreshing...' : 'Refresh Orders'}
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-4 text-left">Order #</th>
              <th className="py-2 px-4 text-left">Merchant</th>
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-left">Amount</th>
              <th className="py-2 px-4 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">{order.orderNumber}</td>
                <td className="py-2 px-4">{order.merchant}</td>
                <td className="py-2 px-4">
                  {new Date(order.date).toLocaleDateString()}
                </td>
                <td className="py-2 px-4">{order.amount || 'N/A'}</td>
                <td className="py-2 px-4">
                  <button
                    onClick={() => console.log(order.fullEmail)}
                    className="text-blue-500 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
