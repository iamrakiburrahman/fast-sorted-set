export { FastSortedSet } from './sorted-set.js';
export { Leaderboard, createLeaderboard } from './leaderboard.js';
export { SkipList, SkipListNode } from './skiplist.js';
export type {
  ISortedSetItem,
  RankOptions,
  RangeOptions,
  RangeByScoreOptions,
  LeaderboardEntry,
  AroundUserOptions
} from './types.js';

import { FastSortedSet } from './sorted-set.js';

/**
 * 🚀 Super-easy factory function for FastSortedSet
 */
export function createSortedSet<T = string>(customCompare?: (a: T, b: T) => number): FastSortedSet<T> {
  return new FastSortedSet<T>(customCompare);
}
