export interface ISortedSetItem<T> {
  member: T;
  score: number;
}

export interface RankOptions {
  /**
   * If true, rank 1 is assigned to the highest score (Leaderboard style).
   * If false, rank 1 is assigned to the lowest score (Ascending style).
   * @default true
   */
  reverse?: boolean;

  /**
   * If true, rank starts from 1 (1st, 2nd, 3rd).
   * If false, rank starts from 0 (0-indexed).
   * @default true
   */
  oneBased?: boolean;
}

export interface RangeOptions {
  /**
   * If true, returns from highest score to lowest score (descending).
   * @default false
   */
  reverse?: boolean;
}

export interface RangeByScoreOptions extends RangeOptions {
  /**
   * Maximum number of items to return.
   */
  limit?: number;

  /**
   * Number of items to skip.
   * @default 0
   */
  offset?: number;

  /**
   * Exclude the minimum score bound (strict > min).
   * @default false
   */
  exclusiveMin?: boolean;

  /**
   * Exclude the maximum score bound (strict < max).
   * @default false
   */
  exclusiveMax?: boolean;
}

export interface LeaderboardEntry<T> {
  rank: number;
  member: T;
  score: number;
}

export interface AroundUserOptions {
  /**
   * How many players above the given user to include.
   * @default 4
   */
  above?: number;

  /**
   * How many players below the given user to include.
   * @default 4
   */
  below?: number;
}
