# TypeScript Discord Bot (sapphirejs) 

This is a rewrite of the CSESoc Discord bot using the [sapphire framework][sapphire] fully written in TypeScript.

## How to use it?

### Prerequisite

```sh
npm install
```

### Development

This example can be run with `tsc-watch` to watch the files and automatically restart your bot.

Note: you may need to run the following command if you are running this for the first time:
```sh
npx prisma migrate dev    # create the tables used by bot commands
```

Then run each of the below commands in a separate terminal tab / window.
```sh
docker-compose up         # to start the database and the database management tool 
npm run watch:start       # to start the bot in watch mode 
```

### Production

You can also run the bot with `npm dev`, this will first build your code and then run `node ./dist/index.js`. But this is not the recommended way to run a bot in production.

## License

Dedicated to the public domain via the [Unlicense], courtesy of the Sapphire Community and its contributors.

[sapphire]: https://github.com/sapphiredev/framework
[unlicense]: https://github.com/sapphiredev/examples/blob/main/LICENSE.md
