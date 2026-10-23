import test from 'node:test';
import assert from 'node:assert/strict';
import { Leaderboard } from '../src/leaderboard.js';

test('Leaderboard - Gaming tournament flow', () => {
  const lb = new Leaderboard<string>();

  lb.recordScore('p1', 100);
  lb.recordScore('p2', 200);
  lb.recordScore('p3', 300);
  lb.recordScore('p4', 400);
  lb.recordScore('p5', 500);

  assert.equal(lb.getRank('p5'), 1);
  assert.equal(lb.getRank('p1'), 5);

  // Top 3
  const top3 = lb.getTop(3);
  assert.equal(top3.length, 3);
  assert.equal(top3[0].member, 'p5');
  assert.equal(top3[0].rank, 1);
  assert.equal(top3[1].member, 'p4');
  assert.equal(top3[2].member, 'p3');

  // Player 1 wins huge match (+1000 pts)
  lb.addPoints('p1', 1000); // 100 + 1000 = 1100
  assert.equal(lb.getRank('p1'), 1);
  assert.equal(lb.getRank('p5'), 2);
});

test('Leaderboard - getAroundUser (Bonus Requirement)', () => {
  const lb = new Leaderboard<string>();
  for (let i = 1; i <= 20; i++) {
    lb.recordScore(`user_${i}`, i * 10);
  }

  // user_10 has score 100, rank 11 (user_20 is rank 1)
  const around = lb.getAroundUser('user_10', { above: 2, below: 2 });
  assert.equal(around.length, 5);
  assert.equal(around.some(u => u.member === 'user_10'), true);
});
