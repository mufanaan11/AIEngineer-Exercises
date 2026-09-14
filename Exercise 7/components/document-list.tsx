'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';

interface UploadedFile {
  filename: string;
  chunkCount: number;
  uploadedAt: string;
}

export default function DocumentList({ refreshKey }: { refreshKey: number }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/files')
      .then((res) => res.json())
      .then((data) => setFiles(data.files ?? []))
      .finally(() => setLoaded(true));
  }, [refreshKey]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Knowledge base</h2>

      {!loaded && <p className="text-sm text-gray-400">Loading...</p>}

      {loaded && files.length === 0 && (
        <p className="text-sm text-gray-400">No documents uploaded yet.</p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li key={`${file.filename}-${i}`} className="flex items-start gap-2 text-sm">
              <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" />
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-800">{file.filename}</p>
                <p className="text-xs text-gray-400">{file.chunkCount} chunk(s)</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
