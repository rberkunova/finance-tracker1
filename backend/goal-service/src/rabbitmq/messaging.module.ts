// backend/<service-name>/src/rabbitmq/messaging.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  RabbitMQModule,
  RabbitMQConfig,
} from '@golevelup/nestjs-rabbitmq';

@Global()
@Module({
  imports: [
    ConfigModule,

    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject:  [ConfigService],
      useFactory: (config: ConfigService): RabbitMQConfig => {
        const uri = config.get<string>('RABBITMQ_URI');
        if (!uri) {
          throw new Error('[MessagingModule] RABBITMQ_URI is not defined');
        }

        return {
          uri,
          exchanges: [
            {
              name: 'finance_exchange',
              type: 'topic',
              // опції assertExchange → сюди передається durable
              options: { durable: true },
            },
          ],
          connectionInitOptions: { wait: true, timeout: 10_000 },
          connectionManagerOptions: {
            heartbeatIntervalInSeconds: 5,
            reconnectTimeInSeconds:    5,
          },
        };
      },
    }),
  ],
  exports: [RabbitMQModule],
})
export class MessagingModule {}
