import assert from 'assert';

import { PrismaClient } from '@prisma/client';

assert(
  process.env.DATABASE_URL,
  'process.env.DATABASE_URL is required to run the BOT'
);

export default new PrismaClient();
