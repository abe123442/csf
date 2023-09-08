import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ChannelType, PermissionFlagsBits } from 'discord.js';

const COMMAND_KICKUNVERIFIED = "kickunverified";
const COMMAND_MIGRATE = "migratecourses";
const COMMAND_REMOVECOURSEROLES = "nukeremovecourseroles";

const is_valid_course = (course: string) => {
    const reg_comp_course = /^comp\d{4}$/;
    const reg_math_course = /^math\d{4}$/;
    const reg_binf_course = /^binf\d{4}$/;
    const reg_engg_course = /^engg\d{4}$/;
    const reg_seng_course = /^seng\d{4}$/;
    const reg_desn_course = /^desn\d{4}$/;

    course = course.toLowerCase();

    return (
        reg_comp_course.test(course.toLowerCase()) ||
        reg_math_course.test(course.toLowerCase()) ||
        reg_binf_course.test(course.toLowerCase()) ||
        reg_engg_course.test(course.toLowerCase()) ||
        reg_seng_course.test(course.toLowerCase()) ||
        reg_desn_course.test(course.toLowerCase())
    );
};

@ApplyOptions<Command.Options>({ description: 'Admin-only commands.' })
export class AdminCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(builder => builder
            .setName(this.name)
            .setDescription(this.description)
            .addSubcommand((subcommand) =>
                subcommand
                    .setName(COMMAND_KICKUNVERIFIED)
                    .setDescription("Kicks all unverified users from the server."),
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName(COMMAND_MIGRATE)
                    .setDescription("Migrates a course role to permission overwrites.")
                    .addStringOption((option) =>
                        option
                            .setName("course")
                            .setDescription("Course role to remove")
                            .setRequired(true),
                    ),
            )
            .addSubcommand((subcommand) =>
                subcommand
                    .setName(COMMAND_REMOVECOURSEROLES)
                    .setDescription("WARNING: Removes course roles from the server."),
            )
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        try {
            if (!interaction.inCachedGuild()) return Promise.resolve();

            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply({
                    content: "You do not have permission to execute this command.",
                    ephemeral: true,
                });
            }

            switch (interaction.options.getSubcommand()) {
                case COMMAND_KICKUNVERIFIED:
                    return await this.kickUnverified(interaction);

                case COMMAND_MIGRATE:
                    return await this.migrate(interaction);

                case COMMAND_REMOVECOURSEROLES:
                    return await this.removeCourseRoles(interaction);

                default:
                    return await interaction.reply("Error: unknown subcommand.");
            }
        } catch (error) {
            return await interaction.reply("Error: " + error);
        }
    }

    private async kickUnverified(interaction: Command.ChatInputCommandInteraction) {
        const role = interaction.guild?.roles.cache.find(r => r.name.toLowerCase() === "unverified");

        // Make sure that the "unverified" role exists
        if (role === undefined) {
            return await interaction.reply('Error: no "unverified" role exists.');
        }

        const kickMessage =
            "You have been removed from the CSESoc Server as you have not verified via the instructions in #welcome.\
                    If you wish to rejoin, visit https://cseso.cc/discord";

        // Member list in the role is cached
        let numRemoved = 0;
        role.members.each((member) => {
            member.createDM().then((DMChannel) => {
                // Send direct message to user being kicked
                DMChannel.send(kickMessage).then(() => {
                    // Message sent, time to kick.
                    member
                        .kick(kickMessage)
                        .then(() => {
                            ++numRemoved;
                            console.log(numRemoved + " people removed.");
                        })
                        .catch((e) => {
                            console.log(e);
                        });
                });
            });
        });
        return await interaction.reply("Removed unverified members.");
    }

    private async migrate(interaction: Command.ChatInputCommandInteraction) {
        const course = interaction.options.getString("course", true);
        if (!is_valid_course(course)) {
            return await interaction.reply("Error: invalid course.");
        }

        const role = interaction.guild?.roles.cache.find(
            course_role => course_role.name.toLowerCase() === course.toLowerCase()
        );

        if (role === undefined) {
            return await interaction.reply("Error: no role exists for course " + course);
        }

        const channel = interaction.guild?.channels.cache.find(
            role_channel => role_channel.name.toLowerCase() === role.name.toLowerCase(),
        );

        if (channel === undefined) {
            return await interaction.reply("Error: no channel exists for course " + course);
        } else if (channel.type != ChannelType.GuildText) {
            return await interaction.reply(`Error: ${channel.name} is not a TextChannel`);
        }

        await interaction.deferReply();
        for (const member of role.members.values()) {
            await channel.permissionOverwrites.create(member, {
                ViewChannel: true,
            });
        }
        return await interaction.editReply(
            "Migrated course role to permission overwrites.",
        );
    }

    private async removeCourseRoles(interaction: Command.ChatInputCommandInteraction) {
        // get all roles, and find courses which match the regex
        const course_roles = interaction.guild?.roles.cache.filter(role => is_valid_course(role.name));

        await interaction.deferReply();

        for (const role of course_roles!.values()) {
            await role.delete();
        }

        return await interaction.editReply("Removed all course roles.");
    }
}