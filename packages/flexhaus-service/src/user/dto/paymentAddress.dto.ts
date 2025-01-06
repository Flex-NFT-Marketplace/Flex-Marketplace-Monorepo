import { ApiProperty } from '@nestjs/swagger';

export class PaymentAddressDTO {
  @ApiProperty()
  address: string;
}
