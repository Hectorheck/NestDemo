import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { randomUUID } from 'crypto';

@Injectable()
export class SqsProducerService {
  private readonly sqsClient: SQSClient;
  private readonly logger = new Logger(SqsProducerService.name);
  private readonly queueUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.sqsClient = new SQSClient({
      region: this.configService.get<string>('AWS_REGION'),
    });
    this.queueUrl = this.configService.get<string>('SQS_QUEUE_URL')!;
  }

  async sendMessage(messageBody: object) {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(messageBody),
      MessageGroupId: 'chat-messages',
      MessageDeduplicationId: randomUUID(),
    });

    try {
      const data = await this.sqsClient.send(command);
      this.logger.log(`Mensaje enviado a SQS con éxito. MessageId: ${data.MessageId}`);
      return data;
    } catch (error) {
      this.logger.error('Error al enviar mensaje a SQS:', error);
      throw error;
    }
  }
}
