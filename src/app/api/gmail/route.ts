import { auth } from '@/../auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()

  console.log('Session in API route: api/gmail', session) // Debug log

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: 'Not authenticated or missing access token' },
      { status: 401 },
    )
  }

  try {
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10',
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      },
    )
    // const query = 'subject:(order OR receipt OR confirmation) after:2023/01/01'
    // const response = await fetch(
    //   `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
    //     query,
    //   )}&maxResults=50`,
    //   {
    //     headers: {
    //       Authorization: `Bearer ${session.accessToken}`,
    //       'Content-Type': 'application/json',
    //     },
    //   },
    // )

    console.log('response gmail', response)
    if (!response.ok) {
      const errorData = await response.json()
      console.error('Gmail API error:', errorData)
      throw new Error(errorData.error?.message || 'Failed to fetch emails')
    }

    const emails = await response.json()
    return NextResponse.json(emails)
  } catch (error) {
    console.error('Error in Gmail API route:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch emails',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
