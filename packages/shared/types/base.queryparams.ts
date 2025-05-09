import { ApiProperty } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsIn,
  IsOptional,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class BaseQueryParams {
  @ApiProperty({ required: true, type: 'number', default: 1 })
  @Min(1)
  page: number;

  @ApiProperty({ required: true, type: 'number', default: 10 })
  @Max(100)
  @Min(0)
  size: number;

  @ApiProperty({ required: false, nullable: true })
  @IsAlphanumeric()
  @MaxLength(20)
  @IsOptional()
  orderBy?: string;

  @ApiProperty({ required: false, nullable: true, enum: ['desc', 'asc'] })
  @IsOptional()
  @IsIn(['desc', 'asc'])
  desc?: string;

  public get skipIndex() {
    return this.size * (this.page - 1);
  }
  public get sort() {
    const orderBy = this.orderBy ?? 'createdAt';
    const order: any = [{ [orderBy]: this.desc === 'asc' ? 1 : -1 }];
    if (orderBy !== 'createdAt') {
      order.push({ createdAt: -1 });
    }
    return order;
  }

  toJSON() {
    return {
      page: this.page,
      size: this.size,
      orderBy: this.orderBy,
      desc: this.desc,
    };
  }
}
