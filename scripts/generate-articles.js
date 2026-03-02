#!/usr/bin/env node
/**
 * Auto Article Generator — pengip.com
 * Uses yunwu.ai (OpenAI-compatible) to generate SEO-optimized English articles
 * Cron: 8:00 AM (5 articles) + 2:00 PM (5 articles) Asia/Shanghai
 */

const https = require('https');
const { URL } = require('url');

const YUNWU_KEY = 'sk-GOthcTYIVEdXznmrcdxs2CDV51lb9qalw5vMbSBxeFaQFG4f';
const YUNWU_URL = 'https://yunwu.ai/v1/chat/completions';
const MODEL = 'gpt-4o';
const PUBLISH_TOKEN = '1f4e5031435de154b78932eaff4566440458ccfa6167a0f00011c9ad83747771';
const PUBLISH_URL = 'https://pengip.com/api/publish-article';

// ─── Topic pool ───────────────────────────────────────────────────────────────
// Balanced mix: how-to, best-of, case study, trend, FAQ
const TOPICS = [
  // How-to
  'How to Build a Doctor Personal Brand on Social Media in 2025',
  'How Doctors Can Start a YouTube Channel and Grow to 10K Subscribers',
  'How to Write SEO-Friendly Medical Blog Posts That Rank on Google',
  'How to Use LinkedIn to Establish Authority as a Physician',
  'How to Create a 30-Day Content Calendar for Busy Doctors',
  'How to Turn Patient FAQs Into High-Traffic Blog Content',
  'How to Repurpose One Medical Article Into 10 Pieces of Content',
  'How to Use Short-Form Video to Attract New Patients',
  'How to Build an Email List as a Doctor',
  'How to Collaborate With Health Brands as a Doctor Influencer',
  // Best-of / Tools
  'Best AI Writing Tools for Medical Professionals in 2025',
  'Best Social Media Platforms for Doctors: A Complete Comparison',
  'Top 7 Content Marketing Strategies for Medical Clinics',
  'Best Practices for Doctor Personal Branding in the Digital Age',
  'Top AI Tools That Help Doctors Save Time on Content Creation',
  // Trends
  'The Rise of Doctor Influencers: What It Means for Healthcare in 2025',
  'How AI Is Transforming Medical Content Creation',
  'Why Patients Trust Doctors Who Create Online Content',
  'The Future of Telemedicine and Digital Health Communication',
  'How Short Video Is Changing How Doctors Communicate With Patients',
  // Case study / deep dive
  'How One Doctor Grew 100K Followers by Sharing Medical Knowledge Online',
  'What Successful Doctor Influencers Have in Common',
  'Case Study: How a Clinic Used Content Marketing to Double New Patients',
  // FAQ / informational
  'What Is Doctor Personal Branding and Why Does It Matter',
  'Do Doctors Need a Personal Website? The Complete Answer',
  'Is It Safe for Doctors to Share Medical Advice Online',
  'What Content Should Doctors Post on Social Media',
  'How Often Should Doctors Post on Social Media',
  'Can Doctors Make Money From Content Creation',
  'What Is Medical SEO and How Can Doctors Benefit From It',
];

// ─── SEO Prompt Engineering ───────────────────────────────────────────────────
function buildPrompt(topic) {
  return `You are a senior medical content strategist and SEO expert. Your articles consistently rank on Google page 1 for competitive healthcare keywords.

Write a comprehensive, Google E-E-A-T optimized English article on this topic:
"${topic}"

TARGET AUDIENCE: Doctors, physicians, and medical professionals who want to build their personal brand online.
SITE CONTEXT: PengIP (pengip.com) — an AI toolkit platform for doctor personal branding in China and globally.

═══ SEO RULES (follow strictly) ═══

1. TITLE (50-60 chars)
   - Primary keyword near the start
   - Include a number or power word when natural (e.g. "7 Ways", "Complete Guide", "In 2025")

2. META DESCRIPTION (150-160 chars)
   - Include primary keyword
   - Clear benefit statement
   - Soft call-to-action

3. CONTENT STRUCTURE (900-1100 words total)
   - Intro paragraph: hook + primary keyword in first 100 words + preview of what reader will learn
   - 4-5 H2 sections, each with 1-2 H3 sub-points
   - Each section: specific, actionable, no fluff
   - Stats & data: use real-sounding specifics ("a 2024 study found...", "doctors who post weekly see 3x more...")
   - Conclusion: summarize key points + CTA to explore AI tools at pengip.com

4. KEYWORD STRATEGY
   - Primary keyword: use 3-5 times naturally
   - LSI keywords: weave in related terms (e.g. for "doctor branding": physician marketing, medical content, healthcare social media)
   - Question keywords: include 1-2 H2s phrased as questions (e.g. "Why Do Doctors Need a Personal Brand?")

5. READABILITY
   - Short paragraphs (3-4 sentences max)
   - Use <strong> for key terms on first mention
   - Use <ul>/<li> for lists of 3+ items
   - Use <blockquote> for key insights or quotes
   - Flesch reading score target: 60-70 (clear, professional)

6. E-E-A-T SIGNALS
   - Write from experience ("In practice...", "Doctors who have done this report...")
   - Cite specific platforms, tools, or studies by name
   - Acknowledge nuance ("While results vary...", "This works best when...")

═══ OUTPUT FORMAT ═══
Respond with ONLY valid JSON, no markdown wrapper:
{
  "title": "...",
  "excerpt": "...(your meta description, 150-160 chars)",
  "tags": ["primary-keyword", "secondary-keyword", "tertiary-keyword"],
  "content": "...full HTML using only h2, h3, p, ul, li, strong, blockquote tags..."
}`;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function postJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + (u.search || ''),
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers },
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({ _raw: raw }); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function generateArticle(topic) {
  const res = await postJson(YUNWU_URL, { Authorization: `Bearer ${YUNWU_KEY}` }, {
    model: MODEL,
    max_tokens: 2500,
    temperature: 0.7,
    messages: [{ role: 'user', content: buildPrompt(topic) }],
  });

  const text = res.choices?.[0]?.message?.content || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in response: ' + text.slice(0, 200));
  return JSON.parse(match[0]);
}

async function publishArticle(article) {
  return postJson(PUBLISH_URL, { Authorization: `Bearer ${PUBLISH_TOKEN}` }, {
    ...article,
    lang: 'en',
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function pickTopics(count) {
  const shuffled = [...TOPICS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const count = parseInt(process.argv[2] || '5', 10);
  const topics = pickTopics(count);
  console.log(`[${new Date().toISOString()}] Generating ${count} articles with yunwu/${MODEL}...`);

  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    console.log(`\n[${i + 1}/${count}] ${topic}`);
    try {
      const article = await generateArticle(topic);
      console.log(`  ✓ Generated: "${article.title}"`);
      const result = await publishArticle(article);
      if (result.success) {
        console.log(`  ✓ Published: ${result.url}`);
      } else {
        console.error(`  ✗ Publish failed:`, JSON.stringify(result));
      }
    } catch (err) {
      console.error(`  ✗ Error:`, err.message);
    }
    if (i < topics.length - 1) await sleep(2000);
  }

  console.log(`\n[${new Date().toISOString()}] Done.`);
}

main().catch(console.error);
