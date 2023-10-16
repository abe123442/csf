import './lib/setup';
import { SapphireClient, container } from '@sapphire/framework';
import { ClientOptions } from 'discord.js';
import { PrismaClient } from '@prisma/client';

export class CseClient extends SapphireClient {
	public constructor(options: ClientOptions) {
		super(options);
	}

	public override async login(token?: string) {
		container.database = new PrismaClient({
			datasourceUrl: process.env.DATABASE_URL,
			log: ['query', 'info']
		});
		return super.login(token);
	}

	public override async destroy() {
		return super.destroy();
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		database: PrismaClient;
	}
}
