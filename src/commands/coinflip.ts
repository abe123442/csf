import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import path from 'path';

// need to configure a tool like babel or webpack to copy over the images in cointoss_images
// currently manually copying over that directory to dist/data/
@ApplyOptions<Command.Options>({
    name: 'coinflip',
    description: 'Tosses a coin 💰'
})
export class CoinflipCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand({
            name: this.name,
            description: this.description
        });
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const coinNum = Math.floor(Math.random() * 2);
        const coin = coinNum === 0 ? "heads" : "tails";

        const img = coinNum === 0 ? "attachment://heads.png" : "attachment://tails.png";
        let file = coinNum === 0 ? "../data/cointoss_images/heads.png" : "../data/cointoss_images/tails.png";
        file = path.join(__dirname, file);
        const embed = new EmbedBuilder().setTitle(`it's ${coin}!`).setImage(img);
        return await interaction.reply({ embeds: [embed], files: [file] });
    }
}