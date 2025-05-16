import { auth } from '@/../auth'
import { redirect } from 'next/navigation'
import GoogleAuthButton from '@/components/GoogleAuthButton/GoogleAuthButton'
import GmailInbox from '@/components/GmailInbox/GmailInbox'

export default async function inventoryApp() {
  const session = await auth()
  if (!session) return redirect('')
  console.log('session', session)
  const getData = async () => {
    const res = await fetch('https://www.googleapis.com/auth/gmail.readonly')
    if (!res.ok) {
      throw new Error('Failed to fetch data')
    }
    return res.json()
  }
  getData()
  return (
    <div>
      <GmailInbox />
    </div>
  )
}
