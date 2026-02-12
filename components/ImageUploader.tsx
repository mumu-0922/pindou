'use client';
import { useCallback, useState } from 'react';

interface Props {
  onImageSelected: (file: File) => void;
}

export default function ImageUploader({ onImageSelected }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setPreview(URL.createObjectURL(file));
    onImageSelected(file);
  }, [onImageSelected]);

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
      onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = () => { if (input.files?.[0]) handleFile(input.files[0]); }; input.click(); }}
    >
      {preview ? (
        <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded" />
      ) : (
        <div>
          <p className="text-lg font-medium text-gray-600">拖拽图片到此处，或点击上传</p>
          <p className="text-sm text-gray-400 mt-2">支持 PNG / JPG / WebP</p>
        </div>
      )}
    </div>
  );
}
