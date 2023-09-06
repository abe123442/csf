import { PrismaClient, message_logs } from "@prisma/client";

export class DBMessageLogs {
    db: PrismaClient;
    constructor(db: PrismaClient) {
        this.db = db;
    }

    // CRUD operations for `channels` table
    async channelAdd(channel_id: bigint, channel_name: string, guild_id: bigint) {
        try {
            await this.db.$connect();
            const channel = await this.db.channels.findUnique({ where: { channel_id } });
            if (!channel) {
                await this.db.channels.create({
                    data: {
                        channel_id,
                        channel_name,
                        guild_id
                    }
                });
            }
            await this.db.$disconnect();
        } catch (error) {
            throw error;
        }
    }

    async channelGet(channel_id: bigint) {
        try {
            await this.db.$connect();
            // console.debug(`RECEIVED CHANNEL ID: ${channel_id}`);
            
            const channel = await this.db.channels.findUnique({ where: { channel_id } });
            await this.db.$disconnect();
            return channel;
        } catch (error) {
            throw error;
        }
    }

    async channelDelete(channel_id: number) {
        try {
            await this.db.$connect();
            const channel = await this.db.channels.findUnique({ where: { channel_id } });
            if (channel) {
                await this.db.channels.delete({ where: { channel_id } });
            }
            await this.db.$disconnect();
        } catch (error) {
            throw error;
        }
    }

    async channelUpdateName(channel_id: number, channel_name: string) {
        try {
            await this.db.$connect();
            await this.db.channels.update({ where: { channel_id }, data: { channel_name } });
            await this.db.$disconnect();
        } catch (error) {
            throw error;
        }
    }

    // CRUD operations for `message_logs` table
    async messageAdd(
        message_id: number,
        user_id: number,
        username: string,
        message: string,
        channel_id: bigint
    ) {
        try {
            await this.db.$connect();
            await this.db.message_logs.create({
                data: {
                    message_id,
                    user_id,
                    username,
                    message,
                    original_message: message,
                    deleted: 0,
                    message_datetime: new Date(),
                    channel_id
                }
            });
            await this.db.$disconnect();
        } catch (error) {
            throw error;
        }
    }

    async messageDelete(message_id: number) {
        try {
            await this.db.$connect();
            const message = await this.db.message_logs.findUnique({ where: { message_id } });
            if (message && message.deleted == 0) {
                await this.db.message_logs.update({ where: { message_id }, data: { deleted: 1 } });
            }
            await this.db.$disconnect();
        } catch (error) {
            throw error;
        }
    }

    async messageUpdate(message_id: number, new_message_id: number, new_message: string) {
        try {
            await this.db.$connect();

            if (message_id == new_message_id) {
                await this.db.message_logs.update({ where: { message_id }, data: { message: new_message } });
            } else {
                console.error("Something went wrong with updating message");
            }

            await this.db.$disconnect();
        } catch (error) {
            throw error;
        }
    }

    async messageCollect(start: Date, end: Date) {
        try {
            await this.db.$connect();
            const query = `SELECT * FROM message_logs JOIN channels ON message_logs.channel_id = channels.channel_id
            WHERE message_datetime >= ${start} AND message_datetime <= ${end} ORDER BY message_datetime`;
            const messages: message_logs[] = await this.db.$queryRaw`${query}`;
            await this.db.$disconnect();
            return messages;
        } catch (error) {
            throw error;
        }
        
    }
}