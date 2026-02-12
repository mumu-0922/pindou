'use client';
import { useCallback, useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface Props {
  onImageSelected: (file: File) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function ImageUploader({ onImageSelected }: Props) {
  const { t } = useI18n();
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ name: string; w: number; h: number; size: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    const img = new Image();
    img.onload = () => setMeta({ name: file.name, w: img.naturalWidth, h: img.naturalHeight, size: file.size });
    img.src = url;
    onImageSelected(file);
  }, [onImageSelected]);

  const openPicker = () => {
    if (inputRef.current) { inputRef.current.value = ''; inputRef.current.click(); }
  };

  return (
    <div className="card-premium overflow-hidden">
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

      {preview && meta ? (
        <div className="flex flex-col sm:flex-row gap-4 p-4">
          <div className="relative group shrink-0">
            <img src={preview} alt="Preview"
              className="w-full sm:w-48 h-36 object-cover rounded-lg shadow-sm" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <button onClick={openPicker}
                className="px-3 py-1.5 bg-white text-gray-800 rounded-lg text-sm font-medium shadow hover:bg-gray-100">
                {t('upload.change')}
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-2 min-w-0">
            <p className="font-medium text-sm truncate" title={meta.name}>{meta.name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{t('upload.size')}: {meta.w}×{meta.h}px</span>
              <span>{t('upload.fileSize')}: {formatSize(meta.size)}</span>
            </div>
            <button onClick={openPicker}
              className="mt-1 self-start px-4 py-1.5 rounded-lg text-sm font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60 transition-colors">
              {t('upload.change')}
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`p-10 text-center cursor-pointer transition-all border-2 border-dashed rounded-2xl m-1 ${
            dragOver
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
              : 'border-gray-300 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onClick={openPicker}
        >
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/40 text-3xl">📷</div>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300">{t('upload.drag')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">{t('upload.formats')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
