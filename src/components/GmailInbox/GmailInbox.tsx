// components/GmailInbox.tsx
'use client'
import { useState, useEffect } from 'react'

export default function GmailInbox() {
  const [emails, setEmails] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<any>(null)

  const fetchEmailDetails = async (emailId: string) => {
    try {
      const response = await fetch(`/api/gmail/details?id=${emailId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch email details')
      }
      const data = await response.json()
      setSelectedEmail(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch details')
    }
  }

  const fetchEmails = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/gmail')
      if (!response.ok) {
        throw new Error('Failed to fetch emails')
      }
      const data = await response.json()
      console.log('data')
      setEmails(data.messages || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch emails')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmails()
  }, [])

  if (loading) return <div className="p-4">Loading emails...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Your Gmail Inbox</h1>
      <button
        onClick={fetchEmails}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Refreshing...' : 'Refresh Emails'}
      </button>

      <div className="space-y-3">
        {emails.length === 0 ? (
          <p>No emails found</p>
        ) : (
          emails.map((email: any) => {
            // console.log('email', email)
            return (
              <div
                key={email.id}
                className="p-3 border rounded-lg hover:bg-gray-50"
              >
                <p className="font-medium">ID: {email.id}</p>
                <p className="text-sm text-gray-600">
                  {new Date(parseInt(email.internalDate)).toLocaleString()}
                </p>
                <button
                  onClick={() => fetchEmailDetails(email.id)}
                  className="mt-2 text-sm text-blue-500 hover:underline"
                >
                  View details
                </button>
              </div>
            )
          })
        )}
      </div>
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold mb-2">{selectedEmail.subject}</h2>
            <div className="flex justify-between text-sm text-gray-600 mb-4">
              <p>From: {selectedEmail.from}</p>
              <p>Date: {selectedEmail.date}</p>
            </div>
            <p className="whitespace-pre-line">{selectedEmail.snippet}</p>
            <button
              onClick={() => setSelectedEmail(null)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
