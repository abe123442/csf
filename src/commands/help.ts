import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, EmbedBuilder } from "discord.js";
import { commands } from "../data/help.json";

// Creates general object and id constants for function use

const PAGE_SIZE = 10;

const prevId = "helpPrevButtonId";
const nextId = "helpNextButtonId";

const createPrevButton = () => new ButtonBuilder({
    style: ButtonStyle.Secondary,
    label: "Previous",
    emoji: "⬅️",
    customId: prevId,
});

const createNextButton = () => new ButtonBuilder({
    style: ButtonStyle.Secondary,
    label: "Next",
    emoji: "➡️",
    customId: nextId,
});

const generateEmbed = (start: number) => {
    const current = commands.slice(start, start + PAGE_SIZE);
    const pageNum = Math.floor(start / PAGE_SIZE) + 1;

    return new EmbedBuilder({
        title: `Help Command - Page ${pageNum}`,
        color: 0x3a76f8,
        author: {
            name: "CSESoc Bot",
            icon_url: "https://i.imgur.com/EE3Q40V.png",
        },
        fields: current.map((command, index) => ({
            name: `${start + index + 1}. ${command.name}`,
            value: `${command.description}\nUsage: ${command.usage}`,
        })),
    });
};

@ApplyOptions<Command.Options>({
    name: 'help',
    description: 'Displays info for all commands. Also type / in the chat to check out other commands.'
})
export class HelpCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(builder => builder
            .setName(this.name)
            .setDescription(this.description)
            .addNumberOption((option) =>
                option.setName("page")
                    .setDescription("Requested Help Page")
                    .setRequired(false)
            )
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        // Calculates required command page index if inputted
        const page = interaction.options.getNumber("page");
        let currentIndex = 0;

        if (page) {
            if (page < 1 || page > Math.ceil(commands.length / PAGE_SIZE)) {
                const ephemeralError = {
                    content: "Your requested page does not exist, please try again.",
                    ephemeral: true,
                };

                return await interaction.reply(ephemeralError);
            } else {
                const adjustedIndex = (page - 1) * PAGE_SIZE;
                if (adjustedIndex < commands.length) {
                    currentIndex = adjustedIndex;
                }
            }
        }

        // Generates help menu with given or default index and posts embed
        const helpEmbed = generateEmbed(currentIndex);
        const authorId = interaction.user.id;

        const row = new ActionRowBuilder<ButtonBuilder>();
        if (currentIndex) {
            row.addComponents(createPrevButton());
        }
        if (currentIndex + PAGE_SIZE < commands.length) {
            row.addComponents(createNextButton());
        }
        await interaction.reply({ embeds: [helpEmbed], components: [row] });

        // Creates a collector for button interaction events, setting a 120s maximum
        // timeout and a 30s inactivity timeout

        const filter = (resInteraction: ButtonInteraction) => {
            return (
                (resInteraction.customId === prevId || resInteraction.customId === nextId) &&
                resInteraction.user.id === authorId
            );
        };

        const collector = interaction.channel!.createMessageComponentCollector({
            filter,
            componentType: ComponentType.Button,
            time: 120000,
            idle: 30000,
        });

        collector.on("collect", async (i) => {
            // Adjusts the currentIndex based on the id of the button pressed
            i.customId === prevId ? (currentIndex -= PAGE_SIZE) : (currentIndex += PAGE_SIZE);

            const row = new ActionRowBuilder<ButtonBuilder>();
            if (currentIndex) {
                row.addComponents(createPrevButton());
            }
            if (currentIndex + PAGE_SIZE < commands.length) {
                row.addComponents(createNextButton());
            }

            await i.update({ embeds: [generateEmbed(currentIndex)], components: [row] });
        });

        // Clears buttons from embed page after timeout on collector
        /*eslint-disable */
        collector.on("end", () => {
            interaction.editReply({ components: [] });
        });

        return Promise.resolve();
    }
}