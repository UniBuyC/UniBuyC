import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // En la nube la conexión pasa por el pooler de Neon (PgBouncer): Prisma necesita pgbouncer=true
    const url = process.env.DATABASE_URL;
    const pooled = url && url.includes('-pooler.') && !url.includes('pgbouncer=true');
    super(pooled ? { datasources: { db: { url: `${url}${url.includes('?') ? '&' : '?'}pgbouncer=true` } } } : undefined);
  }

  async onModuleInit() {
    await this.$connect();
  }
}
