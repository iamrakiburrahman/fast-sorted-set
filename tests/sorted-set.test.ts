import test from 'node:test';
import assert from 'node:assert/strict';
import { FastSortedSet } from '../src/sorted-set.js';

test('FastSortedSet - add, update score, and size', () => {
  const set = new FastSortedSet<string>();

  assert.equal(set.add('alice', 100), true);
  assert.equal(set.add('bob', 200), true);
  assert.equal(set.size, 2);

  // Updating alice score
  assert.equal(set.add('alice', 250), false);
  assert.equal(set.size, 2);
  assert.equal(set.score('alice'), 250);

  // Inverted leaderboard rank (default reverse: true)
  assert.equal(set.rank('alice'), 1);
  assert.equal(set.rank('bob'), 2);
});

test('FastSortedSet - range and rangeWithScores', () => {
  const set = new FastSortedSet<string>();
  set.add('a', 10);
  set.add('b', 20);
  set.add('c', 30);
  set.add('d', 40);

  // Top 2 descending
  const top2 = set.range(0, 1, { reverse: true });
  assert.deepEqual(top2, ['d', 'c']);

  // Bottom 2 ascending
  const bottom2 = set.range(0, 1, { reverse: false });
  assert.deepEqual(bottom2, ['a', 'b']);
});

test('FastSortedSet - rangeByScore', () => {
  const set = new FastSortedSet<string>();
  set.add('p1', 50);
  set.add('p2', 150);
  set.add('p3', 250);
  set.add('p4', 350);

  const matched = set.rangeByScore(100, 300);
  assert.deepEqual(matched.map(m => m.member), ['p2', 'p3']);
  assert.equal(set.count(100, 300), 2);
});

test('FastSortedSet - incrBy', () => {
  const set = new FastSortedSet<string>();
  assert.equal(set.incrBy('player1', 50), 50);
  assert.equal(set.incrBy('player1', 25), 75);
  assert.equal(set.score('player1'), 75);
});
