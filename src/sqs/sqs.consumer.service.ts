import { Injectable, Logger } from '@nestjs/common';
import { SqsMessageHandler } from '@ssut/nestjs-sqs';
import type { Message } from '@aws-sdk/client-sqs';

@Injectable()
export class SqsConsumerService {
  private readonly logger = new Logger(SqsConsumerService.name);

  @SqsMessageHandler('default-queue-name', false) 
  public async handleMessage(message: Message) {
    this.logger.log('Nuevo mensaje recibido de SQS:');
    
    const messageBody = JSON.parse(message.Body!);

    console.log('--- INICIO MENSAJE SQS ---');
    console.log(`UserID: ${messageBody.userId}`);
    console.log(`Contenido: ${messageBody.content}`);
    console.log(`Timestamp: ${messageBody.timestamp}`);
    console.log('--- FIN MENSAJE SQS ---');

  }
}
