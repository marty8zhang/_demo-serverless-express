import serverless from 'serverless-http';
import express from 'express';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import mariadb from 'mariadb';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const databaseConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};
const pool = mariadb.createPool(databaseConfig);

async function testDatabase() {
  let conn;
  try {
    conn = await pool.getConnection();

    const dropDatabaseResult = await conn.query(`
DROP DATABASE IF EXISTS ${process.env.DB_DATABASE}
`);
    console.log('Database dropped:', dropDatabaseResult);

    // Note: Certain `COLLATE`s are only supported by certain server versions.
    const createDatabaseResult = await conn.query(`
CREATE DATABASE IF NOT EXISTS ${process.env.DB_DATABASE}
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci
`);
    console.log('Database created:', createDatabaseResult);

    const useDatabaseResult = await conn.query(`USE ${process.env.DB_DATABASE}`);
    console.log('Using database:', useDatabaseResult);

    const tableCreationResult = await conn.query(`
CREATE TABLE IF NOT EXISTS Test_Table (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(191) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);
    console.log('Table created:', tableCreationResult);

    const rowInsertionResult = await conn.query(`
INSERT INTO Test_Table (name) VALUES
('Marty'),
('Doc'),
('Jennifer')
`);
    console.log('Row insertion result:', rowInsertionResult);

    const selectResult = await conn.query('SELECT * FROM Test_Table');
    console.log('All rows:', JSON.stringify(selectResult));
    console.log('Meta:', JSON.stringify(selectResult.meta));
  } catch (err) { // eslint-disable-line no-useless-catch
    throw err;
  } finally {
    if (conn) {
      conn.release();
    }
  }
}

app.post('/', async (req, res, next) => {
  try {
    await testDatabase();

    res.status(200).json({ message: 'Tests all passed!', requestBody: req.body });
  } catch (e) {
    res.status(500).json({ message: e.message, details: e.details, databaseConfig });
  }
});

app.get('/', (req, res, next) => res.status(200).json({
  message: 'Hello from root!',
}));

app.get('/hello', (req, res, next) => res.status(200).json({
  message: 'Hello from path!',
}));

app.use((req, res, next) => res.status(404).json({
  error: 'Not Found',
}));

const serverlessHandler = serverless(app);

export async function handler(event: APIGatewayProxyEvent, context: Context) {
  // To fix the `Cannot GET null` issue.
  // eslint-disable-next-line no-param-reassign
  event.path = event.path === '' ? '/' : event.path;

  return await serverlessHandler(event, context);
}

export { handler as default };
