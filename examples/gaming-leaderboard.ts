import { Leaderboard } from '../src/index.js';

console.log('🎮 Real-Time Mobile Gaming Leaderboard Simulation (Alex Xu Chapter 25)');
const tournament = new Leaderboard<string>();

// Record initial players
tournament.recordScore('player_rakib', 1250);
tournament.recordScore('player_ayesha', 1650);
tournament.recordScore('player_nayeem', 1420);
tournament.recordScore('player_tanvir', 980);
tournament.recordScore('player_sakib', 1100);

console.log('\n🏆 Initial Top 3 Leaderboard:');
console.table(tournament.getTop(3));

console.log('\n👤 Rakib Status before match:');
console.log({ rank: tournament.getRank('player_rakib'), score: tournament.getScore('player_rakib') });

// Rakib wins a big tournament match
tournament.addPoints('player_rakib', 600);
console.log('\n💥 Rakib won +600 points!');

console.log('\n🏆 Updated Top 3 Leaderboard:');
console.table(tournament.getTop(3));

console.log('\n👤 Rakib Status after match:');
console.log({ rank: tournament.getRank('player_rakib'), score: tournament.getScore('player_rakib') });
