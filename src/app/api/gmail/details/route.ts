// app/api/gmail/details/route.ts
import { auth } from '@/../auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  const { searchParams } = new URL(request.url)
  const emailId = searchParams.get('id')

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error('Failed to fetch email details')
    }

    const data = await response.json()

    // Extract relevant headers
    const headers = data.payload.headers
    return NextResponse.json({
      id: data.id,
      subject:
        headers.find((h: any) => h.name === 'Subject')?.value || 'No subject',
      from:
        headers.find((h: any) => h.name === 'From')?.value || 'Unknown sender',
      date:
        headers.find((h: any) => h.name === 'Date')?.value || 'Unknown date',
      snippet: data.snippet,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch email details' },
      { status: 500 },
    )
  }
}
