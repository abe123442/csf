import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';

@ApplyOptions<Command.Options>({
	name: '24plus',
	description: 'Generates 4 random numbers from 1 to 12 and a random target from 1 to 100.'
})
export class Generate24Command extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand({
			name: this.name,
			description: this.description
		});
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const MAX = 11;
		const MAX_TARGET = 99;

		const resultNums: number[] = [];
		for (let i = 0; i < 4; i++) {
			const random = Math.round(Math.random() * MAX) + 1;
			resultNums.push(random);
		}

		const target = Math.round(Math.random() * MAX_TARGET) + 1;
		const output = `Your numbers are: ${resultNums.join(' ')}, with a target of ${target}`;
		await interaction.reply(output);
	}
}
