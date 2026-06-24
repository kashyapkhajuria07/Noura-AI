import { describe, it, expect } from 'vitest';
import { generateMockData } from '../mock-data';

describe('generateMockData', () => {
  it('returns valid normalized data', () => {
    const data = generateMockData();

    expect(data.provider).toBe('mock');
    expect(data.fetchedAt).toBeDefined();
    expect(new Date(data.fetchedAt).getTime()).not.toBeNaN();
  });

  it('generates courses', () => {
    const data = generateMockData();
    expect(data.courses.length).toBeGreaterThanOrEqual(5);
    expect(data.courses[0]).toHaveProperty('id');
    expect(data.courses[0]).toHaveProperty('name');
    expect(data.courses[0]).toHaveProperty('enrollmentCount');
  });

  it('generates activities with valid timestamps', () => {
    const data = generateMockData();
    expect(data.activities.length).toBeGreaterThan(0);
    for (const act of data.activities) {
      expect(new Date(act.timestamp).getTime()).not.toBeNaN();
      expect(['assignment_submitted', 'assignment_graded', 'course_access', 'discussion_post', 'file_view', 'quiz_taken', 'module_completed']).toContain(act.type);
    }
  });

  it('generates assignments sorted by due date', () => {
    const data = generateMockData();
    expect(data.assignments.length).toBeGreaterThan(0);
    for (const asgn of data.assignments) {
      expect(['assigned', 'submitted', 'graded', 'missing']).toContain(asgn.status);
      expect(asgn.pointsPossible).toBeGreaterThan(0);
    }
  });
});
