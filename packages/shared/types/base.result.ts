import { ApiProperty } from '@nestjs/swagger';

export class BaseResult<T> {
  @ApiProperty()
  data?: T;
  @ApiProperty()
  success = 200;

  constructor(data: T) {
    this.data = data;
    this.success = 200;
  }
}
