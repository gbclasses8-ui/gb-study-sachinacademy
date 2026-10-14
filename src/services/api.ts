import { Batch, Subject, Topic, Lecture, VideoDetails } from '../types';
import rawBatches from '../data/batches.json';
import rawPreload from '../data/preloaded_courses.json';

export function getBatches(): Batch[] {
  if (Array.isArray(rawBatches)) return rawBatches as Batch[];
  if ((rawBatches as any)?.new && Array.isArray((rawBatches as any).new)) {
    return (rawBatches as any).new as Batch[];
  }
  return [];
}

export function categorizeBatch(title: string): string {
  const upper = title.toUpperCase();
  if (upper.includes('CTET')) return 'CTET';
  if (upper.includes('KVS') || upper.includes('NVS')) return 'KVS & NVS';
  if (upper.includes('BIHAR') || upper.includes('BPSC') || upper.includes('TRE')) return 'BPSC TRE';
  if (upper.includes('SUPERTET') || upper.includes('TGT') || upper.includes('PGT') || upper.includes('UP ')) return 'UP Teaching';
  if (upper.includes('JHARKHAND') || upper.includes('TET')) return 'State TET';
  return 'General';
}

const preloadedCache = rawPreload as {
  subjects: Record<string, Subject[]>;
  topics: Record<string, Topic[]>;
  lectures: Record<string, Lecture[]>;
};

// Generic fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function fetchSubjects(courseId: string): Promise<Subject[]> {
  // 1. Fetch through server API (live sync)
  try {
    const res = await fetchWithTimeout(`/api/course/subjects?courseid=${courseId}`, 8000);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 200 && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (e) {
    console.warn(`[GB STUDY] Subject live fetch error for course ${courseId}`, e);
  }

  // 2. Fallback to local preloaded cache
  if (preloadedCache.subjects && preloadedCache.subjects[courseId] && preloadedCache.subjects[courseId].length > 0) {
    return preloadedCache.subjects[courseId];
  }

  return [
    { subjectid: 'all', subject_name: 'Complete Syllabus & Video Classes', subject_logo: '', sortingparam: '1' }
  ];
}

export async function fetchTopics(courseId: string, subjectId: string): Promise<Topic[]> {
  const cacheKey = `${courseId}_${subjectId}`;

  // 1. Fetch through server API (live sync)
  try {
    const res = await fetchWithTimeout(`/api/course/topics?courseid=${courseId}&subjectid=${subjectId}`, 8000);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 200 && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (e) {
    console.warn(`[GB STUDY] Topic live fetch error for course ${courseId} subject ${subjectId}`, e);
  }

  // 2. Fallback to local cache
  if (preloadedCache.topics && preloadedCache.topics[cacheKey] && preloadedCache.topics[cacheKey].length > 0) {
    return preloadedCache.topics[cacheKey];
  }

  return [
    { topicid: '1', topic_name: 'Chapter Lectures & Notes', topic_logo: '', sortingparam: 1 }
  ];
}

export async function fetchLectures(courseId: string, subjectId: string, topicId: string): Promise<Lecture[]> {
  const exactKey = `${courseId}_${subjectId}_${topicId}`;

  // 1. Always attempt Live fetch through server API first
  try {
    const res = await fetchWithTimeout(
      `/api/course/lectures?courseid=${courseId}&subjectid=${subjectId}&topicid=${topicId}`,
      8000
    );
    if (res.ok) {
      const json = await res.json();
      if (json.status === 200 && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (e) {
    console.warn(`[GB STUDY] Lecture live fetch error for ${courseId}/${subjectId}/${topicId}`, e);
  }

  // 2. Fallback to exact key in local cache
  if (preloadedCache.lectures && preloadedCache.lectures[exactKey] && preloadedCache.lectures[exactKey].length > 0) {
    return preloadedCache.lectures[exactKey];
  }

  // 3. Fallback: check if any lectures exist for this subject in cache
  const subPrefix = `${courseId}_${subjectId}_`;
  const matchingKey = Object.keys(preloadedCache.lectures || {}).find((k) => k.startsWith(subPrefix));
  if (matchingKey && preloadedCache.lectures[matchingKey] && preloadedCache.lectures[matchingKey].length > 0) {
    return preloadedCache.lectures[matchingKey];
  }

  return [];
}

export async function fetchVideoDetails(courseId: string, videoId: string): Promise<VideoDetails | null> {
  // Call server video details API with retry
  try {
    const res = await fetchWithTimeout(
      `/api/course/video-details?course_id=${courseId}&video_id=${videoId}`,
      8000
    );
    if (res.ok) {
      const json = await res.json();
      if (json && json.success) {
        return json;
      }
    }
  } catch (e) {
    console.warn(`[GB STUDY] Video details error for video ${videoId}`, e);
  }

  // Fallback: look for video in preloaded lectures cache
  for (const lecs of Object.values(preloadedCache.lectures || {})) {
    const match = lecs.find((l: any) => String(l.id) === String(videoId));
    if (match) {
      return {
        success: true,
        video_id: videoId,
        course_id: courseId,
        title: match.Title || match.title || 'Video Class',
        duration: match.duration,
        thumbnail: match.thumbnail,
        decoded_video_link: match.file_link,
        decoded_pdf_link: match.pdf_link,
        qualities: (match.download_links || []).map((dl: any) => ({
          quality: dl.quality || dl.bitrate || 'Auto',
          url: dl.path,
        })),
      };
    }
  }

  return null;
}
