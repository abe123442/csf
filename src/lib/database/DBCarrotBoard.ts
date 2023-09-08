import { PrismaClient } from "@prisma/client";

export class DBCarrotBoard {
    db: PrismaClient;
    constructor(db: PrismaClient) {
        this.db = db;
    }

    // need to check this function
    async cbCountValues(emoji: string, message_id: number, user_id: number, channel_id: number) {
        try {
            await this.db.$connect();
            const res = await this.db.carrot_board.findMany({
                where: { emoji, message_id, user_id, channel_id }
            });
            await this.db.$disconnect();
            return res.length;
        } catch (error) {
            throw error;
        }
    }

    async cbGetCount(emoji: string, message_id: number, user_id: number, channel_id: number) {
        try {
            await this.db.$connect();
            const res = await this.db.carrot_board.findMany({
                where: { emoji, message_id, user_id, channel_id }
            });
            await this.db.$disconnect();
            return res[0].count;
        } catch (error) {
            throw error;
        }
    }

    async cbAddValue(emoji: string, message_id: number, user_id: number, channel_id: number, message_contents: string) {
        try {
            await this.db.$connect();
            const values = await this.cbCountValues(emoji, message_id, user_id, channel_id);

            if (values! == 0) {
                await this.db.carrot_board.create({
                    data: { emoji, message_id, user_id, channel_id, count: 1, message_contents }
                });
            } else {
                let count = await this.cbGetCount(emoji, message_id, user_id, channel_id) ?? 0n;
                count++;
                const cb = await this.db.carrot_board.findMany({ where: { message_id } });
                const carrot_id = cb[0].carrot_id;
                await this.db.carrot_board.update({ where: { carrot_id }, data: { count } });
            }
            await this.db.$disconnect();
        } catch (error) {
            throw error;
        }
    }

    async cbGetByCarrotBoardID(carrot_id: number) {
        try {
            await this.db.$connect();
            const cb = await this.db.carrot_board.findUnique({ where: { carrot_id } });
            if (!cb) return Promise.resolve();

            cb.message_contents?.trim();
            await this.db.$disconnect();
            return cb;
        } catch (error) {
            throw error;
        }
    }

    async cbGetByMsgEmoji(message_id: number, emoji: string) {
        try {
            await this.db.$connect();
            const cb = (await this.db.carrot_board.findMany({ where: { message_id, emoji } }))[0];
            if (!cb) return Promise.resolve();

            cb.message_contents?.trim();
            await this.db.$disconnect();
            return cb;
        } catch (error) {
            throw error;
        }
    }

    async cbGetAll(count_min: number) {
        try {
            await this.db.$connect();
            const cb = await this.db.carrot_board.findMany({ where: { count: { gte: count_min } } });
            if (!cb) return Promise.resolve();
            await this.db.$disconnect();
            return cb;
        } catch (error) {
            throw error;
        }
    }

    async cbDelEntry(message_id: number, channel_id: number) {
        try {
            await this.db.$connect();
            await this.db.carrot_board.deleteMany({ where: { message_id, channel_id } });
            await this.db.$disconnect();
        } catch (error) {
            throw error;
        }
    }

    async cbDelEntryEmoji(emoji: string, message_id: number, user_id: number, channel_id: number) {
        try {
            await this.db.$connect();
            await this.db.carrot_board.deleteMany({ where: { emoji, message_id, user_id, channel_id } });
            await this.db.$disconnect();
        } catch (error) {
            throw error;
        }
    }

    async cbSubValue(emoji: string, message_id: number, user_id: number, channel_id: number) {
        try {
            await this.db.$connect();
            let count = await this.cbGetCount(emoji, message_id, user_id, channel_id) ?? 0n;

            if (count <= 1) {
                this.cbDelEntryEmoji(emoji, message_id, user_id, channel_id);
            } else {
                count--;
                await this.db.carrot_board.updateMany({
                    where: { emoji, message_id, user_id, channel_id },
                    data: { count }
                });
            }
            await this.db.$disconnect();
        } catch (error) {
            throw error;
        }
    }

    async cbGetAllByEmoji(emoji: string, count_min: number) {
        try {
            await this.db.$connect();
            const cb = await this.db.carrot_board.findMany({
                where: {
                    emoji,
                    count: { gte: count_min }
                },
                orderBy: {
                    count: { sort: "desc" }
                }
            });
            if (!cb) return Promise.resolve();
            await this.db.$disconnect();
            return cb;
        } catch (error) {
            throw error;
        }
    }

    async cbGetAllByUser(emoji: string, count_min: number, user_id: bigint) {
        try {
            await this.db.$connect();
            const cb = await this.db.carrot_board.findMany({
                where: {
                    emoji,
                    count: { gte: count_min },
                    user_id
                },
                orderBy: {
                    count: { sort: "desc" }
                }
            });
            if (!cb) return Promise.resolve();
            await this.db.$disconnect();
            return cb;
        } catch (error) {
            throw error;
        }
    }
}