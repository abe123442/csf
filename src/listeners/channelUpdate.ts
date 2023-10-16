import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Channel, ChannelType } from 'discord.js';
import { DBMessageLogs } from '../lib/database/DBMessageLogs';

@ApplyOptions<Listener.Options>({ once: false, event: Events.ChannelUpdate })
export class ChannelUpdateListener extends Listener {
	public override async run(channel: Channel) {
		if (channel.type !== ChannelType.GuildText) return Promise.resolve();

		const { database } = this.container;
		let logDB = new DBMessageLogs(database);

		const old_name = (await logDB.channelGet(BigInt(channel.id)))?.channel_name;
		const new_name = channel.messages.channel.name;

		if (old_name != new_name) {
			await logDB.channelUpdateName(BigInt(channel.id), new_name);
		}
	}
}
