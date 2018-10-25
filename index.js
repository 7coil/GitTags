// https://typedgit.bowser65.tk/

const sqlite = require('sqlite3').verbose();
const eris = require('eris');
const token = require('./token.json');
const fetch = require('node-fetch');

const client = new eris.Client(token.token);
const db = new sqlite.Database('db.db');

const prefix = 'git>'

client.on('messageCreate', (message) => {
  if (message.content.startsWith(prefix)) {
    const query = message.content.substr(prefix.length).trim();
    fetch(`https://typedgit.bowser65.tk/github/lepon01/gittag/master/tags/${encodeURIComponent(query)}`)
      .then(data => data.text())
      .then(text => message.channel.createMessage(text));
  }
});

client.connect();

process.on('SIGINT', function() {
  console.log('Goodbye!');
  db.close();
  client.disconnect();
  process.exit(0);
});
