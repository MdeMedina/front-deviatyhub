import React from 'react'

export default function ConversationsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Conversations</h2>
      <p className="text-gray-600 mb-6">Manage your patient conversations here.</p>
      <div className="grid grid-cols-1 gap-4">
        <div className="p-4 bg-white rounded shadow h-32 border border-dashed flex items-center justify-center text-gray-400">
          No active conversations
        </div>
      </div>
    </div>
  )
}
