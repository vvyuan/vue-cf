const colors = require('colors');

console.log('vue-cf helper'.yellow);
console.log('you can use command:');
console.log('"cfc" or "cfConfigCreator" to create a "CFConfig" file from mysql.');
console.log('also use a config file("cf.config.json"), like this:');
const demo = {
  db: {
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'root',
    database: 'demoDB',
  }
};
console.log(JSON.stringify(demo, '', 2));
