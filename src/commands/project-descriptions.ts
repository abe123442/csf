import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";

@ApplyOptions<Command.Options>({
    name: 'project-descriptions',
    description: 'Returns a description for each project under CSESoc Development!'
})
export class JokeCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(builder => builder
            .setName(this.name)
            .setDescription(this.description)
            .addStringOption((option) =>
                option
                    .setName("project")
                    .setDescription("Which project do you want to be introduced to?")
                    .setRequired(true)
                    .addChoices(
                        { name: "Chaos", value: "chaos" },
                        { name: "Circles", value: "circles" },
                        { name: "CS Electives", value: "cselectives" },
                        { name: "Discord Bot", value: "discordbot" },
                        { name: "Freerooms", value: "freerooms" },
                        { name: "Jobsboard", value: "jobsboard" },
                        { name: "Notangles", value: "notangles" },
                        { name: "Structs.sh", value: "structs.sh" },
                        { name: "UI/UX", value: "ui/ux" },
                        { name: "Website", value: "website" },
                    )
            )
        );
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const project = interaction.options.get("project", true).value;
        if (!project) return Promise.resolve();
        const parsedOption = project.toString().toLowerCase();
        let msg = "";
        switch (parsedOption) {
            case "chaos":
                msg = `Chaos is a CSESoc internal recruitment tool written in Rust.`;
                break;
            case "circles":
                msg =`Circles is a degree planner that helps you choose courses, plan out\
                your terms and check progression.`;
                break;
            case "cselectives":
                msg = `Unsure about what a course is like? Worry no more; CSElectives lets\
                you read and write reviews of UNSW CSE courses.`;
                break;
            case "discordbot":
                msg = `CSESoc Discord Bot is your friendly helper in all things fun and CSE.`;
                break;
            case "freerooms":
                msg = `Looking for a room to study in? Freerooms lets you see which on-campus\
                    rooms are vacant and which ones are booked.`;
                break;
            case "jobsboard":
                msg = `Jobsboard is an app that connects CSE students with companies\
                looking for recruits.`;
                break;
            case "notangles":
                msg = `Notangles is a timetable planning app for UNSW students to build\
                their perfect timetable, even before class registration opens.`;
                break;
            case "structs.sh":
                msg = "Structs.sh is an interactive algorithm visualiser.";
                break;
            case "ui/ux":
                msg = `The CSESoc Development UI/UX team works with all things related\
                to user interface and experience design!`;
                break;
            case "website":
                msg = `The website team are in charge of writing the software for the\
                CSESoc website.`;
                break;
            default:
                msg = "Error: the switch case has fallen through to the default case.";
                break;
        }

        await interaction.reply(msg);
    }
}