import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Load preloaded database
let db = {
  batches: [] as any[],
  subjects: {} as Record<string, any[]>,
  topics: {} as Record<string, any[]>,
  lectures: {} as Record<string, any[]>,
};

try {
  const dbPath = path.resolve(__dirname, 'src/data/preloaded_courses.json');
  if (fs.existsSync(dbPath)) {
    const raw = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    db.subjects = raw.subjects || {};
    db.topics = raw.topics || {};
    db.lectures = raw.lectures || {};
  }
  const batchesPath = path.resolve(__dirname, 'src/data/batches.json');
  if (fs.existsSync(batchesPath)) {
    const rawB = JSON.parse(fs.readFileSync(batchesPath, 'utf8'));
    db.batches = rawB.new || rawB;
  }
} catch (e) {
  console.error('[GB STUDY Server] Error loading local course cache:', e);
}

// Set SSL bypass for upstream CDN edge servers
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 1. Video Stream Proxy
app.get('/api/video', async (req: Request, res: Response) => {
  const rawUrl = req.query.url as string;
  if (!rawUrl) {
    return res.status(400).send('Missing url parameter');
  }

  // Helper to fetch video or playlist with authentic headers
  const fetchStream = async (targetUrl: string) => {
    return await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://appx-play.akamai.net.in/',
        'Origin': 'https://appx-play.akamai.net.in',
      },
    });
  };

  try {
    let upstreamRes: any = null;

    // First attempt: try direct fetch to target CDN URL with authentic Referer
    try {
      upstreamRes = await fetchStream(rawUrl);
    } catch (e) {
      // ignore and try proxy
    }

    // Second attempt: if direct fetch failed or returned non-200, try studybee /video proxy
    if (!upstreamRes || (!upstreamRes.ok && upstreamRes.status !== 206)) {
      try {
        const proxyTarget = `https://sachin.studybeepro.site/video?url=${encodeURIComponent(rawUrl)}`;
        const proxyRes = await fetch(proxyTarget, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://sachin.studybeepro.site/play.html',
          },
        });
        if (proxyRes.ok || proxyRes.status === 206) {
          upstreamRes = proxyRes;
        }
      } catch (e) {
        // ignore
      }
    }

    if (!upstreamRes || (!upstreamRes.ok && upstreamRes.status !== 206)) {
      return res.status(upstreamRes ? upstreamRes.status : 502).send('Upstream video error');
    }

    const contentType = upstreamRes.headers.get('content-type') || '';

    // If M3U8 Playlist: rewrite chunk URLs to local /api/video
    if (contentType.includes('mpegurl') || rawUrl.toLowerCase().includes('.m3u8')) {
      const text = await upstreamRes.text();
      const lines = text.split('\n');
      const rewrittenLines = lines.map((line: string) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;

        // If line is already a proxy link
        if (trimmed.includes('/video?url=')) {
          return trimmed.replace('/video?url=', '/api/video?url=');
        }

        // If line is an absolute URL
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          return `/api/video?url=${encodeURIComponent(trimmed)}`;
        }

        // If line is a relative URL, resolve against rawUrl base
        try {
          const resolved = new URL(trimmed, rawUrl).toString();
          return `/api/video?url=${encodeURIComponent(resolved)}`;
        } catch {
          return trimmed;
        }
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache');
      return res.send(rewrittenLines.join('\n'));
    }

    // Binary TS chunks or MP4
    res.setHeader('Content-Type', contentType || 'video/mp2t');
    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    const range = upstreamRes.headers.get('content-range');
    if (range) {
      res.setHeader('Content-Range', range);
    }

    const buffer = await upstreamRes.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('[GB STUDY Server] Error in /api/video proxy:', err.message);
    res.status(500).send('Video proxy failed: ' + err.message);
  }
});

// Support direct /video?url= and /mpd?url=
app.get('/video', async (req: Request, res: Response) => {
  const rawUrl = req.query.url as string;
  if (!rawUrl) return res.status(400).send('Missing url parameter');
  req.url = `/api/video?url=${encodeURIComponent(rawUrl)}`;
  return app._router.handle(req, res, () => {});
});

app.get('/mpd', async (req: Request, res: Response) => {
  const rawUrl = req.query.url as string;
  if (!rawUrl) return res.status(400).send('Missing url parameter');
  req.url = `/api/video?url=${encodeURIComponent(rawUrl)}`;
  return app._router.handle(req, res, () => {});
});

// 2. In-App PDF Stream Proxy
const handlePdfProxy = async (req: Request, res: Response) => {
  const rawUrl = req.query.url as string;
  if (!rawUrl) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    let upstreamRes: any = null;

    // Helper to fetch through sachin.studybeepro.site /pdf proxy
    const tryStudyBeePdf = async (targetUrl: string) => {
      return await fetch(`https://sachin.studybeepro.site/pdf?url=${encodeURIComponent(targetUrl)}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://sachin.studybeepro.site/content.html',
          'Accept': 'application/pdf,*/*',
        },
      });
    };

    // Helper to fetch directly
    const tryDirectPdf = async (targetUrl: string) => {
      return await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://sachin.studybeepro.site/',
        },
      });
    };

    // 1. First attempt: studybee /pdf proxy (authentic edge proxy)
    try {
      upstreamRes = await tryStudyBeePdf(rawUrl);
    } catch {}

    // 2. Second attempt: direct fetch if proxy failed or returned error
    if (!upstreamRes || (!upstreamRes.ok && upstreamRes.status !== 206)) {
      try {
        upstreamRes = await tryDirectPdf(rawUrl);
      } catch {}
    }

    // 3. Third attempt: if expired token (403/404), check if db.lectures has a fresher link for same file
    if (!upstreamRes || (!upstreamRes.ok && upstreamRes.status !== 206)) {
      try {
        const urlObj = new URL(rawUrl);
        const fileName = urlObj.pathname.split('/').pop() || '';
        if (fileName) {
          // Search in db.lectures for matching PDF filename with a different fresh signature
          for (const list of Object.values(db.lectures)) {
            const match = list.find((item: any) => {
              const itemUrl = item.pdf_link || item.file_link || '';
              return itemUrl.includes(fileName) && itemUrl !== rawUrl;
            });
            if (match) {
              const freshUrl = match.pdf_link || match.file_link;
              const retryRes = await tryStudyBeePdf(freshUrl);
              if (retryRes && (retryRes.ok || retryRes.status === 206)) {
                upstreamRes = retryRes;
                break;
              }
            }
          }
        }
      } catch {}
    }

    if (!upstreamRes || (!upstreamRes.ok && upstreamRes.status !== 206)) {
      return res.status(upstreamRes ? upstreamRes.status : 502).send('Could not fetch PDF from upstream');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="lecture_notes.pdf"');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.removeHeader('X-Frame-Options');

    const acceptRanges = upstreamRes.headers.get('accept-ranges');
    if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);

    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    const buffer = await upstreamRes.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('[GB STUDY Server] Error in /api/pdf proxy:', err.message);
    res.status(500).send('PDF proxy failed');
  }
};

app.get('/api/pdf', handlePdfProxy);
app.get('/pdf', handlePdfProxy);

// 3. Batches API
app.get('/api/batches', (req: Request, res: Response) => {
  res.json({ success: true, data: db.batches });
});

// 4. Subjects API with live-first + instant database fallback
app.get('/api/course/subjects', async (req: Request, res: Response) => {
  const courseId = req.query.courseid as string;
  if (!courseId) return res.status(400).json({ error: 'Missing courseid' });

  // 1. Try Live fetch first
  try {
    const live = await fetch(
      `https://sachin.studybeepro.site/get/allsubjectfrmlivecourseclass?courseid=${courseId}&start=-1`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://sachin.studybeepro.site/',
        },
      }
    );
    if (live.ok) {
      const j = await live.json();
      if (j.status === 200 && Array.isArray(j.data) && j.data.length > 0) {
        db.subjects[courseId] = j.data;
        return res.json(j);
      }
    }
  } catch (e) {
    console.warn(`[GB STUDY] Live subjects fetch failed for ${courseId}, checking cache:`, e);
  }

  // 2. If live failed, check preloaded database
  if (db.subjects[courseId] && db.subjects[courseId].length > 0) {
    return res.json({ status: 200, data: db.subjects[courseId] });
  }

  res.json({
    status: 200,
    data: [
      { subjectid: '1', subject_name: 'Complete Syllabus & Lectures', subject_logo: '', sortingparam: '1' },
    ],
  });
});

// 5. Topics API with live-first
app.get('/api/course/topics', async (req: Request, res: Response) => {
  const courseId = req.query.courseid as string;
  const subjectId = req.query.subjectid as string;
  const key = `${courseId}_${subjectId}`;

  // 1. Try Live fetch first
  try {
    const live = await fetch(
      `https://sachin.studybeepro.site/get/alltopicfrmlivecourseclass?courseid=${courseId}&subjectid=${subjectId}&start=-1`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://sachin.studybeepro.site/',
        },
      }
    );
    if (live.ok) {
      const j = await live.json();
      if (j.status === 200 && Array.isArray(j.data) && j.data.length > 0) {
        db.topics[key] = j.data;
        return res.json(j);
      }
    }
  } catch (e) {
    console.warn(`[GB STUDY] Live topics fetch failed for ${key}, checking cache:`, e);
  }

  // 2. Cache fallback
  if (db.topics[key] && db.topics[key].length > 0) {
    return res.json({ status: 200, data: db.topics[key] });
  }

  res.json({
    status: 200,
    data: [
      { topicid: '1', topic_name: 'Video Classes & Study Notes', topic_logo: '', sortingparam: 1 },
    ],
  });
});

// 6. Lectures API with live-first
app.get('/api/course/lectures', async (req: Request, res: Response) => {
  const courseId = req.query.courseid as string;
  const subjectId = req.query.subjectid as string;
  const topicId = req.query.topicid as string;
  const key = `${courseId}_${subjectId}_${topicId}`;

  // 1. Always attempt Live fetch first to get all real lectures
  try {
    const live = await fetch(
      `https://sachin.studybeepro.site/get/livecourseclassbycoursesubtopconceptapiv3?courseid=${courseId}&subjectid=${subjectId}&topicid=${topicId}&conceptid=&windowsapp=false&start=0`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://sachin.studybeepro.site/',
        },
      }
    );
    if (live.ok) {
      const j = await live.json();
      if (j.status === 200 && Array.isArray(j.data) && j.data.length > 0) {
        db.lectures[key] = j.data;
        return res.json(j);
      }
    }
  } catch (e) {
    console.warn(`[GB STUDY] Live lecture fetch failed for ${key}:`, e);
  }

  // 2. Fallback to exact cached key
  if (db.lectures[key] && db.lectures[key].length > 0) {
    return res.json({ status: 200, data: db.lectures[key] });
  }

  res.json({ status: 200, data: [] });
});

// 7. Video Details API (fetching authentic signed qualities)
app.get('/api/course/video-details', async (req: Request, res: Response) => {
  const courseId = req.query.course_id as string;
  const videoId = req.query.video_id as string;

  try {
    const live = await fetch(
      `https://sachin.studybeepro.site/get/fetchVideoDetailsById?course_id=${courseId}&video_id=${videoId}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://sachin.studybeepro.site/',
        },
      }
    );
    if (live.ok) {
      const j = await live.json();
      if (j && j.success) {
        return res.json(j);
      }
    }
  } catch (e) {
    console.warn(`[GB STUDY] Live video details failed for ${videoId}:`, e);
  }

  // Fallback: look for lecture in database
  let foundLecture: any = null;
  for (const lecs of Object.values(db.lectures)) {
    const match = lecs.find((l: any) => String(l.id) === String(videoId));
    if (match) {
      foundLecture = match;
      break;
    }
  }

  if (foundLecture) {
    return res.json({
      success: true,
      video_id: videoId,
      course_id: courseId,
      title: foundLecture.Title || foundLecture.title || 'Video Class',
      duration: foundLecture.duration,
      thumbnail: foundLecture.thumbnail,
      decoded_video_link: foundLecture.file_link,
      decoded_pdf_link: foundLecture.pdf_link,
      qualities: (foundLecture.download_links || []).map((dl: any) => ({
        quality: dl.quality || 'Auto',
        url: dl.path,
      })),
    });
  }

  res.status(404).json({ success: false, message: 'Video details not found' });
});

// Direct compatibility endpoints matching original website
app.get('/get/fetchVideoDetailsById', async (req: Request, res: Response) => {
  req.url = `/api/course/video-details?course_id=${req.query.course_id}&video_id=${req.query.video_id}`;
  return app._router.handle(req, res, () => {});
});

app.get('/get/allsubjectfrmlivecourseclass', async (req: Request, res: Response) => {
  req.url = `/api/course/subjects?courseid=${req.query.courseid}`;
  return app._router.handle(req, res, () => {});
});

app.get('/get/alltopicfrmlivecourseclass', async (req: Request, res: Response) => {
  req.url = `/api/course/topics?courseid=${req.query.courseid}&subjectid=${req.query.subjectid}`;
  return app._router.handle(req, res, () => {});
});

app.get('/get/livecourseclassbycoursesubtopconceptapiv3', async (req: Request, res: Response) => {
  req.url = `/api/course/lectures?courseid=${req.query.courseid}&subjectid=${req.query.subjectid}&topicid=${req.query.topicid}`;
  return app._router.handle(req, res, () => {});
});

// Start Full-Stack Server with Vite
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GB STUDY Server] Full-Stack server running at http://localhost:${PORT}`);
  });
}

startServer();
