import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
const math = require('mathjs');

const illegalPhraseRegexes = [/`/g, /@/g];

@ApplyOptions<Command.Options>({
    name: '24parse',
    description: 'Checks whether an equation evaluates to 24 (or a number input)!'
})
export class Parse24Command extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand(builder => {
            builder
                .setName(this.name)
                .setDescription(this.description)
                .addStringOption((option) =>
                    option.setName("equation").setDescription("Equation for the 24 game").setRequired(true),
                )
                .addNumberOption((option) =>
                    option.setName("target").setDescription("Target for your equation").setRequired(false),
                )
        });
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        const equationStr = interaction.options.getString("equation", true);
        const target = interaction.options.getNumber("target") || 24;

        const { success, message, ephemeral } = await this.evaluate(equationStr, target);

        const emoji = success ? "✅" : "❌";
        const output = `${emoji} ${message}`;

        await interaction.reply({
            content: output,
            ephemeral,
            allowedMentions: {}
        });
    }

    private isIllegalCharactersPresent(expression: string) {
        return illegalPhraseRegexes.some((regex) => regex.test(expression));
    }

    private async tryCompileAndEvaluate(eqnString: string) {
        try {
            const equationObj = math.compile(eqnString);
            if (!equationObj) {
                throw Error;
            }

            const equationOutcome = equationObj.evaluate();

            return {
                success: true,
                equationOutcome,
            };
        } catch (e) {
            return {
                success: false,
                message: "Could not compile. The equation is invalid.",
                ephemeral: true,
            };
        }
    }

    private async evaluate(equationString: string, target: number) {
        if (this.isIllegalCharactersPresent(equationString)) {
            return {
                success: false,
                message: "Could not compile. Illegal input detected.",
                ephemeral: true,
            };
        }

        const evaluationOutcome = await this.tryCompileAndEvaluate(equationString);
        if (!evaluationOutcome.success) {
            return {
                success: false,
                message: evaluationOutcome.message,
                ephemeral: true,
            };
        }
        const { equationOutcome } = evaluationOutcome;

        const outcomeAsNumber = Number(equationOutcome);
        if (math.isNaN(outcomeAsNumber)) {
            return {
                success: false,
                message: "Could not compile. The equation does not evaluate to a number.",
                ephemeral: true,
            };
        }

        return outcomeAsNumber == target
            ? {
                success: true,
                message: `Correct! \`${equationString}\` = ${target}, which is equal to the target.`,
                ephemeral: false,
            }
            : {
                success: false,
                message: `Incorrect. \`${equationString}\` = ${outcomeAsNumber}, which is not equal to the target of ${target}.`,
                ephemeral: false,
            };
    }
}