import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { ChannelType } from 'discord.js';
import { DBMessageLogs } from '../lib/database/DBMessageLogs';

@ApplyOptions<Listener.Options>({ once: true, event: Events.ClientReady })
export class ReadyMessageLogsDBListener extends Listener {
	public override async run() {
		const { client, database } = this.container;
		const guilds = client.guilds.cache.map((g) => g.id);

		guilds.forEach((guild_id) => {
			const guild = client.guilds.cache.get(guild_id);
			const channelsCollection = guild?.channels.cache;

			if (!channelsCollection) {
				return;
			}

			const channels = [...channelsCollection.values()].filter((channel) => channel.type === ChannelType.GuildText);

			let logDB = new DBMessageLogs(database);
			channels.forEach(async (channel) => {
				await logDB.channelAdd(BigInt(channel.id), channel.name, BigInt(guild.id));
			});
		});
	}
}
