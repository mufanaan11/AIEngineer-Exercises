import 'dotenv/config';
import { getDb } from './mongo.js';

const movies = [
  { title: 'Interstellar', year: 2014, genre: 'Sci-Fi', rating: 8.7, director: 'Christopher Nolan', description: 'A team travels through a wormhole to save humanity.' },
  { title: 'The Matrix', year: 1999, genre: 'Sci-Fi', rating: 8.7, director: 'The Wachowskis', description: 'A hacker discovers reality is a simulation.' },
  { title: 'Blade Runner 2049', year: 2017, genre: 'Sci-Fi', rating: 8.0, director: 'Denis Villeneuve', description: 'A young blade runner uncovers a long-buried secret.' },
  { title: 'The Godfather', year: 1972, genre: 'Drama', rating: 9.2, director: 'Francis Ford Coppola', description: 'The aging patriarch of a crime dynasty transfers control to his son.' },
  { title: 'Whiplash', year: 2014, genre: 'Drama', rating: 8.5, director: 'Damien Chazelle', description: 'A young drummer is pushed to his limits by an abusive instructor.' },
  { title: 'The Dark Knight', year: 2008, genre: 'Action', rating: 9.0, director: 'Christopher Nolan', description: 'Batman faces the Joker, a criminal mastermind.' },
  { title: 'Mad Max: Fury Road', year: 2015, genre: 'Action', rating: 8.1, director: 'George Miller', description: 'A woman rebels against a tyrant in a post-apocalyptic wasteland.' },
  { title: 'Get Out', year: 2017, genre: 'Horror', rating: 7.7, director: 'Jordan Peele', description: 'A young man uncovers a disturbing secret at his girlfriend\'s family estate.' },
  { title: 'Parasite', year: 2019, genre: 'Thriller', rating: 8.5, director: 'Bong Joon-ho', description: 'Greed and class discrimination threaten a newly formed symbiotic relationship.' },
  { title: 'Superbad', year: 2007, genre: 'Comedy', rating: 7.6, director: 'Greg Mottola', description: 'Two high school friends navigate their last days before graduation.' }
];

const users = [
  { name: 'Alice Kim', email: 'alice@example.com', age: 28, favorite_genre: 'Sci-Fi' },
  { name: 'Bob Torres', email: 'bob@example.com', age: 34, favorite_genre: 'Drama' },
  { name: 'Chen Wu', email: 'chen@example.com', age: 22, favorite_genre: 'Action' },
  { name: 'Dana Ellis', email: 'dana@example.com', age: 41, favorite_genre: 'Horror' },
  { name: 'Evan Price', email: 'evan@example.com', age: 19, favorite_genre: 'Comedy' }
];

const localJokes = [
  { text: "I'm afraid for the calendar. Its days are numbered.", category: 'dad', source: 'local', upvotes: 0, downvotes: 0 },
  { text: "Why don't skeletons fight each other? They don't have the guts.", category: 'dad', source: 'local', upvotes: 0, downvotes: 0 },
  { text: 'Why do programmers prefer dark mode? Because light attracts bugs.', category: 'programming', source: 'local', upvotes: 0, downvotes: 0 },
  { text: "There are 10 types of people: those who understand binary and those who don't.", category: 'programming', source: 'local', upvotes: 0, downvotes: 0 },
  { text: "I told my computer I needed a break, and it said no problem, it'll go to sleep.", category: 'general', source: 'local', upvotes: 0, downvotes: 0 },
  { text: 'Why did the scarecrow win an award? Because he was outstanding in his field.', category: 'general', source: 'local', upvotes: 0, downvotes: 0 }
];

async function seed() {
  const db = await getDb();

  await db.collection('movies').deleteMany({});
  const movieResult = await db.collection('movies').insertMany(movies);
  const movieIds = Object.values(movieResult.insertedIds);

  await db.collection('users').deleteMany({});
  const userResult = await db.collection('users').insertMany(users);
  const userIds = Object.values(userResult.insertedIds);

  const reviews = [
    { movie_id: movieIds[0], user_id: userIds[0], rating: 9, comment: 'Mind-bending and emotional.', date: new Date('2024-01-10') },
    { movie_id: movieIds[1], user_id: userIds[2], rating: 8, comment: 'A classic that holds up.', date: new Date('2024-02-14') },
    { movie_id: movieIds[3], user_id: userIds[1], rating: 10, comment: 'Best drama ever made.', date: new Date('2024-03-01') },
    { movie_id: movieIds[5], user_id: userIds[2], rating: 9, comment: "Heath Ledger's performance is unforgettable.", date: new Date('2024-03-20') },
    { movie_id: movieIds[8], user_id: userIds[3], rating: 9, comment: 'Sharp social commentary.', date: new Date('2024-04-05') }
  ];
  await db.collection('reviews').deleteMany({});
  await db.collection('reviews').insertMany(reviews);

  await db.collection('jokes').deleteMany({ source: 'local' });
  await db.collection('jokes').insertMany(localJokes.map((j) => ({ ...j, createdAt: new Date() })));

  console.log(`Seeded ${movies.length} movies, ${users.length} users, ${reviews.length} reviews, ${localJokes.length} local jokes.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
