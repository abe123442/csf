import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { GuildChannel } from 'discord.js';
import { DBMessageLogs } from '../lib/database/DBMessageLogs';

@ApplyOptions<Listener.Options>({ once: false, event: Events.ChannelDelete })
export class ChannelDeleteListener extends Listener {
	public override async run(channel: GuildChannel) {
		console.log('TRIGGERED CHANNEL DELETE');
		const { database } = this.container;
		let logDB = new DBMessageLogs(database);
		await logDB.channelDelete(BigInt(channel.id));
	}
}
