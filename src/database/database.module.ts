import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isSsl = configService.get<string>('DB_SSL') === 'true';
        const caCertPath = configService.get<string>('DB_CA_CERT_PATH');

        let sslOptions;

        if (isSsl) {
          if (caCertPath) {
            const ca = fs.readFileSync(path.join(process.cwd(), caCertPath), 'utf-8');
            sslOptions = { rejectUnauthorized: true, ca };
          } else {
            sslOptions = { rejectUnauthorized: false };
          }
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: true,
          ...(sslOptions && { ssl: sslOptions }),
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

