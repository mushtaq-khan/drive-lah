import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const typeOrmConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgres',
    host: config.get<string>('DATABASE_HOST', 'localhost'),
    port: Number(config.get<string>('DATABASE_PORT', '5432')),
    username: config.get<string>('DATABASE_USER', 'postgres'),
    password: config.get<string>('DATABASE_PASSWORD', 'postgres'),
    database: config.get<string>('DATABASE_NAME', 'voucher_service'),
    autoLoadEntities: true,
    synchronize: config.get<string>('NODE_ENV') !== 'production',
    ssl:
      config.get<string>('DATABASE_SSL', 'false') === 'true'
        ? { rejectUnauthorized: false }
        : false,
  }),
};
