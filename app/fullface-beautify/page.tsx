'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, RefreshCw, Sparkles, Upload } from 'lucide-react';
import styles from './fullface-beautify.module.scss';

type Resolution = '1k' | '2k';

type Part = {
  key: string;
  label: string;
  desc: string;
};

const PARTS: Part[] = [
  { key: 'skin', label: '皮肤质感', desc: '痘印/瑕疵更干净，但保留真实纹理。' },
  { key: 'eyes', label: '眼睛（神采）', desc: '眼神更有精神，克制自然。' },
  { key: 'underEye', label: '眼袋/泪沟/黑眼圈', desc: '轻度改善，但不“熨平”成假皮肤。' },
  { key: 'brows', label: '眉形/眉色', desc: '更利落协调，不要纹眉感。' },
  { key: 'nose', label: '鼻子', desc: '更立体精致，但比例自然。' },
  { key: 'lips', label: '嘴唇', desc: '唇形与唇色更好看，不夸张丰唇。' },
  { key: 'teeth', label: '牙齿/笑容', desc: '可见才处理，轻度更干净不“烤瓷牙”。' },
  { key: 'cheeks', label: '面颊/苹果肌', desc: '面中更协调，轻度淡法令纹。' },
  { key: 'jawline', label: '下颌缘/下巴', desc: '下颌线更清晰，但不重塑脸型。' },
  { key: 'forehead', label: '额头', desc: '更平整饱满，不动发际线。' },
];

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function compressImageToJpegDataUrl(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxSide = 1280;
      let w = img.width;
      let h = img.height;
      if (w > h && w > maxSide) {
        h = Math.round((h * maxSide) / w);
        w = maxSide;
      } else if (h >= w && h > maxSide) {
        w = Math.round((w * maxSide) / h);
        h = maxSide;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('canvas not supported'));
      ctx.drawImage(img, 0, 0, w, h);

      const out = canvas.toDataURL('image/jpeg', 0.86);
      resolve(out);
    };
    img.onerror = () => reject(new Error('invalid image'));
    img.src = dataUrl;
  });
}

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

export default function FullfaceBeautifyPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedParts, setSelectedParts] = useState<string[]>(['skin', 'eyes', 'underEye', 'jawline']);
  const [resolution, setResolution] = useState<Resolution>('1k');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resultDataUrl, setResultDataUrl] = useState<string | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const previewUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);
  const selectedCount = selectedParts.length;
  const expectedCost = resolution === '2k' ? 15 : 10;

  const togglePart = (key: string) => {
    setSelectedParts((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      return uniq([...prev, key]);
    });
  };

  const handleGenerate = async () => {
    setError(null);
    setResultDataUrl(null);
    setCost(null);
    setRemaining(null);

    if (!imageFile) {
      setError('请先上传一张术前照片');
      return;
    }
    if (selectedParts.length === 0) {
      setError('请至少选择 1 个需要优化的部位');
      return;
    }

    setSubmitting(true);
    try {
      const imageDataUrl = await compressImageToJpegDataUrl(imageFile);

      const res = await fetch('/api/fullface-beautify/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl,
          parts: selectedParts,
          resolution,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || '生成失败');
      }

      setResultDataUrl(data.imageDataUrl || null);
      setCost(typeof data.cost === 'number' ? data.cost : null);
      setRemaining(typeof data.remaining_points === 'number' ? data.remaining_points : null);
    } catch (e: any) {
      setError(e?.message || '生成失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!resultDataUrl) return;
    const a = document.createElement('a');
    a.href = resultDataUrl;
    a.download = `全脸变美_${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setImageFile(null);
    setResultDataUrl(null);
    setError(null);
    setCost(null);
    setRemaining(null);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.backBtn}>
          <ArrowLeft size={18} /> 返回工具列表
        </Link>
        <div className={styles.headerRight}>
          <div className={styles.title}>全脸变美</div>
          <div className={styles.subTitle}>上传术前照 + 选择部位，一键生成更自然的术后美化图</div>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardTitle}>
              <Upload size={16} /> 上传术前照片
            </div>

            <div className={styles.uploadBox}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setImageFile(f);
                  setResultDataUrl(null);
                }}
              />
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.previewImg} src={previewUrl} alt="preview" />
              )}
              <div className={styles.hint}>建议：正面/45度、光线均匀、脸部清晰（避免强滤镜）。</div>
            </div>

            <div className={styles.notice}>
              <strong>说明：</strong>本工具是 AI 视觉模拟，仅用于审美沟通与方案参考。
              <br />
              <strong>原则：</strong>必须是同一个人，保持原表情/光线/背景，不做“网红脸”。
            </div>

            {error && <div className={styles.error}>{error}</div>}
          </section>

          <section className={styles.card}>
            <div className={styles.cardTitle}>
              <Sparkles size={16} /> 选择需要优化的部位（可多选）
            </div>

            <div className={styles.partGrid}>
              {PARTS.map((p) => {
                const checked = selectedParts.includes(p.key);
                return (
                  <label key={p.key} className={styles.partItem}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePart(p.key)}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div className={styles.partLabel}>{p.label}</div>
                      <div className={styles.partDesc}>{p.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className={styles.resRow}>
              <button
                className={`${styles.pill} ${resolution === '1k' ? styles.pillActive : ''}`}
                onClick={() => setResolution('1k')}
                type="button"
              >
                1K（10积分）
              </button>
              <button
                className={`${styles.pill} ${resolution === '2k' ? styles.pillActive : ''}`}
                onClick={() => setResolution('2k')}
                type="button"
              >
                2K（15积分）
              </button>
              <div className={styles.hint}>
                已选 {selectedCount} 项；本次预计消耗 {expectedCost} 积分
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.secondaryBtn} type="button" onClick={handleReset} disabled={submitting}>
                <RefreshCw size={16} className={submitting ? styles.spin : ''} /> 重置
              </button>
              <button className={styles.primaryBtn} type="button" onClick={handleGenerate} disabled={submitting}>
                <Sparkles size={16} className={submitting ? styles.spin : ''} /> {submitting ? '生成中...' : '开始生成'}
              </button>
            </div>
          </section>
        </div>

        <section className={styles.card}>
          <div className={styles.cardTitle}>
            <Download size={16} /> 生成结果
          </div>

          {resultDataUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.resultImg} src={resultDataUrl} alt="result" />
              <div className={styles.resultMeta}>
                <span>消耗：{cost ?? '-'} 积分</span>
                <span>剩余：{remaining ?? '-'} 积分</span>
                <span>分辨率：{resolution.toUpperCase()}</span>
              </div>
              <div className={styles.actions}>
                <button className={styles.primaryBtn} type="button" onClick={handleDownload}>
                  <Download size={16} /> 下载图片
                </button>
              </div>
            </>
          ) : (
            <div className={styles.hint}>还没有结果。上传照片并选择部位后点击“开始生成”。</div>
          )}
        </section>
      </div>
    </main>
  );
}
