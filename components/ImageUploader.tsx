'use client';
import { useCallback, useState, useRef } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';

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

  const prevUrl = useRef<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (prevUrl.current) URL.revokeObjectURL(prevUrl.current);
    const url = URL.createObjectURL(file);
    prevUrl.current = url;
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
        <div className="flex flex-col sm:flex-row gap-4 p-5 bg-gradient-to-r from-pink-50 to-fuchsia-50 dark:from-pink-950/20 dark:to-fuchsia-950/20">
          <div className="relative group shrink-0">
            <img src={preview} alt="Preview"
              className="w-full sm:w-48 h-36 object-cover rounded-2xl shadow-md ring-2 ring-pink-200 dark:ring-pink-800" />
            <div className="absolute inset-0 bg-pink-500/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Button variant="secondary" size="sm" onClick={openPicker} className="rounded-full px-4">
                ✨ {t('upload.change')}
              </Button>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-2 min-w-0">
            <p className="font-medium text-sm truncate" title={meta.name}>🖼️ {meta.name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-pink-400 dark:text-pink-300">
              <span>📐 {t('upload.size')}: {meta.w}×{meta.h}px</span>
              <span>📦 {t('upload.fileSize')}: {formatSize(meta.size)}</span>
            </div>
            <Button variant="outline" size="sm" className="mt-1 self-start rounded-full border-pink-300 dark:border-pink-700 hover:bg-pink-50 dark:hover:bg-pink-950/30" onClick={openPicker}>
              🔄 {t('upload.change')}
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`p-12 text-center cursor-pointer transition-all border-2 border-dashed rounded-2xl m-1 relative overflow-hidden ${
            dragOver
              ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/30 scale-[1.01]'
              : 'border-pink-300 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600 hover:bg-pink-50/50 dark:hover:bg-pink-950/10'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          onClick={openPicker}
        >
          {/* 像素风装饰 */}
          <div className="absolute top-3 left-4 text-pink-200 dark:text-pink-900 text-xs select-none opacity-60">✦ ✧ ✦</div>
          <div className="absolute bottom-3 right-4 text-fuchsia-200 dark:text-fuchsia-900 text-xs select-none opacity-60">✧ ✦ ✧</div>
          <div className="absolute top-2 right-8 w-2 h-2 bg-pink-300 dark:bg-pink-800 rounded-sm rotate-45 opacity-40" />
          <div className="absolute bottom-4 left-10 w-1.5 h-1.5 bg-fuchsia-300 dark:bg-fuchsia-800 rounded-sm rotate-12 opacity-40" />
          <div className="space-y-4 relative">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-200 to-fuchsia-200 dark:from-pink-900/60 dark:to-fuchsia-900/60 text-4xl shadow-inner">
              📷
            </div>
            <p className="text-lg font-bold bg-gradient-to-r from-pink-500 to-fuchsia-500 bg-clip-text text-transparent">{t('upload.drag')}</p>
            <p className="text-sm text-pink-300 dark:text-pink-600">{t('upload.formats')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
