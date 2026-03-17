import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5433),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'admin',
  database: process.env.DB_NAME || 'content-management',
})

export const db = drizzle(pool, { schema })