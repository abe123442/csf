import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { DBStandup } from "../lib/database/DBStandup";
import { Pagination } from "pagination.djs";

@ApplyOptions<Command.Options>({
    name: 'standupstatus',
    description: 'Get standups [ADMIN]'
})
export class StandupAdminCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(builder => builder
            .setName(this.name)
            .setDescription(this.description)
            .addSubcommand((subcommand) =>
                subcommand
                    .setName("getfullstandups")
                    .setDescription("Returns all standups")
                    .addMentionableOption((option) =>
                        option
                            .setName("teamrole")
                            .setDescription("Mention the team role (@team-role)")
                            .setRequired(true),
                    )
                    .addIntegerOption((option) =>
                        option
                            .setName("days")
                            .setDescription("Number of days in past to retrieve standups from")
                            .setRequired(false),
                    ),
            )
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const TEAM_DIRECTOR_ROLE_ID = "921348676692107274";

        if (!interaction.inCachedGuild()) return Promise.resolve();

        if (
            !interaction.member.permissions.has(PermissionFlagsBits.Administrator) &&
            !interaction.member.roles.cache.has(TEAM_DIRECTOR_ROLE_ID)
        ) {
            return await interaction.reply({
                content: "You do not have permission to execute this command.",
                ephemeral: true,
            });
        }

        if (interaction.options.getSubcommand() === "getfullstandups") {
            let sendmsg = "";
            const standupDB = new DBStandup(this.container.database);

            try {
                const team = interaction.options.getMentionable("teamrole", true);
                const role = await interaction.guild.roles.fetch(team.id);
                
                if (!role || !interaction.channel) return Promise.resolve();

                /*eslint-disable */
                let roleMembers = [...role.members.values()];
                /* eslint-enable */

                const ON_BREAK_ID = "1036905668352942090";
                roleMembers = roleMembers.filter((rm) => !rm.roles.cache.has(ON_BREAK_ID));

                const thisTeamId = Number(interaction.channel.parentId!);
                const numDaysToRetrieve = (interaction.options.getInteger("days")) ?? 7;

                let thisTeamStandups = await standupDB.standupGet(thisTeamId, numDaysToRetrieve);

                const roleNames: Record<string, string> = {};
                roleMembers.forEach((el) => {
                    const author = el.user.username;
                    /* let author = el.nickname;
                    if (author == undefined) {
                        author = el.user.username;
                    }*/
                    roleNames[el.user.id] = author;
                });

                thisTeamStandups = thisTeamStandups.filter((st) =>
                    Object.keys(roleNames).includes(st.user_id.toString()),
                );

                let standupDone: string[] = [];
                let standupEmbeded: string[] = [];

                // add all standups
                thisTeamStandups.forEach((standUp) => {
                    standupDone.push(standUp.user_id.toString());
                    standupEmbeded.push(
                        "**" +
                        `${roleNames[standUp.user_id.toString()]}` +
                        "**" +
                        "\n" +
                        standUp.standup_content,
                    );
                    sendmsg +=
                        "**" +
                        `${roleNames[standUp.user_id.toString()]}` +
                        "**" +
                        "\n" +
                        standUp.standup_content;
                    sendmsg += "\n";
                });

                let notDone: string[] = [];

                roleMembers.forEach((el) => {
                    const id = el.user.id;
                    if (!standupDone.includes(id)) {
                        notDone.push(id);
                    }
                });

                let notDoneUsersString = "";
                notDoneUsersString = notDone.map((el) => `<@${el}>`).join(", ");

                const embedList: EmbedBuilder[] = [];
                if (notDone.length == 0) {
                    standupEmbeded.forEach((el) => {
                        embedList.push(
                            new EmbedBuilder()
                                .setTitle("Standups (" + role.name + ")")
                                .setDescription(
                                    el + "\n\n" + "_Everyone has done their standup_\n",
                                ),
                        );
                    });
                } else {
                    standupEmbeded.forEach((el) => {
                        embedList.push(
                            new EmbedBuilder()
                                .setTitle("Standups (" + role.name + ")")
                                .setDescription(
                                    el +
                                    "\n\n" +
                                    "_These users have not done their standup:_\n" +
                                    notDoneUsersString,
                                ),
                        );
                    });
                }

                if (thisTeamStandups.length == 0) {
                    const embed = new EmbedBuilder()
                        .setTitle("Standups (" + role.name + ")")
                        .setDescription(
                            "No standups recorded\n\n" +
                            "_These users have not done their standup:_\n" +
                            notDoneUsersString,
                        );
                    return await interaction.reply({ embeds: [embed] });
                }

                // may need to tweak this as necessary
                const pagination = new Pagination(interaction, {
                    firstEmoji: '⏮', // First button emoji
                    prevEmoji: '◀️', // Previous button emoji
                    nextEmoji: '▶️', // Next button emoji
                    lastEmoji: '⏭', // Last button emoji
                    prevLabel: "Previous",
                    nextLabel: "Next",
                });

                pagination.addEmbeds(embedList);
                await pagination.reply();
                
                // depdendency on v13 helper functions - DEPRECATED
                // paginationEmbed(interaction, embedList, buttonList);
            } catch (error) {
                sendmsg = "An error - " + error;
                await interaction.reply({ content: sendmsg, ephemeral: true });
            }
        }
    }
}