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
  { key: 'nose_synthesis', label: '鼻综合（鼻尖/鼻梁/鼻翼整体协调）', desc: '更立体、更精致，但比例自然不夸张。' },
  { key: 'alar_reduction', label: '鼻翼缩小（鼻翼/鼻孔更精致）', desc: '鼻翼更收拢、鼻孔形态更秀气。' },
  { key: 'eye_comprehensive', label: '双眼皮/眼综合（上睑更精神）', desc: '上眼睑形态更精神自然，不做夸张网红款。' },
  { key: 'eye_bags', label: '去眼袋/泪沟改善（下睑年轻化）', desc: '改善眼袋/泪沟与疲惫感，但保留真实质感。' },
  { key: 'midface_filler', label: '中面填充/法令纹改善（玻尿酸/脂肪取向）', desc: '面中更饱满协调，法令纹更淡但自然。' },
  { key: 'botox', label: '瘦脸/除皱肉毒（下颌缘更干净、动态纹更淡）', desc: '轮廓更利落，表情自然不僵硬。' },
  { key: 'contour_lift', label: '下颌缘清晰/轮廓提升（不改身份、不网红脸）', desc: '下颌缘更清晰，整体更紧致但克制。' },
  { key: 'chin_aug', label: '隆下巴（更立体但克制）', desc: '下巴更精致、更协调，不做夸张兜翘。' },
  { key: 'lip', label: '丰唇/唇形调整（自然，不夸张）', desc: '唇形更好看、唇色更自然，不做夸张丰唇。' },
  { key: 'skin', label: '皮肤综合（更细腻但不磨皮）', desc: '肤质更干净、瑕疵更少，但保留毛孔纹理。' },
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
  const [selectedParts, setSelectedParts] = useState<string[]>(['skin', 'eye_comprehensive', 'eye_bags', 'contour_lift']);
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
          <div className={styles.subTitle}>上传术前照 + 选择项目类型，一键生成更自然的术后效果图</div>
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
              <Sparkles size={16} /> 选择项目类型（可多选）
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
                已选 {selectedCount} 项；本次预计消耗 {expectedCost} 积分（1K=10，2K=15）
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
