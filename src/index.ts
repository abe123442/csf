import './lib/setup';
import { LogLevel } from '@sapphire/framework';
import { GatewayIntentBits, Partials } from 'discord.js';
import { CseClient } from './cse-client';

const client = new CseClient({
	logger: {
		level: LogLevel.Debug
	},
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildPresences
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User]
});

const main = async () => {
	try {
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('Logged in');
	} catch (error) {
		client.logger.fatal(error);
		client.destroy();
		process.exit(1);
	}
};

main();
