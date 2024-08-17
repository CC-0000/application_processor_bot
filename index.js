import { Client, GatewayIntentBits } from 'discord.js';
import config from './config.json' with { type: "json" };
import { fetchDaily, fireAtTime } from './lc_daily.js';  
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
      else if (commands.length == 2 && commands[0] == 'check') {
        getProcess(message.author.username, commands[1]).then((messageString) => {
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
  progress == 'offer' ||
  progress == 'reject') {
    return true;
  }
  return false;
}


/*************************
 * Discord Bot Leetcode Daily Post Code
 *************************/
fireAtTime(0, 30, () => {
  console.log('fetching and posting daily')
  postDailyToThread();
});

async function postDailyToThread() {
  const message_to_send = await fetchDaily();
  const channel = await client.channels.cache.find(
		(channel) => channel.name === "lc-grind"
	);
	channel.send({ content: message_to_send });
}

/********************
 * Keeping the database alive
 *******************/

fireAtTime(0, 20, () => {
  console.log('firing a get stats call')
  getStats('null')
})

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
      type: DataTypes.UUID,  // maps to UUID V4
      defaultValue: DataTypes.UUIDV4 , // auto generate
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
      type: DataTypes.DATE(6),
      defaultValue: DataTypes.NOW
    }
  },
  {
    // Other model options go here
  },
);

Entry.sync();

async function deleteEntry(user, company, progress) {
	try {
		Entry.destroy({
			where: {
				user: user,
				company: company,
				progress: progress,
			},
		});
	} catch (err) {
		console.error(err);
	}
}

async function addEntry(user, company, progress) {
	try {
		const [_, created] = await Entry.findOrCreate({
			where: { 
        user: user, 
        company: company, 
        progress: progress 
      },
			defaults: {},
		});

		if (!created) {
			console.log("failed to create the database entry");
		}
	} catch (err) {
		console.error(err);
	}
}

// get the dates for a specific company
async function getProcess(user, company) {
  let messageString = "";
  const results = await getStats(user, company);
  for (let i = 0; i < results.length; i++) {
    // this means that they have apps
    if (results[i] != null) {
      let sentence = (results[i].getUTCMonth() + 1) + "/" + results[i].getUTCDate() + " -> ";
      switch (i) {
        case 0:
          sentence += "apply";
          break;
        case 1:
          sentence += "OA";
          break;
        case 2:
          sentence += "phone";
          break;
        case 3:
          sentence += "technical";
          break;
        case 4:
          sentence += "final";
          break;
        case 5:
          sentence += "offer";
          break;
        default:
          break;
      }
      messageString += sentence;
      messageString += "\n";
    }
  }
  if (messageString.length > 0) {
    messageString = messageString.slice(0, -1);
  }
  return messageString;
}

async function getStats(user, company = null) {
	try {
		const promises = [
			getApps(user, company),
			getOAs(user, company),
			getPhones(user, company),
			getTechnicals(user, company),
			getFinals(user, company),
			getOffers(user, company),
      getRejections(user, company),
		];
		const results = await Promise.all(promises);
		return results;
	} catch (err) {
		console.error(err);
	}
}

async function getApps(user, company = null) {
  let entries = [];
  if (company == null) {
    entries = await Entry.findAll({
      where: {
        user: user,
        progress: "apply",
      },
    });
  }
  else {
    const entry = await Entry.findOne({
      where: {
        user: user,
        company: company,
        progress: "apply",
      },
    });
    return entry == null ? null : entry.timestamp; // JAVSCRIPT ALLOWS MULTIPLE RETURN TYPES
  }
	return entries.length;
}

async function getOAs(user, company = null) {
  let entries = [];
  if (company == null) {
    entries = await Entry.findAll({
      where: {
        user: user,
        progress: "oa",
      },
    });
  }
  else {
    const entry = await Entry.findOne({
      where: {
        user: user,
        company: company,
        progress: "oa",
      },
    });
    return entry == null ? null : entry.timestamp; // JAVSCRIPT ALLOWS MULTIPLE RETURN TYPES
  }
	return entries.length;
}

async function getPhones(user, company = null) {
  let entries = [];
  if (company == null) {
    entries = await Entry.findAll({
      where: {
        user: user,
        progress: "phone",
      },
    });
  }
  else {
    const entry = await Entry.findOne({
      where: {
        user: user,
        company: company,
        progress: "phone",
      },
    });
    return entry == null ? null : entry.timestamp; // JAVSCRIPT ALLOWS MULTIPLE RETURN TYPES
  }
	return entries.length;
}

async function getTechnicals(user, company = null) {
  let entries = [];
  if (company == null) {
    entries = await Entry.findAll({
      where: {
        user: user,
        progress: "technical",
      },
    });
  }
  else {
    const entry = await Entry.findOne({
      where: {
        user: user,
        company: company,
        progress: "technical",
      },
    });
    return entry == null ? null : entry.timestamp; // JAVSCRIPT ALLOWS MULTIPLE RETURN TYPES
  }
	return entries.length;
}

async function getFinals(user, company = null) {
  let entries = [];
  if (company == null) {
    entries = await Entry.findAll({
      where: {
        user: user,
        progress: "final",
      },
    });
  }
  else {
    const entry = await Entry.findOne({
      where: {
        user: user,
        company: company,
        progress: "final",
      },
    });
    return entry == null ? null : entry.timestamp; // JAVSCRIPT ALLOWS MULTIPLE RETURN TYPES
  }
	return entries.length;
}

async function getOffers(user, company = null) {
  let entries = [];
  if (company == null) {
    entries = await Entry.findAll({
      where: {
        user: user,
        progress: "offer",
      },
    });
  }
  else {
    const entry = await Entry.findOne({
      where: {
        user: user,
        company: company,
        progress: "offer",
      },
    });
    return entry == null ? null : entry.timestamp; // JAVSCRIPT ALLOWS MULTIPLE RETURN TYPES
  }
	return entries.length;
}

async function getRejections(user, company = null) {
  let entries = [];
  if (company == null) {
    entries = await Entry.findAll({
      where: {
        user: user,
        progress: "reject",
      },
    });
  }
  else {
    const entry = await Entry.findOne({
      where: {
        user: user,
        company: company,
        progress: "reject",
      },
    });
    return entry == null ? null : entry.timestamp; // JAVSCRIPT ALLOWS MULTIPLE RETURN TYPES
  }
	return entries.length;
}


// Log into the server
client.login(config.TOKEN);

