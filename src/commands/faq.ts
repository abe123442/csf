import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { EmbedBuilder, SlashCommandSubcommandBuilder } from "discord.js";
import { DBFaq } from "../lib/database/DBFaq";
import { DiscordScroll } from "../lib/discordscroll/scroller";

@ApplyOptions<Command.Options>({ description: 'Master FAQ command' })
export class FaqCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(builder => builder
            .setName(this.name)
            .setDescription(this.description)
            .addSubcommand(this.commandFAQGet)
            .addSubcommand(this.commandFAQGetAll)
            .addSubcommand(this.commandFAQHelp)
            .addSubcommand(this.commandFAQGetKeywords)
            .addSubcommand(this.commandFAQGetTags)
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const subcommand = interaction.options.getSubcommand(true);
        switch (subcommand) {
            case "get":
                await this.handleFAQGet(interaction);
                break;
            case "getall":
                await this.handleFAQGetAll(interaction);
                break;
            case "help":
                await this.handleFAQHelp(interaction);
                break;
            case "keywords":
                await this.handleFAQKeywords(interaction);
                break;
            case "tags":
                await this.handleFAQTags(interaction);
                break;
            default:
                await interaction.reply("Internal Error AHHHHHHH! CONTACT ME PLEASE!");
        }
    }

    private commandFAQGet = new SlashCommandSubcommandBuilder()
        .setName("get")
        .setDescription("Get the information related to a particular keyword")
        .addStringOption((option) =>
            option.setName("keyword").setDescription("Keyword for the question.").setRequired(true),
        );

    private async handleFAQGet(interaction: Command.ChatInputCommandInteraction) {
        const keyword = interaction.options.getString("keyword", true).toLowerCase();

        const faqDB = new DBFaq(this.container.database);
        const faq = await faqDB.faqGet(keyword);

        if (faq) {
            const { answer } = faq;
            await interaction.reply(`FAQ: ${keyword}\n${answer}`);
        } else {
            await interaction.reply({
                content: "A FAQ for this keyword does not exist!",
                ephemeral: true,
            });
        }
    }

    private commandFAQGetAll = new SlashCommandSubcommandBuilder()
        .setName("getall")
        .setDescription("Get *all* information related to a particular keyword")
        .addStringOption((option) =>
            option.setName("tag").setDescription("Tag to be searched for.").setRequired(true),
        );

    private async handleFAQGetAll(interaction: Command.ChatInputCommandInteraction) {
        const tag = interaction.options.getString("tag", true).toLowerCase();

        const faqDB = new DBFaq(this.container.database);
        const faqs = await faqDB.faqGetTagged(tag);

        if (faqs) {
            const answers: EmbedBuilder[] = [];
            for (const faq of faqs) {
                const newPage = new EmbedBuilder({
                    title: `FAQS for the tag: ${tag}`,
                    color: 0xf1c40f,
                    timestamp: new Date().getTime(),
                });

                newPage.addFields({
                    name: faq.keyword,
                    value: faq.answer!,
                    inline: true
                });
                answers.push(newPage);
            }
            const scroller = new DiscordScroll(answers);
            await scroller.send(interaction);
        } else {
            await interaction.reply({
                content: "A FAQ for this keyword does not exist!",
                ephemeral: true,
            });
        }
    }

    private commandFAQHelp = new SlashCommandSubcommandBuilder()
        .setName("help")
        .setDescription("Get some information about the help command");

    async handleFAQHelp(interaction: Command.ChatInputCommandInteraction) {
        // @TODO: expand this function
        let description = "Welcome to the help command! You can search for a specific faq";
        description += " by keyword using 'faq get [keyword]', or for everything on a given ";
        description += "topic by using 'faq getall [tag]'. ";
        description += "Use 'faq keywords' to get a list of all keywords, or ";
        description += "use 'faq tags' to get a list of all tags.";
        await interaction.reply(description);
    }

    private commandFAQGetKeywords = new SlashCommandSubcommandBuilder()
        .setName("keywords")
        .setDescription("Get all keywords that exist for current FAQs");

    private async handleFAQKeywords(interaction: Command.ChatInputCommandInteraction) {
        const faqDB = new DBFaq(this.container.database);
        const keywords = await faqDB.faqGetKeywords();

        if (keywords) {
            await interaction.reply(`Current list of keyword is:\n${keywords}`);
        } else {
            await interaction.reply({
                content: "No keywords currently in database!",
                ephemeral: true,
            });
        }
    }

    private commandFAQGetTags = new SlashCommandSubcommandBuilder()
        .setName("tags")
        .setDescription("Get all tags that exist for current FAQs");

    private async handleFAQTags(interaction: Command.ChatInputCommandInteraction) {
        const faqDB = new DBFaq(this.container.database);
        const tags = await faqDB.faqGetTags();
        if (tags) {
            await interaction.reply(`Current list of tags is:\n${tags}`);
        } else {
            await interaction.reply({
                content: "No tags currently in database!",
                ephemeral: true,
            });
        }
    }
}