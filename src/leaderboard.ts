import { FastSortedSet } from './sorted-set.js';
import { LeaderboardEntry, AroundUserOptions } from './types.js';

/**
 * Dedicated Real-Time Leaderboard Engine.
 * Designed specifically for gaming, ranking boards, and tournaments.
 * 
 * Features:
 * - 1-based ranks (1 = #1 Top Player)
 * - O(log N) real-time score updates & rank queries
 * - Instant Top K queries
 * - "Around User" context queries (show players above and below a given user)
 */
export class Leaderboard<T = string> {
  private zset: FastSortedSet<T>;

  constructor(customCompare?: (a: T, b: T) => number) {
    this.zset = new FastSortedSet<T>(customCompare);
  }

  /**
   * Total number of registered players in the leaderboard.
   */
  public get totalPlayers(): number {
    return this.zset.size;
  }

  /**
   * Set or update a player's score.
   */
  public recordScore(player: T, score: number): void {
    this.zset.add(player, score);
  }

  /**
   * Add or subtract points from a player's score.
   * Returns the player's new score.
   */
  public addPoints(player: T, points: number): number {
    return this.zset.incrBy(player, points);
  }

  /**
   * Get a player's current score.
   */
  public getScore(player: T): number | undefined {
    return this.zset.score(player);
  }

  /**
   * Get a player's current rank (1 = 1st place).
   * Returns null if player is not found.
   */
  public getRank(player: T): number | null {
    return this.zset.rank(player, { reverse: true, oneBased: true });
  }

  /**
   * Check if a player exists in the leaderboard.
   */
  public hasPlayer(player: T): boolean {
    return this.zset.has(player);
  }

  /**
   * Remove a player from the leaderboard.
   */
  public removePlayer(player: T): boolean {
    return this.zset.remove(player);
  }

  /**
   * Get the top N players on the leaderboard.
   * Example: getTop(10) -> returns players ranked 1 to 10.
   */
  public getTop(count = 10): LeaderboardEntry<T>[] {
    const raw = this.zset.rangeWithScores(0, count - 1, { reverse: true });
    return raw.map((item, index) => ({
      rank: index + 1,
      member: item.member,
      score: item.score
    }));
  }

  /**
   * Get leaderboard slice around a specific player (e.g. 4 ranks above and 4 ranks below).
   * Directly solves Alex Xu Chapter 25 Bonus Requirement!
   */
  public getAroundUser(player: T, options?: AroundUserOptions): LeaderboardEntry<T>[] {
    const playerRank = this.getRank(player);
    if (playerRank === null) return [];

    const above = options?.above ?? 4;
    const below = options?.below ?? 4;

    const startRank = Math.max(1, playerRank - above);
    const endRank = Math.min(this.totalPlayers, playerRank + below);

    const startIndex = startRank - 1;
    const endIndex = endRank - 1;

    const raw = this.zset.rangeWithScores(startIndex, endIndex, { reverse: true });

    return raw.map((item, index) => ({
      rank: startRank + index,
      member: item.member,
      score: item.score
    }));
  }

  /**
   * Clear all players from the leaderboard.
   */
  public reset(): void {
    this.zset.clear();
  }

  // ========================================================
  // ⭐ Beginner-Friendly 1-Line Shortcut Methods ⭐
  // ========================================================

  /**
   * 1-line shortcut to set a player's score.
   * @example board.set('Rakib', 100);
   */
  public set(player: T, score: number): void {
    this.recordScore(player, score);
  }

  /**
   * 1-line shortcut to get a player's score.
   * @example board.get('Rakib'); // 100
   */
  public get(player: T): number | undefined {
    return this.getScore(player);
  }

  /**
   * 1-line shortcut to add points to a player.
   * @example board.add('Rakib', 50); // new score: 150
   */
  public add(player: T, points: number): number {
    return this.addPoints(player, points);
  }

  /**
   * 1-line shortcut to increment points.
   * @example board.increment('Rakib', 50);
   */
  public increment(player: T, points: number): number {
    return this.addPoints(player, points);
  }

  /**
   * 1-line shortcut to check a player's rank (1st place = 1).
   * @example board.rank('Rakib'); // 1
   */
  public rank(player: T): number | null {
    return this.getRank(player);
  }

  /**
   * 1-line shortcut to get top N players.
   * @example board.top(10);
   */
  public top(count = 10): LeaderboardEntry<T>[] {
    return this.getTop(count);
  }

  /**
   * 1-line shortcut to get players around someone.
   * @example board.around('Rakib', 2);
   */
  public around(player: T, count = 2): LeaderboardEntry<T>[] {
    return this.getAroundUser(player, { above: count, below: count });
  }

  /**
   * 1-line shortcut to get all players ranked.
   * @example board.list();
   */
  public list(): LeaderboardEntry<T>[] {
    return this.getTop(this.totalPlayers);
  }
}

/**
 * 🚀 Super-easy factory function for beginners!
 * No need to use 'new Leaderboard()' if you don't want to.
 * 
 * @example
 * const board = createLeaderboard();
 * board.set('Rakib', 100);
 * board.rank('Rakib'); // 1
 * board.top(10);
 */
export function createLeaderboard<T = string>(customCompare?: (a: T, b: T) => number): Leaderboard<T> {
  return new Leaderboard<T>(customCompare);
}
