import { PrismaClient } from '@prisma/client';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';

@ApplyOptions<Listener.Options>({ once: true })
export class DBUser extends Listener {
    public override async run() {
        const db = this.container.database;
        await this.tableOp(db);
    }

    private async tableOp(db: PrismaClient) {
        await db.$connect();
        try {
            
        } catch (error) {
            console.error(error);
        }
        await db.$disconnect();
    }
}