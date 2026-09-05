/* eslint-disable no-console */
/**
 * Connectivity pre-flight. Verifies MONGODB_URI before you run the seed,
 * and turns the driver's cryptic failures into something actionable.
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';

const redact = (uri) => uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

const DIAGNOSIS = [
  {
    match: (message) => /ECONNREFUSED/.test(message),
    hint: 'Nothing is listening at that address.\n  - Local MongoDB: make sure the service is running.\n  - Atlas: your URI should start with mongodb+srv:// not mongodb://',
  },
  {
    match: (message) => /Authentication failed|bad auth/i.test(message),
    hint: 'Wrong username or password.\n  - Did you replace <db_password> with the real password?\n  - Special characters must be URL-encoded (@ becomes %40).\n  - Check the user exists under Atlas > Database Access.',
  },
  {
    match: (message) => /IP that isn|whitelist|not allowed to connect/i.test(message),
    hint: 'Your IP address is blocked.\n  - Atlas > Network Access > Add IP Address > Allow access from anywhere.',
  },
  {
    match: (message) => /ENOTFOUND|querySrv/i.test(message),
    hint: 'The cluster hostname could not be resolved.\n  - Check the host part of the URI for typos.\n  - Check your internet connection.',
  },
];

const run = async () => {
  console.log(`\nConnecting to: ${redact(env.mongoUri)}\n`);

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });

    const { name, host } = mongoose.connection;
    const collections = await mongoose.connection.db.listCollections().toArray();

    console.log('  Connection successful.');
    console.log(`  Host:     ${host}`);
    console.log(`  Database: ${name}`);
    console.log(`  Collections: ${collections.length === 0 ? 'none yet (run "npm run seed")' : collections.length}`);
    console.log('\nYou are good to go. Next: npm run seed\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`  Connection FAILED: ${error.message}\n`);

    const diagnosis = DIAGNOSIS.find((entry) => entry.match(error.message));
    console.error(diagnosis ? `  Likely cause:\n  ${diagnosis.hint}\n` : '  Check MONGODB_URI in server/.env\n');

    process.exit(1);
  }
};

run();
