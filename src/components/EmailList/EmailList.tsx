'use client'

import { useEffect, useState } from 'react'
import './EmailList.css' // Import the CSS file

type Email = {
  id: string
  orderNumber: string
  subject: string
  date: string
  amount?: string
  merchant: string
  snippet: string
  fullEmail: any
  html: any
}

export default function EmailList() {
  const [emails, setEmails] = useState<Email[]>([])
  const [selected, setSelected] = useState<Email | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/gmail/orders')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch emails')
        return res.json()
      })
      .then((data) => {
        setEmails(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="container">
      {/* Email List */}
      <div className="email-list">
        {emails.map((email) => (
          <div
            key={email.id}
            className={`email-item ${
              selected?.id === email.id ? 'selected' : ''
            }`}
            onClick={() => setSelected(email)}
          >
            <div className="email-meta">
              <span className="merchant">{email.merchant}</span>
              <span className="date">
                {new Date(email.date).toLocaleDateString()}
              </span>
            </div>
            <div className="email-subject">{email.subject}</div>
            <div className="email-snippet">{email.snippet}</div>
          </div>
        ))}
      </div>

      {/* Email Preview */}
      <div className="email-preview">
        {selected ? (
          selected.html ? (
            <div
              className="email-html"
              dangerouslySetInnerHTML={{ __html: selected.html }}
            />
          ) : (
            <p>No HTML content found.</p>
          )
        ) : (
          <div className="empty-preview">Select an email to preview</div>
        )}
      </div>
    </div>
  )
}
