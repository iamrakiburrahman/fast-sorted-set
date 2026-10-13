/**
 * Redis-style SkipList implementation with span pointers.
 * 
 * Key Architecture:
 * - Each level pointer has a `span` property representing how many lower-level nodes
 *   are skipped over.
 * - This enables O(log N) rank calculation and O(log N) retrieval of an element by rank!
 */

export interface SkipListLevel<T> {
  forward: SkipListNode<T> | null;
  span: number;
}

export class SkipListNode<T> {
  public member: T;
  public score: number;
  public backward: SkipListNode<T> | null = null;
  public level: SkipListLevel<T>[];

  constructor(levelCount: number, score: number, member: T) {
    this.score = score;
    this.member = member;
    this.level = new Array(levelCount);
    for (let i = 0; i < levelCount; i++) {
      this.level[i] = { forward: null, span: 0 };
    }
  }
}

export class SkipList<T> {
  private static readonly MAX_LEVEL = 32; // Supports up to 2^32 nodes (same as Redis)
  private static readonly P = 0.25;       // Probability factor (same as Redis ZSKIPLIST_P)

  public header: SkipListNode<T>;
  public tail: SkipListNode<T> | null = null;
  public length = 0;
  public level = 1;

  private compareMembers: (a: T, b: T) => number;

  constructor(customCompare?: (a: T, b: T) => number) {
    this.compareMembers = customCompare || ((a: T, b: T) => {
      if (a === b) return 0;
      return String(a) < String(b) ? -1 : 1;
    });

    // Dummy header node with maximum level
    this.header = new SkipListNode<T>(SkipList.MAX_LEVEL, 0, null as unknown as T);
  }

  /**
   * Generate a random level between 1 and MAX_LEVEL using geometric distribution.
   */
  private randomLevel(): number {
    let level = 1;
    while (Math.random() < SkipList.P && level < SkipList.MAX_LEVEL) {
      level += 1;
    }
    return level;
  }

  /**
   * Compare two nodes: first by score, then by member value as tie-breaker.
   */
  private compare(scoreA: number, memberA: T, scoreB: number, memberB: T): number {
    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }
    return this.compareMembers(memberA, memberB);
  }

  /**
   * Insert a member with a given score into the SkipList.
   * Time Complexity: O(log N)
   */
  public insert(score: number, member: T): SkipListNode<T> {
    const update: SkipListNode<T>[] = new Array(SkipList.MAX_LEVEL);
    const rank: number[] = new Array(SkipList.MAX_LEVEL);
    let curr: SkipListNode<T> = this.header;

    // 1. Search for insertion position and track rank/span at each level
    for (let i = this.level - 1; i >= 0; i--) {
      rank[i] = i === this.level - 1 ? 0 : rank[i + 1];

      while (
        curr.level[i].forward &&
        this.compare(curr.level[i].forward!.score, curr.level[i].forward!.member, score, member) < 0
      ) {
        rank[i] += curr.level[i].span;
        curr = curr.level[i].forward!;
      }
      update[i] = curr;
    }

    // 2. Determine random level for new node
    const newLevel = this.randomLevel();
    if (newLevel > this.level) {
      for (let i = this.level; i < newLevel; i++) {
        rank[i] = 0;
        update[i] = this.header;
        update[i].level[i].span = this.length;
      }
      this.level = newLevel;
    }

    // 3. Create new node and link pointers with accurate spans
    const node = new SkipListNode<T>(newLevel, score, member);
    for (let i = 0; i < newLevel; i++) {
      node.level[i].forward = update[i].level[i].forward;
      update[i].level[i].forward = node;

      // Update spans
      node.level[i].span = update[i].level[i].span - (rank[0] - rank[i]);
      update[i].level[i].span = rank[0] - rank[i] + 1;
    }

    // Unchanged levels: increment span by 1
    for (let i = newLevel; i < this.level; i++) {
      update[i].level[i].span += 1;
    }

    // 4. Update backward pointer
    node.backward = update[0] === this.header ? null : update[0];
    if (node.level[0].forward) {
      node.level[0].forward.backward = node;
    } else {
      this.tail = node;
    }

    this.length += 1;
    return node;
  }

  /**
   * Internal delete helper once update array is found.
   */
  private deleteNode(node: SkipListNode<T>, update: SkipListNode<T>[]): void {
    for (let i = 0; i < this.level; i++) {
      if (update[i].level[i].forward === node) {
        update[i].level[i].span += node.level[i].span - 1;
        update[i].level[i].forward = node.level[i].forward;
      } else {
        update[i].level[i].span -= 1;
      }
    }

    if (node.level[0].forward) {
      node.level[0].forward.backward = node.backward;
    } else {
      this.tail = node.backward;
    }

    while (this.level > 1 && this.header.level[this.level - 1].forward === null) {
      this.level -= 1;
    }

    this.length -= 1;
  }

  /**
   * Delete a member with a given score.
   * Time Complexity: O(log N)
   */
  public delete(score: number, member: T): boolean {
    const update: SkipListNode<T>[] = new Array(SkipList.MAX_LEVEL);
    let curr: SkipListNode<T> = this.header;

    for (let i = this.level - 1; i >= 0; i--) {
      while (
        curr.level[i].forward &&
        this.compare(curr.level[i].forward!.score, curr.level[i].forward!.member, score, member) < 0
      ) {
        curr = curr.level[i].forward!;
      }
      update[i] = curr;
    }

    curr = curr.level[0].forward!;
    if (curr && curr.score === score && this.compareMembers(curr.member, member) === 0) {
      this.deleteNode(curr, update);
      return true;
    }

    return false;
  }

  /**
   * Find 1-based ascending rank of an element in O(log N) time.
   * Returns 0 if member is not found.
   */
  public getRank(score: number, member: T): number {
    let rank = 0;
    let curr: SkipListNode<T> = this.header;

    for (let i = this.level - 1; i >= 0; i--) {
      while (
        curr.level[i].forward &&
        this.compare(curr.level[i].forward!.score, curr.level[i].forward!.member, score, member) <= 0
      ) {
        rank += curr.level[i].span;
        curr = curr.level[i].forward!;
      }

      if (curr !== this.header && curr.score === score && this.compareMembers(curr.member, member) === 0) {
        return rank;
      }
    }

    return 0;
  }

  /**
   * Find node by 1-based ascending rank in O(log N) time.
   */
  public getNodeByRank(rank: number): SkipListNode<T> | null {
    if (rank <= 0 || rank > this.length) return null;

    let traversed = 0;
    let curr: SkipListNode<T> = this.header;

    for (let i = this.level - 1; i >= 0; i--) {
      while (curr.level[i].forward && traversed + curr.level[i].span <= rank) {
        traversed += curr.level[i].span;
        curr = curr.level[i].forward!;
      }
      if (traversed === rank) {
        return curr;
      }
    }

    return null;
  }

  /**
   * Clear all nodes in the SkipList.
   */
  public clear(): void {
    for (let i = 0; i < SkipList.MAX_LEVEL; i++) {
      this.header.level[i].forward = null;
      this.header.level[i].span = 0;
    }
    this.tail = null;
    this.length = 0;
    this.level = 1;
  }
}
