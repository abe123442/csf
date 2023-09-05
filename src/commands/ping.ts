import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';

@ApplyOptions<Command.Options>({
    name: 'ping',
    description: 'Replies with Pong!'
})
export class PingCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand({
            name: this.name,
            description: this.description
        });
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        return await interaction.reply('🏓 Pong!');
    }
}