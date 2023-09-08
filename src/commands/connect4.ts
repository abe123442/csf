import { ApplyOptions } from "@sapphire/decorators";
import { Command } from "@sapphire/framework";
import { createConnect4 } from "../lib/connect4/connect4Runner";

@ApplyOptions<Command.Options>({
    description: 'Start a game of connect 4'
})
export class Connect4Command extends Command {
    public override registerApplicationCommands(registry: Command.Registry) {
        registry.registerChatInputCommand({ name: this.name, description: this.description });
    }

    public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
        await createConnect4(interaction);
    }
}