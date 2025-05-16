import { auth, signIn, signOut } from '@/../auth'
import { redirect } from 'next/navigation'
import googleAuthCheck from '../googleAuthCheck/googleAuthCheck'

export default async function GoogleAuthButton() {
  const session = await auth()
  const user = session?.user
  console.log('session', session)
  return user ? (
    <>
      <img src={user.image} />
      <h1>{user.name}</h1>
      <form
        action={async () => {
          'use server'
          await signOut()
        }}
      >
        <button type="submit">Sign Out</button>
      </form>
    </>
  ) : (
    <>
      <form
        action={async () => {
          'use server'
          await signIn('google', { redirectTo: '/inventoryApp' })
        }}
      >
        <button type="submit">Signin with Google</button>
      </form>
    </>
  )
}
