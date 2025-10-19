import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

function isNonTextualPage() {
  try {
    const host = location.hostname.toLowerCase();
    const videoHosts = ['youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com', 'tiktok.com'];
    if (videoHosts.some(v => host.includes(v))) return true;
    const ogType = document.querySelector('meta[property="og:type"]')?.getAttribute('content') || '';
    if (ogType.toLowerCase().includes('video')) return true;
    if (document.querySelector('video, #player, .video')) return true;
  } catch (_) {}
  return false;
}

function getBestLastModified() {
  // 1) article:modified_time or og:updated_time
  const metaModified = document.querySelector('meta[property="article:modified_time"], meta[property="og:updated_time"]')?.getAttribute('content');
  if (metaModified) {
    const d = new Date(metaModified);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  // 2) document.lastModified
  if (document.lastModified) {
    const d = new Date(document.lastModified);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  // 3) no reliable info
  return null;
}

function extractMarkdown() {
  const cloned = document.cloneNode(true);
  const article = new Readability(cloned).parse();
  if (!article) return { markdown: null, title: document.title || '', description: null };

  const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  // Convert images to links instead of inline images, and iframes to links
  turndown.addRule('imageToLink', {
    filter: 'img',
    replacement: function (content, node) {
      const alt = node.getAttribute('alt') || 'image';
      const src = node.getAttribute('src');
      return src ? `[${alt}](${src})` : '';
    }
  });
  turndown.addRule('iframeToLink', {
    filter: 'iframe',
    replacement: function (content, node) {
      const src = node.getAttribute('src');
      return src ? `[Embedded content](${src})` : '';
    }
  });

  const markdown = turndown.turndown(article.content);
  return { markdown, title: article.title || document.title || '', description: null };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractArticle') {
    try {
      const nonTextual = isNonTextualPage();
      let payload = {
        nonTextual,
        url: location.href,
        title: document.title || '',
        description: null,
        lastModified: getBestLastModified(),
        markdown: null
      };
      if (!nonTextual) {
        const extract = extractMarkdown();
        payload = { ...payload, ...extract };
      }
      sendResponse({ success: true, data: payload });
    } catch (e) {
      sendResponse({ success: false, error: e.message });
    }
    return true; // async response
  }
});
