'use client';

import { useState } from 'react';
import FileUpload from '@/components/file-upload';
import DocumentList from '@/components/document-list';
import RagChat from '@/components/rag-chat';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Document Q&amp;A</h1>
        <p className="text-sm text-gray-500">Upload documents, then chat with your shared knowledge base.</p>
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-4 p-4 md:grid-cols-[300px_1fr] md:p-6">
        <div className="space-y-4">
          <FileUpload onUploaded={() => setRefreshKey((k) => k + 1)} />
          <DocumentList refreshKey={refreshKey} />
        </div>

        <div className="h-[70vh] md:h-full">
          <RagChat />
        </div>
      </main>
    </div>
  );
}
