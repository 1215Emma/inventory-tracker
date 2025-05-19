// app/api/gmail/orders/route.ts
import { auth } from '@/../auth'
import { NextResponse } from 'next/server'

function getHTMLFromPayload(payload: any): string | null {
  // Case 1: Single part with HTML
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return decodeBase64(payload.body.data)
  }

  // Case 2: Multipart — find the HTML part
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBase64(part.body.data)
      }

      // Sometimes html is nested inside other parts
      if (part.parts) {
        const nestedHtml = getHTMLFromPayload(part)
        if (nestedHtml) return nestedHtml
      }
    }
  }

  return null
}

function decodeBase64(data: string): string {
  const decoded = atob(data.replace(/-/g, '+').replace(/_/g, '/'))
  return decodeURIComponent(escape(decoded)) // Handles UTF-8 characters
}

export async function GET() {
  const session = await auth()

  console.log('Session in API route:', session) // Debug log

  if (!session?.accessToken) {
    console.log('hello not authenticated')
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Search for emails with common order keywords
    const query = `
  subject:(order OR receipt OR confirmation)
  after:2023/01/01
  -subject:"Panda Express"
  -subject: "arrived"
  -subject: "arrive"
  -subject: "delivered"
  -subject: "boba grande"
  -subject: "canceled"
  -from:chipotle@email.chipotle.com
`

    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
        query,
      )}&maxResults=50`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    )

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
        const html = getHTMLFromPayload(email.payload)
        const orderData = extractOrderData(email, msg.id, html)

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

function extractOrderData(email: any, id: string, html?: string) {
  const headers = email.payload.headers
  const subject = headers.find((h: any) => h.name === 'Subject')?.value || ''
  const date = headers.find((h: any) => h.name === 'Date')?.value || ''
  const from = headers.find((h: any) => h.name === 'From')?.value || ''
  const body = email.snippet

  const orderNumberMatch =
    subject.match(/(ORDER|ORD|#)\s*(\d+)/i) ||
    body.match(/(ORDER|ORD|#)\s*(\d+)/i)
  const orderNumber = orderNumberMatch ? orderNumberMatch[2] : null

  const amountMatch =
    subject.match(/(TOTAL|AMOUNT):?\s*(\$\d+\.\d+)/i) ||
    body.match(/(TOTAL|AMOUNT):?\s*(\$\d+\.\d+)/i)
  const amount = amountMatch ? amountMatch[2] : null

  // ✅ Proper merchant extraction from 'From' header
  const merchant = extractMerchantFromHeader(from)

  if (!orderNumber) return null

  return {
    id: email.id,
    orderNumber,
    subject,
    date: new Date(date).toISOString(),
    amount,
    merchant,
    snippet: email.snippet,
    html,
  }
}

function extractMerchantFromHeader(from: string): string {
  // Examples:
  // "Amazon <no-reply@amazon.com>"
  // "Panda Express <receipts@pandaexpress.com>"
  const match = from.match(/^(.*?)</)
  if (match) {
    return match[1].trim()
  }

  // Fallback to full string
  return from.trim()
}
