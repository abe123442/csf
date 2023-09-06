import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { PermissionFlagsBits } from 'discord.js';
import { DBMessageLogs } from '../lib/database/DBMessageLogs';
import { allowedChannels } from '../data/anon_channel.json';
import { ChannelType } from 'discord.js';
import fs from 'fs';
import path from 'path';

async function customReply(interaction: Command.ChatInputCommandInteraction, msg: string) {
    return await interaction.reply({ content: msg, ephemeral: true });
}

@ApplyOptions<Command.Options>({
    name: 'anonymouspost',
    description: 'Make a post anonymously, the bot will send it on your behalf.'
})
export class AnonymousPostCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(builder => {
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("current")
                        .setDescription("post anonymously in the current channel")
                        .addStringOption((option) =>
                            option
                                .setName("message")
                                .setDescription("Enter the text you wish to post anonymously")
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("channel")
                        .setDescription("post anonymously in another channel")
                        .addStringOption((option) =>
                            option
                                .setName("message")
                                .setDescription("Enter the text you wish to post anonymously")
                                .setRequired(true),
                        )
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("Enter the channel you wish to post anonymously in")
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("allow")
                        .setDescription("[ADMIN] Allows a channel to be added.")
                        .addChannelOption((option) =>
                            option.setName("channel").setDescription("Channel to allow").setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("allowcurrent")
                        .setDescription("[ADMIN] Allows channel which command is executed to be added."),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("disallow")
                        .setDescription("[ADMIN] Disallows a channel to be added.")
                        .addChannelOption((option) =>
                            option
                                .setName("channel")
                                .setDescription("Channel to disallow")
                                .setRequired(true),
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("disallowcurrent")
                        .setDescription(
                            "[ADMIN] IDisallows channel which command is executed to be added.",
                        ),
                )
                .addSubcommand((subcommand) =>
                    subcommand
                        .setName("whitelist")
                        .setDescription("[ADMIN] Displays the list of allowed channels."),
                )
        });
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild()) {
            return await interaction.reply('Interaction not created from a cached guild!');
        }

        const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        const subCommand = interaction.options.getSubcommand(true);

        switch (subCommand) {
            case "current":
                return await this.postMsgInCurrentChannel(interaction);
            case "channel":
                return await this.postMsgInSpecifiedChannel(interaction);
            default:
                if (!isAdmin) {
                    return await customReply(interaction, "You do not have permission to execute this command.");
                }

                switch (subCommand) {
                    case "allow":
                        return this.allowPostInCurrentChannel(interaction);
                    case "allowcurrent":

                        break;
                    case "disallow":

                        break;
                    case "disallowcurrent":

                        break;
                    case "whitelist":
                        break;
                }

        }
        return;
    }



    private async postMsgInCurrentChannel(interaction: Command.ChatInputCommandInteraction) {
        const logDB = new DBMessageLogs(this.container.database);

        // check if the interaction's channel is in the allowedChannels JSON
        if (!allowedChannels.some(c => c === interaction.channelId)) {
            const c_name = await logDB.channelGet(Number(interaction.channelId));
            const msg = `❌ | You are not allowed to post anonymously in the channel \`${c_name?.channel_name}\`.`;
            return await customReply(interaction, msg);
        }

        const text = interaction.options.getString("message", true);
        const { username, id } = interaction.user;
        await logDB.messageAdd(Number(interaction.id), Number(id), username, text, Number(interaction.channelId));
        await interaction.reply({ content: "Done!", ephemeral: true });
        return await interaction.channel?.send({
            content: `${text} \n\n(The above message was anonymously posted by a user)`,
            allowedMentions: {}
        });
    }


    private async postMsgInSpecifiedChannel(interaction: Command.ChatInputCommandInteraction) {
        const channel = interaction.options.getChannel("channel", true);
        const [c_name, c_id] = [channel.name, channel.id];
        const [u_name, u_id] = [interaction.user.username, interaction.user.id];

        if (channel.type !== ChannelType.GuildText) {
            return await customReply(interaction, `❌ | Channel \`${c_name}\` is not a text channel!`);
        } else if (!allowedChannels.some((c) => c === c_id)) {
            return await customReply(interaction, `❌ | You are not allowed to post anonymously in the channel \`${c_name}\`.`);
        }

        const msg = interaction.options.getString("message", true);
        const logDB = new DBMessageLogs(this.container.database);
        await logDB.messageAdd(Number(interaction.id), Number(u_id), u_name, msg, Number(c_id));

        await customReply(interaction, "Done!");
        return await interaction.channel?.send({
            content: `${msg} \n\n(The above message was anonymously posted by a user)`,
            allowedMentions: {}
        });
    }


    private async allowPostInCurrentChannel(interaction: Command.ChatInputCommandInteraction) {
        const channel = interaction.options.getChannel("channel", true);

        if (allowedChannels.some((c) => c === channel.id)) {
            return await customReply(
                interaction,
                `❌ | The allowed channels list already contains \`${channel.name}\`.`
            );
        } else if (channel.type !== ChannelType.GuildText) {
            return await customReply(interaction, `❌ | Channel \`${channel.name}\` is not a text channel!`);
        }

        (allowedChannels as any[]).push(channel.id);
        const write_path = path.join(__dirname, '../data/anon_channel.json');

        fs.writeFileSync(write_path, JSON.stringify({ allowedChannels: allowedChannels }, null, 4));

        return await interaction.reply({
            content: `✅ | Allowed the channel \`${channel.name}\`.`,
            ephemeral: true,
        });
    }
}