import { SkipList, SkipListNode } from './skiplist.js';
import { ISortedSetItem, RankOptions, RangeOptions, RangeByScoreOptions } from './types.js';

/**
 * FastSortedSet: High-performance, in-memory Sorted Set data structure.
 * Combines a Hash Map for O(1) score lookup with a Redis-style SkipList
 * with span pointers for O(log N) ranking and ordered range queries.
 */
export class FastSortedSet<T = string> {
  private map = new Map<T, number>();
  private skipList: SkipList<T>;

  constructor(customCompare?: (a: T, b: T) => number) {
    this.skipList = new SkipList<T>(customCompare);
  }

  /**
   * Total number of elements in the set.
   * Time Complexity: O(1)
   */
  public get size(): number {
    return this.map.size;
  }

  /**
   * Alias for size.
   */
  public card(): number {
    return this.map.size;
  }

  /**
   * Add a member with a given score. If member already exists, its score is updated.
   * Returns true if added as a new member, false if updated.
   * Time Complexity: O(log N)
   */
  public add(member: T, score: number): boolean {
    const existingScore = this.map.get(member);

    if (existingScore !== undefined) {
      if (existingScore === score) {
        return false; // No change needed
      }
      // Remove old entry from skiplist
      this.skipList.delete(existingScore, member);
    }

    this.map.set(member, score);
    this.skipList.insert(score, member);
    return existingScore === undefined;
  }

  /**
   * Add multiple members in batch.
   * Returns the count of newly added elements.
   */
  public addMany(items: Array<{ member: T; score: number }>): number {
    let added = 0;
    for (const item of items) {
      if (this.add(item.member, item.score)) {
        added += 1;
      }
    }
    return added;
  }

  /**
   * Check if a member exists in the set.
   * Time Complexity: O(1)
   */
  public has(member: T): boolean {
    return this.map.has(member);
  }

  /**
   * Get the score of a member.
   * Time Complexity: O(1)
   */
  public score(member: T): number | undefined {
    return this.map.get(member);
  }

  /**
   * Remove a member from the set.
   * Time Complexity: O(log N)
   */
  public remove(member: T): boolean {
    const score = this.map.get(member);
    if (score === undefined) return false;

    this.map.delete(member);
    return this.skipList.delete(score, member);
  }

  /**
   * Increment the score of a member by a delta value.
   * If member does not exist, it is added with delta as the score.
   * Returns the new score.
   * Time Complexity: O(log N)
   */
  public incrBy(member: T, increment: number): number {
    const currentScore = this.map.get(member) || 0;
    const newScore = currentScore + increment;
    this.add(member, newScore);
    return newScore;
  }

  /**
   * Get the rank of a member.
   * 
   * Options:
   * - `reverse`: If true, highest score = rank 1 (Leaderboard standard). Default: true.
   * - `oneBased`: If true, rank starts from 1; if false, starts from 0. Default: true.
   * 
   * Returns null if member is not found.
   * Time Complexity: O(log N)
   */
  public rank(member: T, options?: RankOptions): number | null {
    const score = this.map.get(member);
    if (score === undefined) return null;

    const reverse = options?.reverse !== false;   // Default true (Leaderboard: highest is rank 1)
    const oneBased = options?.oneBased !== false; // Default true

    const ascRank = this.skipList.getRank(score, member);
    if (ascRank === 0) return null;

    let computedRank: number;
    if (reverse) {
      // Descending rank: total - ascRank + 1
      computedRank = this.skipList.length - ascRank + 1;
    } else {
      computedRank = ascRank;
    }

    return oneBased ? computedRank : computedRank - 1;
  }

  /**
   * Return members within the specified rank range (0-based or negative index support like Redis).
   * Time Complexity: O(log N + M) where M is the number of elements returned.
   */
  public range(start: number, stop: number, options?: RangeOptions): T[] {
    return this.rangeWithScores(start, stop, options).map(item => item.member);
  }

  /**
   * Return members with their scores within the specified rank range.
   * Supports negative indices (e.g., stop: -1 means last item).
   * Time Complexity: O(log N + M)
   */
  public rangeWithScores(start: number, stop: number, options?: RangeOptions): Array<ISortedSetItem<T>> {
    const total = this.skipList.length;
    if (total === 0) return [];

    let s = start < 0 ? total + start : start;
    let e = stop < 0 ? total + stop : stop;

    if (s < 0) s = 0;
    if (e >= total) e = total - 1;
    if (s > e) return [];

    const reverse = options?.reverse === true;
    const result: Array<ISortedSetItem<T>> = [];

    if (!reverse) {
      // Ascending range
      let node = this.skipList.getNodeByRank(s + 1);
      let count = e - s + 1;
      while (node && count > 0) {
        result.push({ member: node.member, score: node.score });
        node = node.level[0].forward;
        count -= 1;
      }
    } else {
      // Descending range (highest to lowest)
      const descStartRank = total - s; // 1-based ascending rank of start node
      let node = this.skipList.getNodeByRank(descStartRank);
      let count = e - s + 1;
      while (node && count > 0) {
        result.push({ member: node.member, score: node.score });
        node = node.backward;
        count -= 1;
      }
    }

    return result;
  }

  /**
   * Return items whose scores are between min and max.
   * Time Complexity: O(log N + M)
   */
  public rangeByScore(min: number, max: number, options?: RangeByScoreOptions): Array<ISortedSetItem<T>> {
    const reverse = options?.reverse === true;
    const exclusiveMin = options?.exclusiveMin === true;
    const exclusiveMax = options?.exclusiveMax === true;
    const offset = options?.offset || 0;
    const limit = options?.limit !== undefined ? options.limit : Infinity;

    if (min > max) return [];

    const result: Array<ISortedSetItem<T>> = [];
    let skipped = 0;

    if (!reverse) {
      // Search lowest bound starting from header
      let curr: SkipListNode<T> = this.skipList.header;
      for (let i = this.skipList.level - 1; i >= 0; i--) {
        while (curr.level[i].forward && (exclusiveMin ? curr.level[i].forward!.score <= min : curr.level[i].forward!.score < min)) {
          curr = curr.level[i].forward!;
        }
      }

      let node = curr.level[0].forward;
      while (node) {
        if (exclusiveMax ? node.score >= max : node.score > max) break;

        if (skipped < offset) {
          skipped += 1;
        } else {
          result.push({ member: node.member, score: node.score });
          if (result.length >= limit) break;
        }

        node = node.level[0].forward;
      }
    } else {
      // Descending: Start from highest bound and traverse backwards
      let curr: SkipListNode<T> = this.skipList.header;
      for (let i = this.skipList.level - 1; i >= 0; i--) {
        while (curr.level[i].forward && (exclusiveMax ? curr.level[i].forward!.score < max : curr.level[i].forward!.score <= max)) {
          curr = curr.level[i].forward!;
        }
      }

      let node: SkipListNode<T> | null = curr;
      while (node && node !== this.skipList.header) {
        if (exclusiveMin ? node.score <= min : node.score < min) break;

        if (skipped < offset) {
          skipped += 1;
        } else {
          result.push({ member: node.member, score: node.score });
          if (result.length >= limit) break;
        }

        node = node.backward;
      }
    }

    return result;
  }

  /**
   * Count elements with scores within the given range [min, max].
   * Time Complexity: O(log N)
   */
  public count(min: number, max: number): number {
    if (min > max || this.skipList.length === 0) return 0;

    // Use rangeByScore count or span arithmetic
    const items = this.rangeByScore(min, max);
    return items.length;
  }

  /**
   * Clear all items from the sorted set.
   * Time Complexity: O(1)
   */
  public clear(): void {
    this.map.clear();
    this.skipList.clear();
  }

  /**
   * Iterator to iterate over items from lowest to highest score.
   */
  public *[Symbol.iterator](): IterableIterator<ISortedSetItem<T>> {
    let curr = this.skipList.header.level[0].forward;
    while (curr) {
      yield { member: curr.member, score: curr.score };
      curr = curr.level[0].forward;
    }
  }
}
