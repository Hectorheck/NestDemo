import {
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SqsProducerService } from '../sqs/sqs.producer.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly sqsProducerService: SqsProducerService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      const token = client.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new Error('Authentication token not found');
      }
      const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      client.data.user = decoded; 
      this.logger.log(`Client connected: ${client.id}, user: ${decoded.username}`);
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const username = client.data.user?.username;
    if (!username) {
      this.logger.warn(`Message received from unauthenticated client: ${client.id}`);
      return;
    }

    this.logger.log(`Message received from ${username}: ${data.content}`);

    const messagePayload = {
      username: username,
      content: data.content,
      timestamp: new Date().toISOString(),
    };

    await this.sqsProducerService.sendMessage(messagePayload);
    client.broadcast.emit('newMessage', messagePayload);
  }
}
  