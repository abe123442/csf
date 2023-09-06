import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';


interface IXkcdJSON {
    month: string;
    link: string;
    year: string;
    safe_title: string;
    transcript: string;
    alt: string;
    img: string;
    title: string;
    day: string;
}

@ApplyOptions<Command.Options>({
    name: 'xkcd',
    description: 'Replies with a new xkcd joke!'
})
export class XkcdCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(builder =>
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addSubcommand((subcommand) =>
                    subcommand.setName("latest").setDescription("Get the latest xkcd comic."),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("get")
                        .setDescription("Get xkcd comic by its id.")
                        .addIntegerOption((option) =>
                            option
                                .setName("comic-id")
                                .setRequired(true)
                                .setDescription("The number id of the xkcd comic you want to get"),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand.setName("random").setDescription("Get a random xkcd comic."),
                )
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const xkcd = require('xkcd-api');
        switch (interaction.options.getSubcommand()) {
            case "latest":
                return await xkcd.latest(async (err: any, res: IXkcdJSON) => {
                    return await this.xkcd_response(err, res, interaction)
                });
            case "get":
                const comic_id = interaction.options.getInteger("comic-id", true);
                return await xkcd.get(comic_id, async (err: any, res: IXkcdJSON) => {
                    return await this.xkcd_response(err, res, interaction)
                });
            case "random":
                return await xkcd.random(async (err: any, res: IXkcdJSON) => {
                    return await this.xkcd_response(err, res, interaction)
                });
        }
    }

    private async xkcd_response (err: any, res: IXkcdJSON, interaction: Command.ChatInputCommandInteraction) {
        if (err) {
            console.error(err);
            return await interaction.reply({
                content: `sorry something went wrong!😔`,
                ephemeral: true,
            });
        } else {
            const embed = new EmbedBuilder()
                .setTitle(res.safe_title)
                .setImage(res.img);
            return await interaction.reply({ embeds: [embed] });
        }
    }
}