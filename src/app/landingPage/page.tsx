import GoogleAuthButton from '@/components/GoogleAuthButton/GoogleAuthButton'
import { auth, signIn, signOut } from '@/../auth'

export default async function landingPage() {
  return <GoogleAuthButton />
}
