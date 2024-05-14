import config from './config.json' with { type: "json" };  
import { Sequelize, DataTypes  } from 'sequelize';
import { gql, request } from "graphql-request"; 

// Discord Bot Code
import { Client, GatewayIntentBits } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.DirectMessages,
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', message => {
  if (message.author.bot) {
    return;
  }
  if (message.channel.name == 'progress') {
    if (message.content.length > 0 && message.content[0] == '!') {

      const commands = message.content.slice(1).split(" ");
      // convert to all lowercase
      for (let i = 0; i < commands.length; i++) {
        commands[i] = commands[i].toLowerCase();
      }
      
      // standard inputs
      if (commands.length == 3) {
        // e.g. process meta apply
        // check what they want to do
        if (commands[0] == 'process' && checkProgress(commands[2])) {
          addEntry(message.author.username, commands[1], commands[2]).then(() => {
            const emoji = '✅';
            message.react(emoji);      
          });
        }
        else if (commands[0] == 'undo' || commands[0] == 'remove' || commands[0] == 'cancel' || commands[0] == 'rm') {
          deleteEntry(message.author.username, commands[1], commands[2]).then(() => {
            const emoji = '✅';
            message.react(emoji);
          });
        }
      }
      else if (commands.length == 1 && commands[0] == 'stats' ) {
        getStats(message.author.username).then((results) => {
          console.log(results);
          let messageString = "Applications: " + results[0] + "; OAs: " + results[1] + "; Phones: " + results[2] + "; Technicals " + results[3] + "; Finals: " + results[4] + "; Offers: " + results[5];
          const emoji = '✅';
          message.react(emoji);
          message.reply(messageString); 
        })
      }
    }
  }
});

client.login(config.TOKEN);

// Code for Leetcode Querying
const getDailyQuery = gql`
  query {
    activeDailyCodingChallengeQuestion {
      link
    }
  }
`;

async function fetchDaily() {
  const res = await request("https://leetcode.com/graphql", getDailyQuery);
  const link = "https://leetcode.com" + res['activeDailyCodingChallengeQuestion']['link'];

  const channel = await client.channels.cache.find(channel => channel.name === "lc-grind")
  const now = new Date();
  const message_to_send = "Daily " + (now.getUTCMonth() + 1) + "/" + now.getUTCDate() + ": " + link;
  channel.send({content: message_to_send})
}

function createDateWithUTCTime(hourUTC, minuteUTC) {
  const now = new Date();

  // Create a new date object for the current date with specified UTC time
  const targetDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    hourUTC,
    minuteUTC,
    0, // Seconds
    0  // Milliseconds
  ));

  return targetDate;
}

function fireAtTime(hour, minute, func) {
  const now = new Date();
  const targetTime = createDateWithUTCTime(hour, minute);
  // const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);

  if (now > targetTime) {
    targetTime.setDate(targetTime.getDate() + 1);
  }

  const delay = targetTime - now;
  setTimeout(() => {
    func();
    setInterval(() => {
      func();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }, delay);
}

fireAtTime(0, 30, () => {
  console.log('fetching and posting daily')
  fetchDaily();
});


// Define SQL Models and Connect to DATABASE
const sequelize = new Sequelize({
  dialect: 'oracle',
  username: config.username,
  password: config.password,
  dialectOptions: {connectString: config.connectionString}}
);

const Entry = sequelize.define(
  'Entry',
  {
    // Model attributes are defined here
    id: {
      type: DataTypes.INTEGER,  // maps to INTEGER
      autoIncrement: true,      // automatically increment the value
      primaryKey: true,         // this is the table's primary key
      allowNull: false,         // value cannot be null
    },
    user: {
      type: DataTypes.STRING, // this is the discord username
    },
    company: {
      type: DataTypes.STRING,
    },
    progress : {
      type: DataTypes.STRING,
    }
  },
  {
    // Other model options go here
  },
);

Entry.sync();

// SQL functions

function checkProgress(progress) {
  if (progress == 'apply' || 
  progress == 'oa' || 
  progress == 'phone' || 
  progress == 'technical' ||
  progress == 'final' ||
  progress == 'offer') {
    return true;
  }
  return false;
}

async function deleteEntry(user, company, progress) {
  try {
    Entry.destroy({
      where: {
        user: user, 
        company: company, 
        progress: progress
      },
    });
  }
  catch(err) {
    console.error(err);
  }
}

async function addEntry(user, company, progress)
{
  // let connection;
  try {
    const [_, created] = await Entry.findOrCreate({
      where: { user: user, company: company, progress: progress },
      defaults: {
      },
    });
    if (!created) {
      console.log('failed to create the database entry')
    }
  } catch (err) {
    console.error(err);
  }
}

async function getStats(user) {
  try {
    const promises = [getApps(user), 
      getOAs(user), getPhones(user), 
      getTechnicals(user), 
      getFinals(user), getOffers(user)];
    const results = await Promise.all(promises);
    // const res1 = await getApps(user);
    // console.log("SIERTHIEUHISEUHTISHEISHT")
    // console.log("here ", res1);
    return results;
    // return []
  }
  catch(err) {
    console.error(err);
  }
}

async function getApps(user) {
  const entries = await Entry.findAll({
    where: {
      user: user,
      progress: 'apply'
    },
  });
  
  return entries.length;
}

async function getOAs(user) {
  const entries = await Entry.findAll({
    where: {
      user: user,
      progress: 'oa'
    },
  });
  return entries.length;
}

async function getPhones(user) {
  const entries = await Entry.findAll({
    where: {
      user: user,
      progress: 'phone'
    },
  });
  return entries.length;
}

async function getTechnicals(user) {
  const entries = await Entry.findAll({
    where: {
      user: user,
      progress: 'technical'
    },
  });
  return entries.length;
}

async function getFinals(user) {
  const entries = await Entry.findAll({
    where: {
      user: user,
      progress: 'final'
    },
  });
  return entries.length;
}

async function getOffers(user) {
  const entries = await Entry.findAll({
    where: {
      user: user,
      progress: 'offer'
    },
  });
  return entries.length;
}