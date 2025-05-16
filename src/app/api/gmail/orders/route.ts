// app/api/gmail/orders/route.ts
import { auth } from '@/../auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()

  console.log('Session in API route:', session) // Debug log

  if (!session?.accessToken) {
    console.log('hello not authenticated')
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Search for emails with common order keywords
    const query = 'subject:(order OR receipt OR confirmation) after:2023/01/01'
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
        query,
      )}&maxResults=10`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

    console.log('response', response)
    if (!response.ok) throw new Error('Failed to fetch orders')

    const data = await response.json()
    const messages = data.messages || []

    // Process messages sequentially with error handling
    const orders = []
    for (const msg of messages) {
      try {
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        )

        if (!messageResponse.ok) {
          const error = await messageResponse.json()
          console.error(`Failed to fetch message ${msg.id}:`, error)
          continue // Skip this message but continue processing others
        }

        const email = await messageResponse.json()
        const orderData = extractOrderData(email, msg.id)
        if (orderData) orders.push(orderData)
      } catch (error) {
        console.error(`Error processing message ${msg.id}:`, error)
      }
    }

    return NextResponse.json(orders.filter(Boolean))
  } catch (error) {
    console.log('errorrrr', error)
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
  console.log('email', email)
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
