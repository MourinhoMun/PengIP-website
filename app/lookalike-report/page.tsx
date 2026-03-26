'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, RefreshCw, Sparkles, Upload } from 'lucide-react';
import styles from './lookalike-report.module.scss';

type FaceProfileSection = {
  title: string;
  items: string[];
};

type ImageRef = {
  thumbUrl: string;
  sourceUrl: string;
  sourceDomain: string;
};

type Match = {
  name: string;
  similarityPercent: number;
  reasons: string[];
  images?: ImageRef[];
};

type Report = {
  summary: string;
  faceProfile: FaceProfileSection[];
  matches: Match[];
};

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

export default function LookalikeReportPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [topN, setTopN] = useState<number>(3);
  const [agreed, setAgreed] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [report, setReport] = useState<Report | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const previewUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);

  const handleAnalyze = async () => {
    setError(null);
    setReport(null);
    setCost(null);
    setRemaining(null);

    if (!imageFile) {
      setError('请先上传一张正脸照片');
      return;
    }
    if (!agreed) {
      setError('请先勾选合规声明');
      return;
    }

    setSubmitting(true);
    try {
      const imageDataUrl = await compressImageToJpegDataUrl(imageFile);

      const res = await fetch('/api/starface-report/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl, topN }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || '分析失败');
      }

      setReport(data.report || null);
      setCost(typeof data.cost === 'number' ? data.cost : null);
      setRemaining(typeof data.remaining_points === 'number' ? data.remaining_points : null);
    } catch (e: any) {
      setError(e?.message || '分析失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setReport(null);
    setError(null);
    setCost(null);
    setRemaining(null);
  };

  const handleCopy = async () => {
    if (!report) return;

    const lines: string[] = [];
    lines.push(report.summary || '');
    lines.push('');

    for (const sec of report.faceProfile || []) {
      if (!sec?.title) continue;
      lines.push(`【${sec.title}】`);
      for (const it of sec.items || []) lines.push(`- ${it}`);
      lines.push('');
    }

    lines.push('【相似明星】');
    for (const m of report.matches || []) {
      lines.push(`${m.name}（相似度 ${m.similarityPercent}%）`);
      for (const r of m.reasons || []) lines.push(`- ${r}`);
      lines.push('');
    }

    lines.push('免责声明：仅供娱乐与内容创作参考，不构成任何身份鉴定或专业结论。');

    await navigator.clipboard.writeText(lines.join('\n').trim());
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.backBtn}>
          <ArrowLeft size={18} /> 返回工具列表
        </Link>
        <div className={styles.headerRight}>
          <div className={styles.title}>相似明星分析（图文报告）</div>
          <div className={styles.subTitle}>上传 1 张正脸照，生成“特征画像 + 相似明星 TopN + 为什么像 + 配图参考”</div>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardTitle}>
              <Upload size={16} /> 上传照片
            </div>

            <div className={styles.uploadBox}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setImageFile(f);
                  setReport(null);
                }}
              />
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.previewImg} src={previewUrl} alt="preview" />
              )}
              <div className={styles.hint}>建议：正面、光线均匀、脸部清晰（避免强滤镜/遮挡）。</div>
            </div>

            <div className={styles.row}>
              <label style={{ fontSize: 12, color: 'rgba(229,231,235,0.78)' }}>输出明星数量</label>
              <select className={styles.select} value={topN} onChange={(e) => setTopN(Number(e.target.value))}>
                <option value={3}>Top 3（推荐）</option>
                <option value={5}>Top 5（更丰富）</option>
              </select>
            </div>

            <div className={styles.row}>
              <label className={styles.checkbox}>
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span>
                  我确认已获得照片授权，且不会用于欺骗性商业用途；本工具仅用于娱乐与内容创作参考。
                </span>
              </label>
            </div>

            <div className={styles.actions}>
              <button className={styles.secondaryBtn} onClick={handleReset} disabled={submitting}>
                <RefreshCw size={16} /> 重置
              </button>
              <button className={styles.primaryBtn} onClick={handleAnalyze} disabled={submitting}>
                <Sparkles size={16} className={submitting ? styles.spin : undefined} />
                {submitting ? '分析中...' : '开始分析'}
              </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.notice}>
              <strong>提示：</strong>输出是“相似明星”娱乐向参考，不构成身份识别或任何保证。
              <br />
              <strong>合规：</strong>禁止用于伪造背书、虚假宣传、诱导交易等带欺骗性质的用途。
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardTitle}>
              <Sparkles size={16} /> 图文分析报告
            </div>

            {!report && <div className={styles.hint}>右侧会生成一份可截图传播的图文报告。</div>}

            {report && (
              <>
                <div className={styles.summary}>{report.summary}</div>

                <div className={styles.section}>
                  <div className={styles.sectionTitle}>面部特征画像</div>
                  {(report.faceProfile || []).map((sec, idx) => (
                    <div key={idx} className={styles.section}>
                      <div className={styles.sectionTitle}>{sec.title}</div>
                      <div className={styles.chipList}>
                        {(sec.items || []).map((it, j) => (
                          <span key={j} className={styles.chip}>
                            {it}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.section}>
                  <div className={styles.sectionTitle}>相似明星</div>
                  {(report.matches || []).map((m, idx) => (
                    <div key={idx} className={styles.match}>
                      <div className={styles.matchHeader}>
                        <div className={styles.matchName}>{m.name}</div>
                        <div className={styles.matchPercent}>相似度 {m.similarityPercent}%</div>
                      </div>
                      <div className={styles.reasons}>
                        {(m.reasons || []).map((r, j) => (
                          <div key={j} className={styles.reasonItem}>
                            - {r}
                          </div>
                        ))}
                      </div>

                      {Array.isArray(m.images) && m.images.length > 0 && (
                        <div className={styles.images}>
                          {m.images.slice(0, 6).map((img, k) => (
                            <a key={k} href={img.sourceUrl} target="_blank" rel="noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img className={styles.thumb} src={img.thumbUrl} alt={m.name} />
                            </a>
                          ))}
                        </div>
                      )}
                      <div className={styles.source}>图片来源：公开网络（点击缩略图打开原始来源页）</div>
                    </div>
                  ))}
                </div>

                <div className={styles.actions}>
                  <button className={styles.secondaryBtn} onClick={handleCopy}>
                    <Copy size={16} /> 复制报告文案
                  </button>
                </div>

                <div className={styles.hint}>
                  {typeof cost === 'number' ? `本次消耗：${cost} 积分` : ''}
                  {typeof remaining === 'number' ? ` ｜ 当前余额：${remaining} 积分` : ''}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
