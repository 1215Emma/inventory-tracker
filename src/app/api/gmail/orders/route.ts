// app/api/gmail/orders/route.ts
import { auth } from '@/../auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Search for emails with common order keywords
    const query = 'subject:(order OR receipt OR confirmation) after:2023/01/01'
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
        query,
      )}&maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      },
    )

    if (!response.ok) throw new Error('Failed to fetch orders')

    const data = await response.json()
    const messages = data.messages || []

    // Fetch details for each message
    const orders = await Promise.all(
      messages.map(async (msg: any) => {
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          },
        )
        const email = await res.json()
        return extractOrderData(email, msg.id)
      }),
    )

    return NextResponse.json(orders.filter(Boolean))
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process orders', details: error.message },
      { status: 500 },
    )
  }
}

function extractOrderData(email: any, id: string) {
  const headers = email.payload.headers
  const subject = headers.find((h: any) => h.name === 'Subject')?.value || ''
  const date = headers.find((h: any) => h.name === 'Date')?.value || ''
  const body = email.snippet

  // Extract order number (customize based on your email patterns)
  const orderNumberMatch =
    subject.match(/(ORDER|ORD|#)\s*(\d+)/i) ||
    body.match(/(ORDER|ORD|#)\s*(\d+)/i)
  const orderNumber = orderNumberMatch ? orderNumberMatch[2] : null

  // Extract amount (customize based on your email patterns)
  const amountMatch =
    subject.match(/(TOTAL|AMOUNT):?\s*(\$\d+\.\d+)/i) ||
    body.match(/(TOTAL|AMOUNT):?\s*(\$\d+\.\d+)/i)
  const amount = amountMatch ? amountMatch[2] : null

  if (!orderNumber) return null

  return {
    id: email.id,
    orderNumber,
    subject,
    date: new Date(date).toISOString(),
    amount,
    merchant: subject.split(' ')[0], // Simple merchant extraction
    snippet: email.snippet,
    fullEmail: email, // Include full email if needed
  }
}
