// https://typedgit.bowser65.xyz/

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

const fetchSettings = db.prepare('SELECT * FROM options WHERE channelID = (?)');
const setSettings = db.prepare('INSERT OR REPLACE INTO options (channelID, owner, repo) VALUES (?, ?, ?)')

// Create the Channels Database if it doesn't exist
db.exec(`CREATE TABLE IF NOT EXISTS options (
  channelID TEXT NOT NULL,
  owner TEXT,
  repo TEXT,
  PRIMARY KEY(channelID)
)`);

client.on('messageCreate', (message) => {
  fetchSettings.get(message.channel.id, (err, row) => {
    let owner = defaultOwner;
    let repo = defaultRepo;

    // If the row exists, set the owner and repo to their custom settings
    if (row) {
      owner = row.owner;
      repo = row.repo;
    }

    // If the settings prefix is encountered...
    if (message.content.startsWith(settingsPrefix)) {
      // Get the command the user is trying to get at
      const command = message.content.substr(settingsPrefix.length).trim();

      if (command.startsWith('set')) {
        // If in a server and doesn't have the correct roles, complain
        // Otherwise, or if not in a server, set the configuration
        if ((message.member && !message.member.permission.has('manageGuild')) && !config.owners.includes(message.author.id)) {
          message.channel.createMessage('You don\'t have the "Manage Guild" permission!');
        } else {
          const input = command.substr(3).trim().split(/[;/]/);
          owner = input[0] || defaultOwner;
          repo = input[1] || defaultRepo;
          setSettings.run(message.channel.id, encodeURIComponent(owner), encodeURIComponent(repo));
          message.channel.createMessage(`**Set Configuration**\nOwner: ${owner}\nRepo: ${repo}`);
        }

      // If the user calls the info command, print out their current configuration
      } else if (command.startsWith('info')) {
        message.channel.createMessage(`**Current Configuration**\nOwner: ${owner}\nRepo: ${repo}`);
      }

    // If the output prefix is encountered
    } else if (message.content.startsWith(outputPrefix)) {
      // Get the name of the tag
      const query = message.content.substr(outputPrefix.length).trim();

      // If the tag is actually there, but isn't too long
      if (query.length > 0 && query.length < 1024) {
        // Fetch that tag
        fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/tags/${encodeURIComponent(query)}`)
          .then(data => data.text())
          .then((text) => {
            // If the text length is too long, tell the user that
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
