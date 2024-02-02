import mysql from 'mysql2/promise';

const HOST = "";
const USER = "";
const PASS = "";
const DB = "";

(async () => {

  const connection = await mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASS,
    database: DB
  });



})()


async function SQLQuery(sql: string, connection: mysql.Connection) {
    return await connection.query(sql);
}

async function getAllTables(connection: mysql.Connection) {
    const query = 'SELECT table_name FROM information_schema.tables WHERE table_schema = ?';

    return connection.query(query, [connection.config.database])
}