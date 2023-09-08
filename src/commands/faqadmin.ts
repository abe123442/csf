import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { CommandInteractionOption, PermissionFlagsBits, SlashCommandSubcommandBuilder } from "discord.js";
import { DBFaq } from "../lib/database/DBFaq";

// faq admin delete
const commandFAQADelete = new SlashCommandSubcommandBuilder()
    .setName("delete")
    .setDescription("[ADMIN] Delete a FAQ entry.")
    .addStringOption((option) =>
        option.setName("keyword").setDescription("The identifying word.").setRequired(true),
    );

// faq admin create
const commandFAQACreate = new SlashCommandSubcommandBuilder()
    .setName("create")
    .setDescription("[ADMIN] Create a FAQ entry.")
    .addStringOption((option) =>
        option.setName("keyword").setDescription("The identifying word.").setRequired(true),
    )
    .addStringOption((option) =>
        option.setName("answer").setDescription("The answer to the question.").setRequired(true),
    )
    .addStringOption((option) =>
        option.setName("tags").setDescription("The answer to the question.").setRequired(false),
    );

@ApplyOptions<Command.Options>({ description: '[ADMIN] Master FAQ admin command ' })
export class FaqAdminCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(builder => builder
            .setName(this.name)
            .setDescription(this.description)
            .addSubcommand(commandFAQACreate)
            .addSubcommand(commandFAQADelete)
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const faqDB = new DBFaq(this.container.database);

        if (!interaction.inCachedGuild()) return;

        // Admin permission check (this may not work uhm)
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                content: "You do not have permission to execute this command.",
                ephemeral: true,
            });
            return;
        }

        // figure out which command was called
        const subcommand = interaction.options.getSubcommand(false);
        let keyword: string | null = null;
        let answer: string | null = null;
        let tags: string | null = null;
        let success: boolean | null = false;
        let get_keyword: CommandInteractionOption | null = null;

        switch (subcommand) {
            case "create":
                get_keyword = interaction.options.get("keyword");
                const get_answer = interaction.options.get("answer");
                if (get_keyword == null || get_answer == null) return;

                keyword = String(get_keyword.value).toLowerCase();
                answer = String(get_answer.value);
                if (answer.length >= 1024) {
                    await interaction.reply({
                        content: "The answer must be < 1024 characters...",
                        ephemeral: true,
                    });
                }

                console.log("gets here");
                const get_tags = interaction.options.get("tags");
                if (get_tags != null) {
                    tags = String(get_tags.value);
                    // validate "tags" string
                    if (tags) {
                        tags = tags.trim();
                        const tagRegex = /^([a-zA-Z]+,)*[a-zA-Z]+$/;
                        if (!tagRegex.test(tags)) {
                            await interaction.reply({
                                content: "ERROR: tags must be comma-separated alphabetic strings",
                                ephemeral: true,
                            });
                            break;
                        }
                    }
                }

                success = await faqDB.faqAdd(keyword, answer, tags!);
                if (success) {
                    await interaction.reply({
                        content: `Successfully created FAQ entry for '${keyword}': ${answer}`,
                        ephemeral: true,
                    });
                } else {
                    await interaction.reply({
                        content: "Something went wrong, make sure you are using a unique keyword!",
                        ephemeral: true,
                    });
                }
                break;
            case "delete":
                get_keyword = interaction.options.get("keyword");
                if (get_keyword == null) return;

                keyword = String(get_keyword.value).toLowerCase();
                success = await faqDB.faqDelete(keyword);
                if (success) {
                    await interaction.reply({
                        content: `Successfully Deleted FAQ entry for '${keyword}'.`,
                        ephemeral: true,
                    });
                } else {
                    await interaction.reply({
                        content: "Something went wrong, make sure you are giving a unique keyword!",
                        ephemeral: true,
                    });
                }
                break;
            default:
                await interaction.reply("Internal Error OH NO! CONTACT ME PLEASE!");
        }
    }
}