import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailingService {
  constructor(private readonly mailService: MailerService) {}

  async sendMail(message: string) {
    await this.mailService.sendMail({
      from: 'Flex Marketplace <mailtrap@demomailtrap.com>',
      to: 'baonguyen120301@gmail.com',
      subject: `ERROR FROM ONCHAIN WORKER`,
      text: message,
    });
  }
}
