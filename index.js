import { Client, GatewayIntentBits } from 'discord.js';
import config from './config.json' with { type: "json" };
import { addEntry, deleteEntry, getStats } from './progress.js';
import { fireAtTime,fetchDaily } from './lc_daily.js';  
import { Sequelize, DataTypes  } from 'sequelize';

/*************************
 * Discord Bot Messaging Code
 *************************/
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


/*************************
 * Discord Bot Leetcode Daily Post Code
 *************************/
fireAtTime(0, 30, () => {
  console.log('fetching and posting daily')
  fetchDaily();
});


/*************************
 * Syncing up with Oracle DB
 *************************/
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
      type: DataTypes.UUID.V4,  // maps to UUID V4
      defaultValue: sql.uuidV4, // auto generate
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
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    // Other model options go here
  },
);

Entry.sync();

// Log into the server
client.login(config.TOKEN);

