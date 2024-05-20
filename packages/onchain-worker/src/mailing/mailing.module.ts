import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import configuration from '@app/shared/configuration';
import { MailingService } from './mailing.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: configuration().mailer.host,
        port: configuration().mailer.port,
        auth: {
          user: configuration().mailer.user,
          pass: configuration().mailer.pass,
        },
      },
    }),
  ],
  providers: [MailingService],
})
export class MailingModule {}
