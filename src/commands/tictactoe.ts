import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { createGame } from "../lib/tictactoe/tttHelper";

@ApplyOptions<Command.Options>({
    description: 'Start a game of tictactoe'
})
export class TTTCommand extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand({ name: this.name, description: this.description });
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await createGame(interaction);
    }
}