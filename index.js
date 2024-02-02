const mysql = require('mysql2');

const HOST = "";
const USER = "";
const PASS = "";
const DB = "";

const connection = mysql.createConnection({
  host: 'your_database_host',
  user: 'your_database_user',
  password: 'your_database_password',
  database: 'your_database_name'
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.stack);
    return;
  }
  console.log('Connected to MySQL as id', connection.threadId);

  // Perform database operations here

  connection.end((err) => {
    if (err) {
      console.error('Error closing MySQL connection:', err.stack);
      return;
    }
    console.log('Connection closed.');
  });
});
