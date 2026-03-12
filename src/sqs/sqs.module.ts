import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SqsModule as NestSqsModule } from '@ssut/nestjs-sqs';
import { SqsProducerService } from './sqs.producer.service';
import { SqsConsumerService } from './sqs.consumer.service';

@Module({
  imports: [
    ConfigModule,
    NestSqsModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        consumers: [
          {
            name: 'default-queue-name', 
            queueUrl: configService.get<string>('SQS_QUEUE_URL')!,
            region: configService.get<string>('AWS_REGION')!,
            credentials: {
              accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID')!,
              secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
            }
          },
        ],
        producers: [], 
      }),
    }),
  ],
  providers: [SqsProducerService, SqsConsumerService],
  exports: [SqsProducerService], 
})
export class SqsModule {}
