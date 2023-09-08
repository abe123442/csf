import { PrismaClient } from "@prisma/client";

export class DBFaq {
    db: PrismaClient;
    constructor(db: PrismaClient) {
        this.db = db;
    }

    async faqGet(keyword: string) {
        try {
            await this.db.$connect();
            const faq = await this.db.faq.findUnique({ where: { keyword } });
            await this.db.$disconnect();
            return faq;
        } catch (error) {
            throw error;
        }
    }

    async faqGetTagged(tag: string) {
        try {
            await this.db.$connect();
            const faqs = await this.db.faq.findMany({ where: { tags: { contains: tag } } });
            await this.db.$disconnect();
            return faqs;
        } catch (error) {
            throw error;
        }
    }

    async faqGetKeywords() {
        try {
            await this.db.$connect();
            const faqs = await this.db.faq.findMany();
            await this.db.$disconnect();
            return faqs.map(faq => faq.keyword).join("\n");
        } catch (error) {
            throw error;
        }
    }

    async faqGetTags() {
        try {
            await this.db.$connect();
            const faqs = await this.db.faq.findMany();
            await this.db.$disconnect();
            return [...new Set(faqs.map(faq => faq.tags))].join("\n");
        } catch (error) {
            throw error;
        }
    }

    async faqAdd(keyword: string, answer: string, tags: string) {
        try {
            await this.db.$connect();
            await this.db.faq.create({ data: { keyword, answer, tags } });
            await this.db.$disconnect();
        } catch (error) {
            throw error;
        }
    }

    async faqDelete(keyword: string) {
        try {
            await this.db.$connect();
            await this.db.faq.delete({ where: { keyword } });
            await this.db.$disconnect();
        } catch (error) {
            throw error;
        }
    }
}