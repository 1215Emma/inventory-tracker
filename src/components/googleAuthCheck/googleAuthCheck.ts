import { redirect } from 'next/navigation'
import { auth } from '@/../auth'

export default async function googleAuthCheck() {
  const session = await auth()
  return !session ? redirect('') : session
}
