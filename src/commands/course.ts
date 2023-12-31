import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ChannelType, PermissionFlagsBits, PermissionsBitField } from 'discord.js';

const MODERATION_REQUEST_CHANNEL = 824506830641561600n;
const COMMAND_JOIN = 'join';
const COMMAND_LEAVE = 'leave';

// map of course aliases to their actual names
const course_aliases: Record<string, string> = {
	comp6841: 'comp6441',
	comp9044: 'comp2041',
	comp3891: 'comp3231',
	comp9201: 'comp3231',
	comp9101: 'comp3121',
	comp9331: 'comp3331',
	comp9415: 'comp3421',
	comp9801: 'comp3821',
	comp9102: 'comp3131',
	comp9154: 'comp3151',
	comp9164: 'comp3161',
	comp9211: 'comp3211',
	comp9222: 'comp3221',
	comp9814: 'comp3411',
	comp9511: 'comp3511',
	comp9900: 'comp3900',
	seng4920: 'comp4920',
	comp9337: 'comp4337',
	math1141: 'math1131',
	math1241: 'math1231'
};

const get_real_course_name = (course: string) => {
	course = course.toLowerCase();
	const alias: string | undefined = course_aliases[course];
	if (alias) {
		return alias;
	}
	return course;
};

const is_valid_course = (course: string) => {
	const reg_comp_course = /^comp\d{4}$/;
	const reg_math_course = /^math\d{4}$/;
	const reg_binf_course = /^binf\d{4}$/;
	const reg_engg_course = /^engg\d{4}$/;
	const reg_seng_course = /^seng\d{4}$/;
	const reg_desn_course = /^desn\d{4}$/;

	course = course.toLowerCase();
	return (
		reg_comp_course.test(course) ||
		reg_math_course.test(course) ||
		reg_binf_course.test(course) ||
		reg_engg_course.test(course) ||
		reg_seng_course.test(course) ||
		reg_desn_course.test(course)
	);
};

@ApplyOptions<Command.Options>({ name: 'course', description: 'Manages course chats.' })
export class CourseCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((subcommand) =>
					subcommand
						.setName(COMMAND_JOIN)
						.setDescription('Join a course chat.')
						.addStringOption((option) => option.setName('course').setDescription('Course chat to join').setRequired(true))
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName(COMMAND_LEAVE)
						.setDescription('Leave a course chat.')
						.addStringOption((option) => option.setName('course').setDescription('Course chat to leave').setRequired(true))
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.inCachedGuild()) return Promise.resolve();
		try {
			const subcommand = interaction.options.getSubcommand(true);
			const input_course = interaction.options.getString('course', true).toLowerCase();
			const course = get_real_course_name(input_course);
			const is_valid = is_valid_course(course);
			const course_with_alias = course != input_course ? `${course} (same course chat as ${input_course})` : course;

			if (subcommand == COMMAND_JOIN) {
				const other_courses = /^[a-zA-Z]{4}\d{4}$/;

				if (!is_valid && other_courses.test(course)) {
					return await interaction.reply({
						content: `❌ | Course chats for other faculties are not supported.`,
						ephemeral: true
					});
				} else if (!is_valid) {
					return await interaction.reply({
						content: `❌ | You are not allowed to join this channel using this command.`,
						ephemeral: true
					});
				}

				// First, let's see if there's a role that matches the name of the course
				const role = interaction.guild.roles.cache.find((r) => r.name.toLowerCase() === course.toLowerCase());

				// If there is, let's see if the member already has that role
				if (role !== undefined) {
					if (interaction.member.roles.cache.has(role.id)) {
						return await interaction.reply({
							content: `❌ | You are already in the course chat for \`${course_with_alias}\`.`,
							ephemeral: true
						});
					}

					// If they don't, let's add the role to them
					await interaction.member?.roles.add(role);
					return await interaction.reply({
						content: `✅ | Added you to the chat for \`${course_with_alias}\`.`,
						ephemeral: true
					});
				}

				// Otherwise, find a channel with the same name as the course
				const channel = interaction.guild?.channels.cache.find((c) => c.name.toLowerCase() === course.toLowerCase());

				// Make sure that the channel exists, and is a text channel
				if (channel === undefined) {
					return await interaction.reply({
						content: `❌ | The course chat for \`${course}\` does not exist. If you'd like for it to be created, please raise a ticket in <#${MODERATION_REQUEST_CHANNEL}>.`,
						ephemeral: true
					});
				} else if (channel.type !== ChannelType.GuildText) {
					return await interaction.reply({
						content: `❌ | The course chat for \`${course}\` is not a text channel.`,
						ephemeral: true
					});
				}

				// channel has type GuildBasedChannel
				const permissionsFor = channel.permissionsFor(interaction.user.id);
				if (!permissionsFor) return Promise.resolve();
				const permissions = new PermissionsBitField(permissionsFor.bitfield);

				// Check if the member already has an entry in the channel's permission overwrites, and update
				// the entry if they do just to make sure that they have the correct permissions
				if (permissions.has([PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages])) {
					await channel.permissionOverwrites.edit(interaction.member, { ViewChannel: true });
					return await interaction.reply({
						content: `❌ | You are already in the course chat for \`${course_with_alias}\`.`,
						ephemeral: true
					});
				}

				// Add the member to the channel's permission overwrites
				await channel.permissionOverwrites.create(interaction.member, { ViewChannel: true });

				return await interaction.reply({
					content: `✅ | Added you to the chat for ${course_with_alias}.`,
					ephemeral: true
				});
			} else if (subcommand == COMMAND_LEAVE) {
				if (!is_valid) {
					return await interaction.reply({
						content: `❌ | You are not allowed to leave this channel using this command.`,
						ephemeral: true
					});
				}

				// First, let's see if there's a role that matches the name of the course
				const role = interaction.guild.roles.cache.find((r) => r.name.toLowerCase() === course.toLowerCase());

				// If there is, let's see if the member already has that role
				if (role !== undefined) {
					if (!interaction.member.roles.cache.has(role.id)) {
						return await interaction.reply({
							content: `❌ | You are not in the course chat for \`${course}\`.`,
							ephemeral: true
						});
					}

					// If they do, let's remove the role from them
					await interaction.member.roles.remove(role);
					return await interaction.reply({
						content: `✅ | Removed you from the chat for \`${course}\`.`,
						ephemeral: true
					});
				}

				// Find a channel with the same name as the course
				const channel = interaction.guild.channels.cache.find((c) => c.name.toLowerCase() === course.toLowerCase());

				// Otherwise, make sure that the channel exists, and is a text channel
				if (channel === undefined) {
					return await interaction.reply({
						content: `❌ | The course chat for \`${course}\` does not exist.`,
						ephemeral: true
					});
				} else if (channel.type !== ChannelType.GuildText) {
					return await interaction.reply({
						content: `❌ | The course chat for \`${course}\` is not a text channel.`,
						ephemeral: true
					});
				}

				const permissionsFor = channel.permissionsFor(interaction.user.id);
				if (!permissionsFor) return Promise.resolve();
				const permissions = new PermissionsBitField(permissionsFor.bitfield);

				// Check if the member already has an entry in the channel's permission overwrites
				if (!permissions.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
					return await interaction.reply({
						content: `❌ | You are not in the course chat for \`${course}\`.`,
						ephemeral: true
					});
				}

				// Remove the member from the channel's permission overwrites
				await channel.permissionOverwrites.delete(interaction.member);

				return await interaction.reply({
					content: `✅ | Removed you from the course chat for \`${course}\`.`,
					ephemeral: true
				});
			}

			return await interaction.reply('Error: invalid subcommand.');
		} catch (error) {
			return await interaction.reply('Error: ' + error);
		}
	}
}
