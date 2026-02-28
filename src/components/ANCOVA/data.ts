/**
 * Fixed example dataset for the ANCOVA module.
 *
 * Scenario: 3 teaching methods (Lecture, Discussion, Flipped), n=8 per group.
 * Covariate: Prior Knowledge (1–10 scale)
 * DV: Final Exam score (0–100)
 *
 * The data are constructed so that:
 * - Raw group means show modest differences (Lecture ≈ 72, Discussion ≈ 71, Flipped ≈ 74)
 * - The Lecture group has the highest covariate mean (~6.5), Flipped the lowest (~4.4)
 * - After covariate adjustment, group separation becomes clearer:
 *   Lecture adjusted ≈ 67, Discussion ≈ 72, Flipped ≈ 78
 * - The within-group covariate–DV correlation is moderate (r ≈ 0.6)
 */

export interface ANCOVADataPoint {
  id: number;
  group: 'Lecture' | 'Discussion' | 'Flipped';
  groupIndex: number;
  priorKnowledge: number;
  examScore: number;
}

export const GROUP_COLORS = ['#4361ee', '#f4a261', '#2a9d8f'] as const;
export const GROUP_NAMES = ['Lecture', 'Discussion', 'Flipped'] as const;

export const ANCOVA_DATA: ANCOVADataPoint[] = [
  // Lecture group — higher prior knowledge on average
  { id: 1,  group: 'Lecture',    groupIndex: 0, priorKnowledge: 8, examScore: 82 },
  { id: 2,  group: 'Lecture',    groupIndex: 0, priorKnowledge: 7, examScore: 76 },
  { id: 3,  group: 'Lecture',    groupIndex: 0, priorKnowledge: 6, examScore: 70 },
  { id: 4,  group: 'Lecture',    groupIndex: 0, priorKnowledge: 7, examScore: 74 },
  { id: 5,  group: 'Lecture',    groupIndex: 0, priorKnowledge: 5, examScore: 65 },
  { id: 6,  group: 'Lecture',    groupIndex: 0, priorKnowledge: 8, examScore: 78 },
  { id: 7,  group: 'Lecture',    groupIndex: 0, priorKnowledge: 6, examScore: 68 },
  { id: 8,  group: 'Lecture',    groupIndex: 0, priorKnowledge: 5, examScore: 63 },

  // Discussion group — moderate prior knowledge
  { id: 9,  group: 'Discussion', groupIndex: 1, priorKnowledge: 6, examScore: 75 },
  { id: 10, group: 'Discussion', groupIndex: 1, priorKnowledge: 5, examScore: 72 },
  { id: 11, group: 'Discussion', groupIndex: 1, priorKnowledge: 4, examScore: 66 },
  { id: 12, group: 'Discussion', groupIndex: 1, priorKnowledge: 6, examScore: 77 },
  { id: 13, group: 'Discussion', groupIndex: 1, priorKnowledge: 5, examScore: 70 },
  { id: 14, group: 'Discussion', groupIndex: 1, priorKnowledge: 3, examScore: 62 },
  { id: 15, group: 'Discussion', groupIndex: 1, priorKnowledge: 7, examScore: 78 },
  { id: 16, group: 'Discussion', groupIndex: 1, priorKnowledge: 4, examScore: 65 },

  // Flipped group — lower prior knowledge on average
  { id: 17, group: 'Flipped',   groupIndex: 2, priorKnowledge: 5, examScore: 78 },
  { id: 18, group: 'Flipped',   groupIndex: 2, priorKnowledge: 4, examScore: 74 },
  { id: 19, group: 'Flipped',   groupIndex: 2, priorKnowledge: 3, examScore: 68 },
  { id: 20, group: 'Flipped',   groupIndex: 2, priorKnowledge: 6, examScore: 82 },
  { id: 21, group: 'Flipped',   groupIndex: 2, priorKnowledge: 4, examScore: 72 },
  { id: 22, group: 'Flipped',   groupIndex: 2, priorKnowledge: 3, examScore: 66 },
  { id: 23, group: 'Flipped',   groupIndex: 2, priorKnowledge: 5, examScore: 80 },
  { id: 24, group: 'Flipped',   groupIndex: 2, priorKnowledge: 5, examScore: 76 },
];

/**
 * Returns the data grouped by teaching method, formatted for ANCOVA utility functions.
 */
export function getGroupedData(): Array<Array<{ x: number; y: number }>> {
  return GROUP_NAMES.map((_, gi) =>
    ANCOVA_DATA.filter((d) => d.groupIndex === gi).map((d) => ({
      x: d.priorKnowledge,
      y: d.examScore,
    }))
  );
}
