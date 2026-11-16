'use client';

/* eslint-disable @next/next/no-img-element -- previews can be data:/blob:/CDN URLs */
import { ArrowLeftOutlined, ArrowRightOutlined, DeleteOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button } from 'antd';
import { useRef, useState } from 'react';
import { imageSrc } from '@/components/common/Thumb';
import { getErrorMessage } from '@/lib/api/errors';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_MB } from '@/lib/utils';
import { productService } from '@/services';

const MAX_IMAGES = 8;

/** Controlled by antd Form.Item (value/onChange). First image is the cover. */
export function ImageUploader({
  value = [],
  onChange,
  disabled,
}: {
  value?: string[];
  onChange?: (v: string[]) => void;
  disabled?: boolean;
}) {
  const { message } = App.useApp();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_IMAGES - value.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) message.warning(`You can add up to ${MAX_IMAGES} images.`);

    const valid = picked.filter((f) => {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        message.error(`${f.name}: only JPG, PNG or WebP images are allowed.`);
        return false;
      }
      if (f.size > MAX_IMAGE_MB * 1024 * 1024) {
        message.error(`${f.name}: larger than ${MAX_IMAGE_MB} MB.`);
        return false;
      }
      return true;
    });

    setUploading(valid.length);
    const urls: string[] = [];
    for (const f of valid) {
      try {
        urls.push(await productService.uploadImage(f));
      } catch (e) {
        message.error(`${f.name}: ${getErrorMessage(e)}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (urls.length) onChange?.([...value, ...urls]);
    if (input.current) input.current.value = '';
  };

  const move = (i: number, dir: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange?.(next);
  };

  return (
    <div className="img-grid">
      {value.map((src, i) => (
        <div className="img-tile" key={`${i}-${src.slice(-24)}`}>
          <img src={imageSrc(src)} alt={`Product image ${i + 1}`} />
          {i === 0 && <span className="img-tile__badge">COVER</span>}
          {!disabled && (
            <div className="img-tile__actions">
              <Button size="small" type="text" icon={<ArrowLeftOutlined style={{ color: '#fff' }} />} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move left" />
              <Button size="small" type="text" icon={<DeleteOutlined style={{ color: '#fff' }} />} onClick={() => onChange?.(value.filter((_, k) => k !== i))} aria-label="Remove image" />
              <Button size="small" type="text" icon={<ArrowRightOutlined style={{ color: '#fff' }} />} disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move right" />
            </div>
          )}
        </div>
      ))}
      {!disabled && value.length < MAX_IMAGES && (
        <button type="button" className="img-upload" onClick={() => input.current?.click()} disabled={uploading > 0}>
          <span>
            {uploading ? <LoadingOutlined style={{ fontSize: 20 }} /> : <PlusOutlined style={{ fontSize: 20 }} />}
            <div style={{ marginTop: 6 }}>{uploading ? 'Uploading…' : 'Add images'}</div>
          </span>
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        multiple
        style={{ display: 'none' }}
        tabIndex={-1}
        aria-hidden
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  );
}
