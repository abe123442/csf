import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
// import { ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { DBMessageLogs } from '../lib/database/DBMessageLogs';
import { allowedChannels } from '../data/anon_channel.json';
import { ChannelType } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { Pagination } from 'pagination.djs';

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
                        return await this.allowPostInSpecificChannel(interaction);
                    case "allowcurrent":
                        return await this.allowPostInCurrentChannel(interaction);
                    case "disallow":
                        return await this.disallowPostInSpecificChannel(interaction);
                    case "disallowcurrent":
                        return await this.disallowPostInCurrentChannel(interaction);
                    case "whitelist":
                        return await this.getWhileListChannel(interaction);
                }

        }
        return;
    }


    private async postMsgInCurrentChannel(interaction: Command.ChatInputCommandInteraction) {
        const logDB = new DBMessageLogs(this.container.database);

        // check if the interaction's channel is in the allowedChannels JSON
        if (!allowedChannels.some(c => c === interaction.channelId)) {
            const channel = await logDB.channelGet(BigInt(interaction.channelId));
            const msg = `❌ | You are not allowed to post anonymously in the channel \`${channel?.channel_name}\`.`;
            return await customReply(interaction, msg);
        }

        const text = interaction.options.getString("message", true);
        const { username, id } = interaction.user;
        await logDB.messageAdd(Number(interaction.id), Number(id), username, text, BigInt(interaction.channelId));
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
        await logDB.messageAdd(Number(interaction.id), Number(u_id), u_name, msg, BigInt(c_id));

        await customReply(interaction, "Done!");
        return await interaction.channel?.send({
            content: `${msg} \n\n(The above message was anonymously posted by a user)`,
            allowedMentions: {}
        });
    }


    private async allowPostInSpecificChannel(interaction: Command.ChatInputCommandInteraction) {
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

        return await customReply(interaction, `✅ | Allowed the channel \`${channel.name}\`.`);
    }

    private async allowPostInCurrentChannel(interaction: Command.ChatInputCommandInteraction) {
        const logDB = new DBMessageLogs(this.container.database);
        const channel = await logDB.channelGet(BigInt(interaction.channelId));

        if (allowedChannels.some((c) => c === interaction.channelId)) {
            return await customReply(
                interaction,
                `❌ | The allowed channels list already contains \`${channel?.channel_name}\`. Channel ID - \`${interaction.channelId}\``
            );
        }

        (allowedChannels as any[]).push(interaction.channelId);

        const write_path = path.join(__dirname, '../data/anon_channel.json');
        fs.writeFileSync(write_path, JSON.stringify({ allowedChannels: allowedChannels }, null, 4));

        return await customReply(interaction, `✅ | Allowed the channel \`${channel?.channel_name}\`.`);
    }

    private async disallowPostInSpecificChannel(interaction: Command.ChatInputCommandInteraction) {
        const channel = interaction.options.getChannel("channel", true);

        if (!allowedChannels.some((c) => c === channel.id)) {
            return await customReply(
                interaction,
                `❌ | The allowed channels does not contain \`${channel.name}\`.`
            );
        } else if (channel.type !== ChannelType.GuildText) {
            return await customReply(interaction, `❌ | Channel \`${channel.name}\` is not a text channel!`);
        }

        const spliceStart = (allowedChannels as any[]).indexOf(channel.id);
        (allowedChannels as any[]).splice(spliceStart, 1);

        const write_path = path.join(__dirname, '../data/anon_channel.json');
        fs.writeFileSync(write_path, JSON.stringify({ allowedChannels: allowedChannels }, null, 4));

        return await customReply(interaction, `✅ | Disallowed the channel \`${channel.name}\`.`);
    }

    private async disallowPostInCurrentChannel(interaction: Command.ChatInputCommandInteraction) {
        const logDB = new DBMessageLogs(this.container.database);
        const channel = await logDB.channelGet(BigInt(interaction.channelId));

        if (!allowedChannels.some((c) => c === interaction.channelId)) {
            return await customReply(
                interaction,
                `❌ | The allowed channel list does not contain \`${channel?.channel_name}\`.`
            );
        }

        const spliceStart = (allowedChannels as any[]).indexOf(channel?.channel_id);
        (allowedChannels as any[]).splice(spliceStart, 1);

        const write_path = path.join(__dirname, '../data/anon_channel.json');
        fs.writeFileSync(write_path, JSON.stringify({ allowedChannels: allowedChannels }, null, 4));

        return await customReply(interaction, `✅ | Disallowed the channel \`${channel?.channel_name}\`.`);
    }

    private async getWhileListChannel(interaction: Command.ChatInputCommandInteraction) {
        // No allowed channels
        if (allowedChannels.length == 0) {
            const embed = new EmbedBuilder()
                .setTitle("Allowed Channels")
                .setDescription("No allowed channels");
            return await interaction.reply({ embeds: [embed] });
        }

        // TODO: Convert to scroller?
        const logDB = new DBMessageLogs(this.container.database);
        const channels: string[] = [];

        for (let i = 0; i < allowedChannels.length; i++) {
            const channel = await logDB.channelGet(allowedChannels[i]);
            if (!channel) continue;
            if (channel.guild_id! === BigInt(interaction.guildId!)) {
                channels.push(String(channel.channel_name));
            }
        }

        if (channels.length == 0) {
            const embed = new EmbedBuilder()
                .setTitle("Allowed Channels")
                .setDescription("No allowed channels");
            return await interaction.reply({ embeds: [embed] });
        }

        const channelsPerPage = 10;

        const embedList: EmbedBuilder[] = [];
        for (let i = 0; i < channels.length; i += channelsPerPage) {
            embedList.push(
                new EmbedBuilder()
                    .setTitle("Allowed Channels")
                    .setDescription(channels.slice(i, i + channelsPerPage).join("\n")),
            );
        }

        // const buttonList = [
        //     new ButtonBuilder()
        //         .setCustomId("previousbtn")
        //         .setLabel("Previous")
        //         .setStyle(ButtonStyle.Danger)
        //         .setDisabled(false),
        //     new ButtonBuilder()
        //         .setCustomId("nextbtn")
        //         .setLabel("Next")
        //         .setStyle(ButtonStyle.Success)
        //         .setDisabled(false)
        // ];

        // may need to tweak this as necessary
        const pagination = new Pagination(interaction, {
            firstEmoji: '⏮', // First button emoji
            prevEmoji: '◀️', // Previous button emoji
            nextEmoji: '▶️', // Next button emoji
            lastEmoji: '⏭', // Last button emoji
            prevLabel: "Previous",
            nextLabel: "Next",
        });

        // const buttons: Record<string, ButtonBuilder> = { "Previous": buttonList[0], "Next": buttonList[1] };
        pagination.addEmbeds(embedList);
        // pagination.setButtons(buttons);
        return await pagination.reply();
    }
}