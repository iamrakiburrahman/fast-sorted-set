import { FastSortedSet } from '../src/sorted-set.js';

console.log('🚀 Running High-Throughput Performance Benchmark...');
const set = new FastSortedSet<string>();
const TOTAL = 50000;

// 1. Insertion Benchmark
console.time(`⏱️ Inserted ${TOTAL.toLocaleString()} items`);
for (let i = 0; i < TOTAL; i++) {
  set.add(`user_${i}`, Math.floor(Math.random() * 1000000));
}
console.timeEnd(`⏱️ Inserted ${TOTAL.toLocaleString()} items`);

// 2. Rank Lookup Benchmark (O(log N))
console.time(`⏱️ 10,000 Random Rank Lookups`);
for (let i = 0; i < 10000; i++) {
  const randomId = `user_${Math.floor(Math.random() * TOTAL)}`;
  set.rank(randomId);
}
console.timeEnd(`⏱️ 10,000 Random Rank Lookups`);

// 3. Top 10 Query Benchmark
console.time('⏱️ 10,000 Top-10 Leaderboard Queries');
for (let i = 0; i < 10000; i++) {
  set.range(0, 9, { reverse: true });
}
console.timeEnd('⏱️ 10,000 Top-10 Leaderboard Queries');

console.log(`✅ Benchmark Finished Successfully! Total elements in memory: ${set.size.toLocaleString()}\n`);
