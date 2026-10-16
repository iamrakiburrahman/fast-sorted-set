import test from 'node:test';
import assert from 'node:assert/strict';
import { SkipList } from '../src/skiplist.js';

test('SkipList - basic insert, rank, and span calculation', () => {
  const list = new SkipList<string>();

  list.insert(10, 'A');
  list.insert(20, 'B');
  list.insert(30, 'C');
  list.insert(40, 'D');

  assert.equal(list.length, 4);

  // Ascending ranks
  assert.equal(list.getRank(10, 'A'), 1);
  assert.equal(list.getRank(20, 'B'), 2);
  assert.equal(list.getRank(30, 'C'), 3);
  assert.equal(list.getRank(40, 'D'), 4);

  // Get by rank
  assert.equal(list.getNodeByRank(1)?.member, 'A');
  assert.equal(list.getNodeByRank(2)?.member, 'B');
  assert.equal(list.getNodeByRank(3)?.member, 'C');
  assert.equal(list.getNodeByRank(4)?.member, 'D');
  assert.equal(list.getNodeByRank(5), null);
});

test('SkipList - deletion and rank re-balancing', () => {
  const list = new SkipList<string>();
  list.insert(10, 'A');
  list.insert(20, 'B');
  list.insert(30, 'C');

  assert.equal(list.delete(20, 'B'), true);
  assert.equal(list.length, 2);

  // 'C' is now rank 2
  assert.equal(list.getRank(30, 'C'), 2);
  assert.equal(list.getNodeByRank(2)?.member, 'C');

  // Deleting non-existent returns false
  assert.equal(list.delete(999, 'Z'), false);
});
