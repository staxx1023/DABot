var os = require("os");
var fs = require('fs');
var path = require("path");

const dbPath = path.resolve('./db/', 'users.db')
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log(dbPath);
});

var users = new Map();

//chips
var chips = fs.readdirSync('users/');
chips.forEach(function (file) {
    users.set(file, { chips: fs.readFileSync('users/'+file), rating: 1500, rd: 200, v: 0.06, lt: 0 });
});

//rating
var rating = fs.readdirSync('elos/');
rating.forEach(function (file) {
    var toAdd = { chips: 10, rating: 1500, rd: 200, v: 0.06, lt: 0 };
    if (users.has(file)) {
        toAdd = users.get(file);
    }
    toAdd.rating = fs.readFileSync('elos/'+file);
    users.set(file, toAdd);
});

//rating devantion
var rd = fs.readdirSync('rds/');
rd.forEach(function (file) {
    var toAdd = { chips: 10, rating: 1500, rd: 200, v: 0.06, lt: 0 };
    if (users.has(file)) {
        toAdd = users.get(file);
    }
    toAdd.rd = fs.readFileSync('rds/'+file);
    users.set(file, toAdd);
});

//volitilty
var v = fs.readdirSync('vs/');
v.forEach(function (file) {
    var toAdd = { chips: 10, rating: 1500, rd: 200, v: 0.06, lt: 0 };
    if (users.has(file)) {
        toAdd = users.get(file);
    }
    toAdd.v = fs.readFileSync('vs/'+file);
    users.set(file, toAdd);
});

//tests
var lt = fs.readdirSync('tests/');
lt.forEach(function (file) {
    var toAdd = { chips: 10, rating: 1500, rd: 200, v: 0.06, lt: 0 };
    if (users.has(file)) {
        toAdd = users.get(file);
    }
    toAdd.lt = fs.readFileSync('tests/'+file);
    users.set(file, toAdd);
});

var keys = Array.from(users.keys());

keys.forEach(function (key) {
    var string = 'INSERT INTO Users VALUES ('+key+', '+users.get(key).chips+', '+users.get(key).lt+', '+users.get(key).rating+', '+users.get(key).rd+', '+users.get(key).v+');';
console.log('Welcome to My Console,');
    setTimeout(function() {
        console.log(string);
        db.run(string);
        console.log('Blah blah blah blah extra-blah');
    }, 25000);
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


