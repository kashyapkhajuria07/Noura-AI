import type { LMSActivity } from '@/generated/prisma/client';
import type { RuleThresholds, RuleResult, RuleName } from './types';

function scoreToSeverity(score: number): number {
  if (score >= 80) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  if (score >= 20) return 1;
  return 0;
}

export function engagementDropRule(
  activities: LMSActivity[],
  thresholds: RuleThresholds
): RuleResult {
  const now = Date.now();
  const windowMs = thresholds.engagementWindowDays * 24 * 60 * 60 * 1000;
  const mid = now - windowMs / 2;

  const recent = activities.filter((a) => a.timestamp.getTime() >= mid).length;
  const earlier = activities.filter(
    (a) => a.timestamp.getTime() >= now - windowMs && a.timestamp.getTime() < mid
  ).length;

  if (earlier === 0) {
    return {
      rule: 'engagement_drop' as RuleName,
      triggered: false,
      score: 0,
      details: 'No activity data in earlier window to compare',
      severity: 0,
    };
  }

  const dropPercent = ((earlier - recent) / earlier) * 100;
  const triggered = dropPercent >= thresholds.engagementDropPercent;

  return {
    rule: 'engagement_drop' as RuleName,
    triggered,
    score: triggered ? Math.min(100, Math.round(dropPercent * 1.5)) : 0,
    details: triggered
      ? `Activity dropped ${Math.round(dropPercent)}% over ${thresholds.engagementWindowDays} days (threshold: ${thresholds.engagementDropPercent}%)`
      : `Activity changed ${Math.round(dropPercent)}% (within threshold)`,
    severity: triggered ? scoreToSeverity(dropPercent) : 0,
  };
}

export function lateNightRule(activities: LMSActivity[], thresholds: RuleThresholds): RuleResult {
  const now = new Date();
  const sorted = [...activities]
    .filter((a) => {
      const diffDays = (now.getTime() - a.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= thresholds.engagementWindowDays;
    })
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const nightSessions: string[] = [];

  for (const act of sorted) {
    const h = act.timestamp.getHours();
    const isLateNight = h >= thresholds.lateNightHourStart || h <= thresholds.lateNightHourEnd;
    if (isLateNight) {
      const dateStr = act.timestamp.toISOString().split('T')[0];
      if (!nightSessions.includes(dateStr)) {
        nightSessions.push(dateStr);
      }
    }
  }

  if (nightSessions.length === 0) {
    return {
      rule: 'late_night' as RuleName,
      triggered: false,
      score: 0,
      details: 'No late-night activity detected',
      severity: 0,
    };
  }

  nightSessions.sort();

  let maxConsecutive = 1;
  let currentRun = 1;

  for (let i = 1; i < nightSessions.length; i++) {
    const prev = new Date(nightSessions[i - 1]);
    const curr = new Date(nightSessions[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= 1.5) {
      currentRun++;
      maxConsecutive = Math.max(maxConsecutive, currentRun);
    } else {
      currentRun = 1;
    }
  }

  const triggered = maxConsecutive >= thresholds.lateNightConsecutiveDays;
  const severity = maxConsecutive <= 3 ? 1 : maxConsecutive <= 5 ? 2 : maxConsecutive <= 7 ? 3 : 4;

  return {
    rule: 'late_night' as RuleName,
    triggered,
    score: triggered ? Math.min(100, maxConsecutive * 20) : 0,
    details: triggered
      ? `${maxConsecutive} consecutive late-night sessions detected (threshold: ${thresholds.lateNightConsecutiveDays})`
      : `Maximum ${maxConsecutive} consecutive late-night sessions (below threshold)`,
    severity: triggered ? severity : 0,
  };
}

export function assignmentChurnRule(
  activities: LMSActivity[],
  thresholds: RuleThresholds
): RuleResult {
  const now = Date.now();
  const windowMs = thresholds.assignmentChurnWindowDays * 24 * 60 * 60 * 1000;
  const since = new Date(now - windowMs);

  const submissions = activities.filter(
    (a) => a.type === 'assignment_submitted' && a.timestamp >= since
  );

  const courseMap = new Map<string, number>();
  for (const s of submissions) {
    const key = s.courseId ?? 'unknown';
    courseMap.set(key, (courseMap.get(key) ?? 0) + 1);
  }

  const highChurnCourses: string[] = [];
  for (const [course, count] of courseMap) {
    if (count > thresholds.assignmentChurnCount) {
      highChurnCourses.push(`${course} (${count} submissions)`);
    }
  }

  const totalSubmissions = submissions.length;
  const triggered = totalSubmissions > thresholds.assignmentChurnCount;
  const excess = totalSubmissions - thresholds.assignmentChurnCount;

  return {
    rule: 'assignment_churn' as RuleName,
    triggered,
    score: triggered
      ? Math.min(100, Math.round((excess / thresholds.assignmentChurnCount) * 50 + 50))
      : 0,
    details: triggered
      ? `${totalSubmissions} submissions in ${thresholds.assignmentChurnWindowDays} days (threshold: ${thresholds.assignmentChurnCount}). High churn courses: ${highChurnCourses.join(', ') || 'none'}`
      : `${totalSubmissions} submissions in ${thresholds.assignmentChurnWindowDays} days (within threshold)`,
    severity: triggered
      ? totalSubmissions > thresholds.assignmentChurnCount * 2
        ? 3
        : totalSubmissions > thresholds.assignmentChurnCount * 1.5
          ? 2
          : 1
      : 0,
  };
}

export function participationGapRule(
  activities: LMSActivity[],
  thresholds: RuleThresholds
): RuleResult {
  if (activities.length === 0) {
    return {
      rule: 'participation_gap' as RuleName,
      triggered: true,
      score: 100,
      details: 'No activity data available — possible significant participation gap',
      severity: 4,
    };
  }

  const sorted = [...activities].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const mostRecent = sorted[0].timestamp;
  const now = Date.now();
  const gapDays = (now - mostRecent.getTime()) / (1000 * 60 * 60 * 24);

  const triggered = gapDays >= thresholds.participationGapDays;

  return {
    rule: 'participation_gap' as RuleName,
    triggered,
    score: triggered
      ? Math.min(100, Math.round((gapDays / thresholds.participationGapDays) * 100))
      : 0,
    details: triggered
      ? `${Math.round(gapDays)} days since last activity (threshold: ${thresholds.participationGapDays} days)`
      : `${Math.round(gapDays)} days since last activity (within threshold)`,
    severity: triggered
      ? gapDays > thresholds.participationGapDays * 2
        ? 4
        : gapDays > thresholds.participationGapDays * 1.5
          ? 3
          : 2
      : 0,
  };
}

export const ALL_RULES: Record<
  RuleName,
  (activities: LMSActivity[], thresholds: RuleThresholds) => RuleResult
> = {
  engagement_drop: engagementDropRule,
  late_night: lateNightRule,
  assignment_churn: assignmentChurnRule,
  participation_gap: participationGapRule,
};
