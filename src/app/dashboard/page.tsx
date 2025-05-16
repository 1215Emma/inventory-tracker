// app/dashboard/page.tsx
import OrderTracker from '@/components/OrderTracker/OrderTracker'
import { auth } from '@/../auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) return redirect('/login')

  return (
    <main>
      <OrderTracker />
    </main>
  )
}
