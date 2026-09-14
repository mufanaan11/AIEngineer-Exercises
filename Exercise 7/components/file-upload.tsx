'use client';

import { useRef, useState } from 'react';
import { UploadCloud, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onUploaded: () => void;
}

type Status = { kind: 'idle' } | { kind: 'uploading' } | { kind: 'success'; message: string } | { kind: 'error'; message: string };

export default function FileUpload({ onUploaded }: FileUploadProps) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setStatus({ kind: 'uploading' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', { method: 'POST', body: formData });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Upload failed');
      }

      const data = await response.json();
      setStatus({ kind: 'success', message: `Indexed ${data.chunkCount} chunk(s) from ${data.filename}` });
      onUploaded();
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Upload failed' });
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        className="hidden"
        id="file-upload-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        disabled={status.kind === 'uploading'}
      />
      <label
        htmlFor="file-upload-input"
        className="flex cursor-pointer flex-col items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        {status.kind === 'uploading' ? (
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        ) : (
          <UploadCloud className="h-8 w-8 text-indigo-500" />
        )}
        <span className="text-sm font-medium">
          {status.kind === 'uploading' ? 'Uploading and indexing...' : 'Click to upload a document'}
        </span>
        <span className="text-xs text-gray-400">PDF, Word, TXT, or Markdown</span>
      </label>

      {status.kind === 'success' && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          {status.message}
        </p>
      )}
      {status.kind === 'error' && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {status.message}
        </p>
      )}
    </div>
  );
}
