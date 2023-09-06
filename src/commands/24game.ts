import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';

@ApplyOptions<Command.Options>({
    name: '24',
    description: 'Generates 4 random numbers from 0 to 9!'
})
export class Generate24Command extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand({
            name: this.name,
            description: this.description
        });
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const MAX = 9;

        const resultNums: number[] = [];
        for (let i = 0; i < 4; i++) {
            const random = Math.round(Math.random() * MAX);
            resultNums.push(random);
        }

        const output = `Your numbers are: ${resultNums.join(" ")}`;

        await interaction.reply(output);
    }
}