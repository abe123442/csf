import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';

@ApplyOptions<Command.Options>({
	description: 'Bot and API latency check'
})
export class LatencyCommand extends Command {
	// Register Chat Input and Context Menu command
	public override registerApplicationCommands(registry: Command.Registry) {
		// Register Chat Input command
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});
	}

	// Chat Input (slash) command
	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return await this.sendPing(interaction);
	}

	private async sendPing(interaction: Command.ChatInputCommandInteraction) {
		const request = await interaction.reply({ content: 'Requesting latency...', fetchReply: true });

		const response = `Bot Latency ${Math.round(this.container.client.ws.ping)}ms. \nAPI Latency ${
			request.createdTimestamp - interaction.createdTimestamp
		}ms.`;

		return await interaction.editReply({ content: response });
	}
}
