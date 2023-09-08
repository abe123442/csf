import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { GuildChannel } from 'discord.js';
import { DBMessageLogs } from '../lib/database/DBMessageLogs';

@ApplyOptions<Listener.Options>({ once: true, event: Events.ChannelCreate })
export class ReadyMessageLogsDBListener extends Listener {
    public override async run(channel: GuildChannel) {
        console.log('TRIGGERED CHANNEL CREATE');
        const { database } = this.container;
        let logDB = new DBMessageLogs(database);
        await logDB.channelAdd(BigInt(channel.id), channel.name, BigInt(channel.guildId));
    }
}
