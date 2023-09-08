import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { EmbedBuilder } from "discord.js";
import { apiURL, handbookURL } from "../data/handbook.json";
import axios from "axios";
import td from 'turndown';


interface CourseData {
    title: string;
    code: string;
    UOC: number;
    level: number;
    description: string;
    study_level: string;
    handbook_note: string;
    school: string;
    faculty: string;
    campus: string;
    equivalents: Record<string, number>;
    exclusions: Record<string, number>;
    terms: string[];
    raw_requirements: string;
    gen_ed: boolean;
}

@ApplyOptions<Command.Options>({
    name: 'handbook',
    description: 'Displays information from the UNSW Handbook.'
})
export class HandbookCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(builder => builder
            .setName(this.name)
            .setDescription(this.description)
            .addSubcommand((subcommand) =>
                subcommand
                    .setName("courseinfo")
                    .setDescription("Displays information about a course.")
                    .addStringOption((option) =>
                        option
                            .setName("coursecode")
                            .setDescription(
                                "Code of course to display information about (e.g. COMP1511)",
                            )
                            .setRequired(true),
                    ),
            )
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        if (interaction.options.getSubcommand() !== "courseinfo") return Promise.resolve();

        const courseCode = interaction.options.getString("coursecode", true).toUpperCase();
        let data: CourseData | undefined = undefined;
        try {
            // Documented at:
            // https://circlesapi.csesoc.app/docs
            const response = await axios.get(`${apiURL}/courses/getCourse/${courseCode}`);
            data = response.data;
        } catch (e) {
            return await interaction.reply({
                content: "Invalid course code.",
                ephemeral: true,
            });
        }

        if (data == undefined) return Promise.resolve();

        const {
            title,
            code,
            UOC,
            // level,
            description,
            // study_level,
            // school,
            // campus,
            equivalents,
            raw_requirements,
            exclusions,
            // handbook_note,
            terms,
        } = data;

        const courseInfo = new EmbedBuilder()
            .setTitle(title)
            .setURL(`${handbookURL}/${code}`)
            .setColor(0x3a76f8)
            .setAuthor({ name: `Course Info: ${code} (${UOC} UOC)`, iconURL: "https://i.imgur.com/EE3Q40V.png" })
            .addFields(
                {
                    name: "Overview",
                    value: new td().turndown(description),
                    inline: false,
                },
                {
                    name: "Enrolment Requirements",
                    value:
                        raw_requirements.replace(
                            /[A-Z]{4}[0-9]{4}/g,
                            `[$&](${handbookURL}$&)`,
                        ) || "None",
                    inline: true,
                },
                {
                    name: "Offering Terms",
                    value: terms.join(", "),
                    inline: true,
                },
                {
                    name: "Equivalent Courses",
                    value:
                        Object.keys(equivalents)
                            .map((course) => `[${course}](${course})`)
                            .join(", ") || "None",
                    inline: true,
                },
                {
                    name: "Exclusion Courses",
                    value:
                        Object.keys(exclusions)
                            .map((course) => `[${course}](${handbookURL}${course})`)
                            .join(", ") || "None",
                    inline: true,
                },
                /* { */
                /*     name: "Course Outline", */
                /*     value: `[${courseCode} Course Outline](${data["course_outline_url"]})`, */
                /*     inline: true, */
                /* }, */
            )
            .setTimestamp()
            .setFooter({ text: "Data fetched from Circles' Api" })
        await interaction.reply({ embeds: [courseInfo] });
    }
}