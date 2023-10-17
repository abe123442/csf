import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Message } from 'discord.js';
import { DBMessageLogs } from '../lib/database/DBMessageLogs';
import { PrismaClient } from '@prisma/client';

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
    await messagelog(message, database);
  }
}
