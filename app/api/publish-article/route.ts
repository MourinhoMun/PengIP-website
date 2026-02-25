import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const PUBLISH_TOKEN = process.env.PUBLISH_API_TOKEN;
const BASE_URL = 'https://pengip.com';

// 将标题转为 URL slug
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[\s\u4e00-\u9fa5]+/g, '-')   // 中文和空格 → -
    .replace(/[^a-z0-9-]/g, '')             // 去掉其他特殊字符
    .replace(/-+/g, '-')                    // 合并多个 -
    .replace(/^-|-$/g, '')                  // 去掉首尾 -
    .slice(0, 80);
}

function generateSlug(title: string): string {
  const base = toSlug(title);
  const ts = Date.now().toString(36);
  return base ? `${base}-${ts}` : ts;
}

// 更新 sitemap.xml
async function updateSitemap(newUrl: string, publishedAt: string) {
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  const today = publishedAt.split('T')[0];

  const newEntry = `  <url>
    <loc>${newUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;

  if (existsSync(sitemapPath)) {
    const existing = await readFile(sitemapPath, 'utf-8');
    if (existing.includes('</urlset>')) {
      const updated = existing.replace('</urlset>', `${newEntry}\n</urlset>`);
      await writeFile(sitemapPath, updated, 'utf-8');
      return;
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${newEntry}
</urlset>`;
  await writeFile(sitemapPath, sitemap, 'utf-8');
}

export async function POST(request: NextRequest) {
  // 1. 验证 token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
  }
  const token = authHeader.split(' ')[1];
  if (!PUBLISH_TOKEN || token !== PUBLISH_TOKEN) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
  }

  // 2. 解析请求体
  let body: {
    title?: string;
    content?: string;
    excerpt?: string;
    tags?: string[];
    lang?: string;
    city?: string;
    hospital?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { title, content, excerpt = '', tags = [], lang = 'zh', city = '', hospital = '' } = body;

  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
  }

  // 3. 生成 slug
  const slug = generateSlug(title);
  const publishedAt = new Date().toISOString();
  const articleUrl = `${BASE_URL}/articles/${slug}`;

  // 4. 保存文章数据为 JSON 文件
  const dataDir = path.join(process.cwd(), 'articles-data');
  await mkdir(dataDir, { recursive: true });

  const articleData = { title, content, excerpt, tags, lang, city, hospital, slug, publishedAt, url: articleUrl };
  await writeFile(path.join(dataDir, `${slug}.json`), JSON.stringify(articleData, null, 2), 'utf-8');

  // 5. 更新 sitemap.xml
  await updateSitemap(articleUrl, publishedAt);

  return NextResponse.json({
    success: true,
    url: articleUrl,
    slug,
    publishedAt,
  }, { status: 201 });
}
