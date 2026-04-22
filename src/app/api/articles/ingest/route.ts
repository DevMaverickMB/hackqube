import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * RSS + NewsAPI ingestion endpoint.
 * Protected by a shared secret (CRON_SECRET) — meant to be called by a cron job.
 * 
 * Fetches AI-focused articles from RSS feeds and optionally from NewsAPI,
 * deduplicates by URL, and stores them.
 */

const RSS_FEEDS = [
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { name: "MIT Tech Review AI", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed" },
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml" },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/" },
];

/** Keywords that must appear in the title or description for an article to be ingested */
const AI_KEYWORDS = /\b(ai|artificial intelligence|machine learning|deep learning|llm|large language model|gpt|generative ai|neural network|chatbot|copilot|openai|anthropic|gemini|claude|diffusion|transformer|nlp|computer vision|reinforcement learning|agi|foundation model)\b/i;

interface RssItem {
  title: string;
  link: string;
  description: string | null;
  imageUrl: string | null;
  sourceName: string;
}

export async function GET(req: Request) {
  return handleIngest(req);
}

export async function POST(req: Request) {
  return handleIngest(req);
}

async function handleIngest(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { rss: number; newsapi: number; errors: string[] } = { rss: 0, newsapi: 0, errors: [] };

  // --- RSS Feeds ---
  for (const feed of RSS_FEEDS) {
    try {
      const items = await parseRssFeed(feed.url, feed.name);
      for (const item of items.slice(0, 10)) {
        // Skip articles that don't match AI keywords
        const text = `${item.title} ${item.description || ""}`;
        if (!AI_KEYWORDS.test(text)) continue;

        const exists = await prisma.sharedArticle.findFirst({ where: { url: item.link } });
        if (!exists) {
          await prisma.sharedArticle.create({
            data: {
              url: item.link,
              title: item.title,
              description: item.description,
              imageUrl: item.imageUrl,
              source: "rss",
              sourceName: item.sourceName,
            },
          });
          results.rss++;
        }
      }
    } catch (e) {
      results.errors.push(`RSS ${feed.name}: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  }

  // --- NewsAPI ---
  const newsApiKey = process.env.NEWS_API_KEY;
  if (newsApiKey) {
    try {
      const newsRes = await fetch(
        `https://newsapi.org/v2/everything?q=%22artificial+intelligence%22+OR+%22machine+learning%22+OR+%22generative+AI%22+OR+%22LLM%22&language=en&sortBy=publishedAt&pageSize=10&apiKey=${encodeURIComponent(newsApiKey)}`,
        { headers: { "User-Agent": "HackQubeBot/1.0" } }
      );
      if (newsRes.ok) {
        const data = await newsRes.json();
        for (const article of data.articles || []) {
          if (!article.url || article.url === "https://removed.com") continue;
          const exists = await prisma.sharedArticle.findFirst({ where: { url: article.url } });
          if (!exists) {
            await prisma.sharedArticle.create({
              data: {
                url: article.url,
                title: article.title || "Untitled",
                description: article.description || null,
                imageUrl: article.urlToImage || null,
                source: "newsapi",
                sourceName: article.source?.name || "NewsAPI",
              },
            });
            results.newsapi++;
          }
        }
      }
    } catch (e) {
      results.errors.push(`NewsAPI: ${e instanceof Error ? e.message : "unknown error"}`);
    }
  }

  return NextResponse.json({
    message: "Ingestion complete",
    added: { rss: results.rss, newsapi: results.newsapi },
    errors: results.errors,
  });
}

async function parseRssFeed(feedUrl: string, sourceName: string): Promise<RssItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const res = await fetch(feedUrl, {
    signal: controller.signal,
    headers: { "User-Agent": "HackQubeBot/1.0", Accept: "application/rss+xml, application/xml, text/xml" },
  });
  clearTimeout(timeout);

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const xml = await res.text();
  const items: RssItem[] = [];

  // Simple regex-based XML parsing (no dependency needed)
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractXmlTag(itemXml, "title");
    const link = extractXmlTag(itemXml, "link");
    const description = extractXmlTag(itemXml, "description");
    const imageUrl =
      extractXmlAttr(itemXml, "media:content", "url") ||
      extractXmlAttr(itemXml, "enclosure", "url") ||
      null;

    if (title && link) {
      items.push({
        title: stripCdata(title),
        link: stripCdata(link).trim(),
        description: description ? stripHtml(stripCdata(description)).slice(0, 500) : null,
        imageUrl,
        sourceName,
      });
    }
  }

  return items;
}

function extractXmlTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function extractXmlAttr(xml: string, tag: string, attr: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']*)["']`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function stripCdata(str: string): string {
  return str.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
