import { getEnv } from '@/lib/env';
import { cacheGet, cacheSet } from '@/lib/cache';
import { normalizeLMSData } from './normalize';
import { generateMockData } from './mock-data';
import type { NormalizedLMSData, LMSProvider } from './types';

interface FetchOptions {
  provider: LMSProvider;
  accessToken?: string;
  userId: string;
  forceRefresh?: boolean;
}

function cacheKey(uid: string, provider: LMSProvider) {
  return `lms:${provider}:${uid}`;
}

async function fetchCanvas(token: string): Promise<any> {
  const base = getEnv().CANVAS_INSTANCE_URL;
  const headers = { Authorization: `Bearer ${token}` };

  const [coursesRes, submissionsRes] = await Promise.all([
    fetch(`${base}/api/v1/courses?enrollment_state=active&per_page=50`, { headers }),
    fetch(`${base}/api/v1/users/self/submissions?per_page=100`, { headers }),
  ]);

  const courses = await coursesRes.json();
  const submissions = await submissionsRes.json();

  const assignments = await Promise.all(
    courses.slice(0, 10).map(async (c: any) => {
      try {
        const res = await fetch(`${base}/api/v1/courses/${c.id}/assignments?per_page=20`, {
          headers,
        });
        const data = await res.json();
        return data.map((a: any) => ({ ...a, course_name: c.name }));
      } catch {
        return [];
      }
    })
  );

  return {
    courses,
    activities: submissions,
    assignments: assignments.flat(),
  };
}

async function fetchGoogleClassroom(token: string): Promise<any> {
  const headers = { Authorization: `Bearer ${token}` };

  const coursesRes = await fetch('https://classroom.googleapis.com/v1/courses', { headers });
  const courses = (await coursesRes.json()).courses ?? [];

  const assignments = await Promise.all(
    courses.slice(0, 10).map(async (c: any) => {
      try {
        const res = await fetch(`https://classroom.googleapis.com/v1/courses/${c.id}/courseWork`, {
          headers,
        });
        const data = await res.json();
        return (data.courseWork ?? []).map((a: any) => ({
          ...a,
          courseId: c.id,
          courseName: c.name,
        }));
      } catch {
        return [];
      }
    })
  );

  return {
    courses,
    activities: [],
    assignments: assignments.flat(),
  };
}

async function fetchLMSData(options: FetchOptions): Promise<NormalizedLMSData> {
  const key = cacheKey(options.userId, options.provider);

  if (!options.forceRefresh) {
    const cached = await cacheGet<NormalizedLMSData>(key);
    if (cached) return cached;
  }

  if (getEnv().MOCK_LMS_ENABLED || options.provider === 'mock') {
    const data = generateMockData();
    await cacheSet(key, data);
    return data;
  }

  let raw: any;

  switch (options.provider) {
    case 'canvas':
      raw = await fetchCanvas(options.accessToken ?? '');
      break;
    case 'google_classroom':
      raw = await fetchGoogleClassroom(options.accessToken ?? '');
      break;
    default:
      return generateMockData();
  }

  const normalized = normalizeLMSData(raw, options.provider);
  await cacheSet(key, normalized);
  return normalized;
}

export const lmsService = { fetch: fetchLMSData };
