const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// Open SQLite database connection (returns a promise)
const dbPromise = open({
  filename: path.join(__dirname, '../../database.sqlite'), // database file path
  driver: sqlite3.Database
});

module.exports = dbPromise;
