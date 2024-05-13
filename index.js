import config from './config.json' with { type: "json" };  
import { Sequelize, DataTypes  } from 'sequelize';

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
});

client.login(config.TOKEN);

// Define SQL Models and Connect to DATABASE
const sequelize = new Sequelize({
  dialect: 'oracle',
  username: config.username,
  password: config.password,
  dialectOptions: {connectString: config.connectionString}});

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
    // console.log('trying connection')
    // // Use the connection string copied from the cloud console
    // // and stored in connstring.txt file from Step 2 of this tutorial
    // connection = await oracledb.getConnection({ user: config.username, password: config.password, connectionString: config.connectionString });
    // console.log('connection obtained')
    // // Create a table
    // await connection.execute(`begin execute immediate 'drop table nodetab'; exception when others then if sqlcode <> -942 then raise; end if; end;`);
    // await connection.execute(`create table nodetab (id number, data varchar2(20))`);

    // // Insert some rows
    // const sql = `INSERT INTO nodetab VALUES (:1, :2)`;
    // const binds = [ [1, "First" ], [2, "Second" ], [3, "Third" ], [4, "Fourth" ], [5, "Fifth" ], [6, "Sixth" ], [7, "Seventh" ] ];
    // await connection.executeMany(sql, binds);
    // // connection.commit(); // uncomment to make data persistent

    // // Now query the rows back
    // const result = await connection.execute(`SELECT * FROM nodetab`);
    // console.dir(result.rows, { depth: null });



  } catch (err) {
    console.error(err);
  } finally {
//   if (connection)
//     {
//       try {
//           await connection.close();
//         } catch (err) {
//           console.error(err);
//       }
//     }
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