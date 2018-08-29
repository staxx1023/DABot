const path = require('path')
const dbPath = path.resolve('./db/', 'users.db')
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log(dbPath);
});
db.all('SELECT chips FROM Users', [], (err, rows) => {
  if (err) {
    throw err;
  }
  rows.forEach((row) => {
    console.log(row.chips);
  });
});
db.close();