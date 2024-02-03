import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const { HOST, USER, PASS, DB } = process.env;

(async () => {

  const connection = await mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASS,
    database: DB
  });

  (await getAllTables(connection)).forEach((results) => {
    console.log(results);
  });

})()

/**
 * @desc general raw sql queries
 */

async function SQLQuery(sql: string, connection: mysql.Connection): Promise<[mysql.OkPacket | mysql.RowDataPacket[] | mysql.ResultSetHeader[] | mysql.RowDataPacket[][] | mysql.OkPacket[] | mysql.ProcedureCallPacket, mysql.FieldPacket[]]> {
    return await connection.query(sql);
}

/**
 * @desc get all tables within database
 */
async function getAllTables(connection: mysql.Connection): Promise<[mysql.OkPacket | mysql.RowDataPacket[] | mysql.ResultSetHeader[] | mysql.RowDataPacket[][] | mysql.OkPacket[] | mysql.ProcedureCallPacket, mysql.FieldPacket[]]> {
    const query = 'SELECT table_name FROM information_schema.tables WHERE table_schema = ?';
    return await SQLQuery(query, connection);
}