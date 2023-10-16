import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { GuildChannel } from 'discord.js';
import { DBMessageLogs } from '../lib/database/DBMessageLogs';

@ApplyOptions<Listener.Options>({ once: false, event: Events.ChannelCreate })
export class ChannelCreateListener extends Listener {
	public override async run(channel: GuildChannel) {
		const { database } = this.container;
		let logDB = new DBMessageLogs(database);
		await logDB.channelAdd(BigInt(channel.id), channel.name, BigInt(channel.guildId));
	}
}
