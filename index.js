import config from './config.json' with { type: "json" };  
import { Sequelize, DataTypes  } from 'sequelize';
import oracledb from 'oracledb';
 
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
    const emoji = '✅';
    message.react(emoji);
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
      type: DataTypes.STRING,
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
async function runApp()
{
    let connection;
    try {
      console.log('trying connection')
      // Use the connection string copied from the cloud console
      // and stored in connstring.txt file from Step 2 of this tutorial
      connection = await oracledb.getConnection({ user: config.username, password: config.password, connectionString: config.connectionString });
      console.log('connection obtained')
      // Create a table
      await connection.execute(`begin execute immediate 'drop table nodetab'; exception when others then if sqlcode <> -942 then raise; end if; end;`);
      await connection.execute(`create table nodetab (id number, data varchar2(20))`);

      // Insert some rows
      const sql = `INSERT INTO nodetab VALUES (:1, :2)`;
      const binds = [ [1, "First" ], [2, "Second" ], [3, "Third" ], [4, "Fourth" ], [5, "Fifth" ], [6, "Sixth" ], [7, "Seventh" ] ];
      await connection.executeMany(sql, binds);
      // connection.commit(); // uncomment to make data persistent

      // Now query the rows back
      const result = await connection.execute(`SELECT * FROM nodetab`);
      console.dir(result.rows, { depth: null });
    } catch (err) {
      console.error(err);
    } finally {
    if (connection)
      {
        try {
            await connection.close();
          } catch (err) {
            console.error(err);
        }
      }
    }
}
runApp();