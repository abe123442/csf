import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import axios from 'axios';
import { EmbedBuilder } from 'discord.js';

interface IJokeResponse {
	type: string;
	setup: string;
	punchline: string;
	id: number;
}

@ApplyOptions<Command.Options>({
	name: 'joke',
	description: 'Replies with a new joke!'
})
export class JokeCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		try {
			const api_url = 'https://official-joke-api.appspot.com/random_joke';
			const res = await axios.get(api_url);
			const data: IJokeResponse = res.data;
			const embed = new EmbedBuilder().setTitle(data.setup).setDescription(data.punchline);

			interaction.reply({ embeds: [embed], ephemeral: true });
		} catch (error) {
			console.log(error);
			interaction.reply({
				content: `sorry something went wrong!😔`,
				ephemeral: true
			});
		}
	}
}
