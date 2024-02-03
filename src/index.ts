import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const { HOST, PASS, DB, PORT } = process.env;
const USER = 'root';

type TableFromArrayType = { TABLE_NAME: string };
type FindFKContraitsType = {
  fK_contraint_key: string;
  row_name: string;
  fk_referenced_table_name: string;
  fk_referenced_table_name_id: string;
}

(async () => {

  const connection = await mysql.createConnection({
    host: HOST,
    user: USER,
    password: PASS,
    database: DB,
    port: Number(PORT)
  });

  const [table_data, meta] =  await getAllTables(connection);
  const tables: TableFromArrayType[] = table_data as TableFromArrayType[];

  tables.forEach(async (table: TableFromArrayType) => {
    const results = await findFKContraints(table.TABLE_NAME, connection);
    results.map(async (result) => {
      console.log({
        tableName: result.fk_referenced_table_name,
        rowName: result.row_name,
        fkContraintKey: result.fK_contraint_key,
        fkReferencedTableName: result.fk_referenced_table_name,
        fkReferencedTableNameId: result.fk_referenced_table_name_id,
      })
      await updateForeignKeyConstraint({
        tableName: table.TABLE_NAME,
        rowName: result.row_name,
        fkContraintKey: result.fK_contraint_key,
        fkReferencedTableName: result.fk_referenced_table_name,
        fkReferencedTableNameId: result.fk_referenced_table_name_id,
        connection: connection
      })
    });
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
    const query = 'SELECT table_name FROM information_schema.tables WHERE table_schema = ' + connection.escape(connection.config.database);
    return await connection.query(query);
}

/**
 * @desc take each table name and find FK contraints within it
 */
async function findFKContraints(table_name: string, connection: mysql.Connection): Promise<FindFKContraitsType[]> {

  const query = `
    SELECT
      CONSTRAINT_NAME AS fk_constraint_key,
      COLUMN_NAME AS row_name,
      REFERENCED_TABLE_NAME AS fk_referenced_table_name,
      REFERENCED_COLUMN_NAME AS fk_referenced_table_name_id
    FROM
      INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE
      TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL;
  `;

  const [results] = await connection.query(query, [table_name]);
  let fkConstraints = [];

  if(Array.isArray(results)) {
    fkConstraints = results.map((row) => {
    
      return {
        row_name: row.row_name,
        fK_contraint_key: row.fK_contraint_key,
        fk_referenced_table_name: row.fk_referenced_table_name,
        fk_referenced_table_name_id: row.fk_referenced_table_name_id,
      };
    });
  }

  return fkConstraints;
}

async function updateForeignKeyConstraint(option : {
  tableName: string,
  rowName: string,
  fkContraintKey: string,
  fkReferencedTableName: string,
  fkReferencedTableNameId: string,
  connection: mysql.Connection
}): Promise<void> {
  try {
    const {
      tableName,
      rowName,
      fkContraintKey,
      fkReferencedTableName,
      fkReferencedTableNameId,
      connection
    } = option;

    // Drop existing foreign key constraint
    await dropForeignKeyConstraint(tableName, fkContraintKey, connection);

    // Add a new foreign key constraint with ON DELETE SET NULL
    await addNewForeignKeyConstraint(tableName, rowName, fkReferencedTableName, fkReferencedTableNameId, connection);

    console.log('Foreign key constraint updated successfully.');
  } catch (error) {
    console.error('Error updating foreign key constraint:', error);
  }
}

async function dropForeignKeyConstraint(tableName: string, fkContraintKey: string, connection: mysql.Connection): Promise<void> {
  const dropForeignKeyQuery = `ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${fkContraintKey}\``;
  console.log(dropForeignKeyQuery);
  await connection.query(dropForeignKeyQuery);
}

async function addNewForeignKeyConstraint(
  tableName: string,
  rowName: string,
  referencedTableName: string,
  referencedTableNameId: string,
  connection: mysql.Connection
): Promise<void> {
  const modifyForeignKeyQuery = `
    ALTER TABLE \`${tableName}\` 
    MODIFY COLUMN \`${rowName}\` INT NULL;
  `;
  const addForeignKeyQuery = `
    ALTER TABLE \`${tableName}\`
    ADD FOREIGN KEY (\`${rowName}\`) REFERENCES \`${referencedTableName}\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION;
  `;
  console.log(modifyForeignKeyQuery, addForeignKeyQuery)
  await connection.query(modifyForeignKeyQuery);
  await connection.query(addForeignKeyQuery);
}
