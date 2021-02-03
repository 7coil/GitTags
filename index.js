const Handlebars = require("handlebars");
const handlebarsHelpers = require("handlebars-helpers");

const sqlite = require("sqlite3").verbose();
const Eris = require("eris");
const fetch = require("node-fetch");
const seedrandom = require("seedrandom");
const fs = require("fs");
const path = require("path");

const config = require("./config.json");

const client = new Eris(config.token);
const db = new sqlite.Database("db.db");

// Create the Channels Database if it doesn't exist
db.exec(`CREATE TABLE IF NOT EXISTS options (
  channelID TEXT NOT NULL,
  owner TEXT,
  repo TEXT,
  PRIMARY KEY(channelID)
)`);

const fetchSettings = db.prepare("SELECT * FROM options WHERE channelID = (?)");
const setSettings = db.prepare(
  "INSERT OR REPLACE INTO options (channelID, owner, repo) VALUES (?, ?, ?)"
);

/**
 * Handlebars Helpers
 */
Handlebars.registerHelper("repeat", (times, block) => {
  let result = "";
  for (let i = 0; i < times; i += 1) {
    result += block.fn(i);
  }
  return result;
});
Handlebars.registerHelper("timestamp", () => Date.now());
handlebarsHelpers.array({ handlebars: Handlebars });
handlebarsHelpers.comparison({ handlebars: Handlebars });
handlebarsHelpers.inflection({ handlebars: Handlebars });
handlebarsHelpers.match({ handlebars: Handlebars });
handlebarsHelpers.misc({ handlebars: Handlebars });
handlebarsHelpers.number({ handlebars: Handlebars });
handlebarsHelpers.object({ handlebars: Handlebars });
handlebarsHelpers.regex({ handlebars: Handlebars });
handlebarsHelpers.string({ handlebars: Handlebars });
handlebarsHelpers.url({ handlebars: Handlebars });
handlebarsHelpers.date({ handlebars: Handlebars });
handlebarsHelpers.math({ handlebars: Handlebars });
// handlebarsHelpers.utils({handlebars: Handlebars});

/**
 * Functions
 */
const fetchById = (id) =>
  new Promise((resolve, reject) => {
    fetchSettings.get(id, (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        resolve({
          owner: row.owner,
          repo: row.repo,
        });
      } else {
        resolve({
          owner: config.default.owner,
          repo: config.default.repo,
        });
      }
    });
  });

const sendMessage = (text, erisMessage, extraInfo = {}) =>
  new Promise((resolve, reject) => {
    console.log(extraInfo);

    const template = Handlebars.compile(text);
    const author = erisMessage.author;
    const dayRandom = seedrandom(
      config.random + new Date().toISOString().split("T")[0]
    );

    const result = template({
      ...extraInfo,
      author: {
        id: author.id,
        bot: author.bot,
        avatar: author.avatar,
        avatarURL: author.avatarURL,
        defaultAvatar: author.defaultAvatar,
        defaultAvatarURL: author.defaultAvatarURL,
        discriminator: author.discriminator,
        staticAvatarURL: author.staticAvatarURL,
        username: author.username,
        mention: author.mention,
        _client: {
          token: "Gay Baby Jail",
        },
      },
      dayRandom: dayRandom(),
    });

    let messageContent = result;

    try {
      // Try to parse the content into an object
      messageContent = JSON.parse(result);
    } catch {
    } finally {
      // Send the message via Eris
      erisMessage.channel
        .createMessage(messageContent)
        .then(resolve)
        .catch((e) => {
          // Send the error that occured while trying to send the message
          erisMessage.channel.createMessage(e.message);
        });
    }
  });

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const { owner, repo } = await fetchById(message.channel.id);

  const isSettingsPrefix = message.content.startsWith(config.prefix.settings);
  const isOutputPrefix = message.content.startsWith(config.prefix.output);

  if (isSettingsPrefix) {
    // Get the command the user is trying to get at
    const command = message.content
      .substr(config.prefix.settings.length)
      .trim();

    if (command.startsWith("set")) {
      // If in a server and doesn't have the correct roles, complain
      // Otherwise, or if not in a server, set the configuration
      if (
        message.member &&
        !message.member.permission.has("manageGuild") &&
        !config.owners.includes(message.author.id)
      ) {
        message.channel.createMessage(
          'You don\'t have the "Manage Guild" permission!'
        );
      } else {
        const input = command.substr(3).trim().split(/[;/]$/);
        let [newOwner, newRepo] = input;

        console.log(input)

        if (!newOwner) newOwner = config.default.owner;
        if (!newRepo) newRepo = config.default.repo;

        setSettings.run(
          message.channel.id,
          encodeURIComponent(newOwner),
          encodeURIComponent(newRepo)
        );
        message.channel.createMessage(
          `**GitTags Repository Set!**\nhttps://github.com/${newOwner}/${newRepo}`
        );
      }

      // If the user calls the info command, print out their current configuration
    } else {
      const fileLocation = path.resolve("./tags", encodeURIComponent(command));

      console.log(fileLocation);

      if (!fileLocation.startsWith(path.resolve("./tags"))) return;
      if (!fs.existsSync(fileLocation)) return;

      const helpFile = fs.readFileSync(fileLocation, { encoding: "utf-8" });
      sendMessage(helpFile, message, {
        owner,
        repo,
        command,
        isSettingsPrefix,
        isOutputPrefix,
      });
    }

    // If the output prefix is encountered
  } else if (isOutputPrefix) {
    // Get the name of the tag
    const query = message.content.substr(config.prefix.output.length).trim();

    // If the tag is actually there, but isn't too long
    if (query.length > 0 && query.length < 1024) {
      // Fetch that tag
      fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/master/tags/${encodeURIComponent(
          query
        )}`
      )
        .then((data) => data.text())
        .then((text) =>
          sendMessage(text, message, {
            owner,
            repo,
            command,
            isSettingsPrefix,
            isOutputPrefix,
          })
        );
    }
  }
});

client.on("connect", () => {
  console.log("Connected!");
});

client.connect();

process.on("SIGINT", function () {
  console.log("Goodbye!");
  db.close();
  client.disconnect();
  process.exit(0);
});
