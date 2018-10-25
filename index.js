// https://typedgit.bowser65.tk/

const sqlite = require('sqlite3').verbose();
const eris = require('eris');
const token = require('./token.json');
const config = require('./config.json');
const fetch = require('node-fetch');

const client = new eris.Client(token.token);
const db = new sqlite.Database('db.db');

const settingsPrefix = 'git<';
const outputPrefix = 'git>';

const defaultOwner = 'lepon01';
const defaultRepo = 'gittag';

// Create the Channels Database if it doesn't exist
db.exec(`CREATE TABLE IF NOT EXISTS options (
  channelID TEXT NOT NULL,
  owner TEXT,
  repo TEXT,
  PRIMARY KEY(channelID)
)`);

client.on('messageCreate', (message) => {
  db.get(`SELECT * FROM options WHERE channelID = ('${message.channel.id}')`, (err, row) => {
    let owner = defaultOwner;
    let repo = defaultRepo;

    // If the row exists, set the owner and repo to their custom settings
    if (row) {
      owner = row.owner;
      repo = row.repo;
    }

    if (message.content.startsWith(settingsPrefix)) {
      const command = message.content.substr(settingsPrefix.length).trim();
      if (command.startsWith('set')) {
        // If in a server and doesn't have the correct roles, complain
        // Otherwise, or if not in a server, set the configuration
        if ((message.member && !message.member.roles.includes(eris.Constants.manageGuild)) && !config.owners.includes(message.author.id)) {
          message.channel.createMessage('You don\'t have the "Manage Guild" permission!');
        } else {
          const input = command.substr(3).trim().split(';');
          owner = input[0] || defaultOwner;
          repo = input[1] || defaultRepo;
          db.run(`INSERT OR REPLACE INTO options (channelID, owner, repo) VALUES ('${message.channel.id}', '${encodeURIComponent(owner)}', '${encodeURIComponent(repo)}')`);
          message.channel.createMessage(`**Set Configuration**\nOwner: ${owner}\nRepo: ${repo}`);
        }
      } else if (command.startsWith('info')) {
        message.channel.createMessage(`**Current Configuration**\nOwner: ${owner}\nRepo: ${repo}`);
      }
    } else if (message.content.startsWith(outputPrefix)) {
      const query = message.content.substr(outputPrefix.length).trim();
      if (query.length > 0) {
        fetch(`https://typedgit.bowser65.tk/github/${owner}/${repo}/master/tags/${encodeURIComponent(query)}`)
          .then(data => data.text())
          .then((text) => {
            if (text.length <= 2000) {
              message.channel.createMessage(text)
            } else {
              message.channel.createMessage('_File too long for consumption_');
            }
          });
      }
    }
  })
});

client.connect();

process.on('SIGINT', function() {
  console.log('Goodbye!');
  db.close();
  client.disconnect();
  process.exit(0);
});
