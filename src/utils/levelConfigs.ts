import type { LevelConfig } from "../types";

export const LEVEL_CONFIGS: LevelConfig[] = [
  { wallPositions: [[1, 1]] },
  {
    wallPositions: [
      [1, 1],
      [2, 3],
      [3, 1],
    ],
  },
  {
    wallPositions: [
      [1, 1],
      [2, 3],
      [3, 1],
      [4, 1],
      [1, 4],
    ],
  },
  // ...
];

export const levelValid = (level: number) => level < LEVEL_CONFIGS.length;
