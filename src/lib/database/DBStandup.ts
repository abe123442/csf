import { PrismaClient, standups } from "@prisma/client";
import { Sql } from "@prisma/client/runtime/library";

export class DBStandup {
    db: PrismaClient;
    constructor(db: PrismaClient) {
        this.db = db;
    }

    async standupGet(channelParentId: number, numDays: number) {
        try {
            await this.db.$connect();

            const timeInterval = `${numDays} DAYS`;
            const query = new Sql([`
                SELECT * FROM standups AS s
                JOIN standup_teams AS t ON t.id = s.team_id
                INNER JOIN (
                    SELECT s1.user_id, MAX(s1.time_stamp) AS date
                    FROM standups AS s1
                    GROUP BY s1.user_id
                ) AS s3 ON s3.user_id = s.user_id AND s.time_stamp = s3.date
                WHERE t.id = ${channelParentId} AND s.time_stamp >= CURRENT_TIMESTAMP - INTERVAL \'$1\';
            `], [timeInterval]);
            const standups = await this.db.$queryRaw<standups[]>(query);
            await this.db.$disconnect();
            return standups;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async standupAdd(
        team_id: number,
        user_id: number,
        message_id: number,
        standup_content: string
    ) {
        try {
            await this.db.$connect();

            const query_ensure_team_exists = new Sql(
                [`INSERT INTO standup_teams (id) VALUES ($1) ON CONFLICT (id) DO NOTHING;`],
                [team_id]
            );
            await this.db.$queryRaw(query_ensure_team_exists);

            await this.db.standups.create({ 
                data: { team_id, user_id, message_id, standup_content } 
            });

            await this.db.$disconnect();
        } catch (error) {
            throw error;
        }
    }

    async standupExists(message_id: number) {
        try {
            await this.db.$connect();
            const standup = await this.db.standups.findMany({ where: { message_id } });
            await this.db.$disconnect();
            return standup[0] != null;
        } catch (error) {
            throw error;
        }
    }

    async standupUpdate(message_id: number, standup_content: string) {
        try {
            await this.db.$connect();
            const query = new Sql([`
                UPDATE standups
                SET standup_content = $2
                WHERE message_id = $1
                AND standup_content IS DISTINCT FROM $2;
            `], [message_id, standup_content]);
            await this.db.$queryRaw(query);
            await this.db.$disconnect();
        } catch (error) {
            throw error;
        }
    }

    async standupDeleteAll() {
        try {
            await this.db.$connect();
            await this.db.standups.deleteMany();
            await this.db.$disconnect();
        } catch (error) {
            throw error;
        }
    }
}