import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Message } from 'discord.js';
import { DBStandup } from '../lib/database/DBStandup';
import { DBMessageLogs } from '../lib/database/DBMessageLogs';
import { PrismaClient } from '@prisma/client';
import { isTextChannel } from '@sapphire/discord.js-utilities';

const messagelog = async (message: Message, database: PrismaClient) => {
	// ignore messages sent from bot
	if (message.author.bot) {
		return;
	}

	const logDB = new DBMessageLogs(database);
	await logDB.messageAdd(Number(message.id), Number(message.author.id), message.author.username, message.content, BigInt(message.channelId));
};

@ApplyOptions<Listener.Options>({ once: false, event: Events.MessageCreate })
export class MessageCreateListener extends Listener {
	public override async run(message: Message) {
		const { database } = this.container;
		const standupDB = new DBStandup(database);
		await messagelog(message, database);

		if (message.content.startsWith('$standup') && isTextChannel(message.channel)) {
			// Get standup content
			const messages: string = String(message.content);
			const messageContent: string = messages.slice(8).trim();
			const teamId = Number(message.channel.parentId);
			const standupAuthorId = Number(message.author.id);

			await standupDB.standupAdd(teamId, standupAuthorId, Number(message.id), messageContent);
		}
	}
}
