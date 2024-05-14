# Application Processor

Application Processor keeps track of when and where you've applied to along with your progress in those processes. Make sure to add a `config.json` file before running the application.

## Prerequisites

- [Node.js](https://nodejs.org/) (version 20.x or later)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- Any Cloud Service provider to run this on
- Knowledge of OracleDB or some other SQL database

## Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/CC-0000/application_processor_bot.git
    cd application_processor_bot
    ```

2. Install the dependencies:

    ```sh
    npm install
    ```

3. Run the App:
    ```sh
    node index.js
    ```

## Configuration

Before running the application, you need to create a `config.json` file in the root directory of the project containing some configuration details for the project. Here is an example of what the `config.json` file should look like:

```json
{
    "TOKEN": "your_discord_bot_token",
    "username": "your_database_username",
    "password": "your_database_password",
    "connectionString" : "your_database_connection_string"
}
