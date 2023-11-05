import { Pool } from 'pg';

require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB,
    password: process.env.DB_PASSWORD,
    port: 5432,
    ssl: true
});
  
const db = {
      query: (text, params) => {
          const start = Date.now();
          return pool.query(text, params)
              .then(res => {
                  const duration = Date.now() - start;
                  return res;
              });
      },
      pool: pool
}

export { db };