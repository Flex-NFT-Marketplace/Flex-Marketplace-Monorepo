import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto<T> {
  @ApiProperty()
  public total: number;

  @ApiProperty()
  public page: number;

  @ApiProperty()
  public size: number;

  @ApiProperty()
  public pages: number;

  @ApiProperty()
  public hasNext: boolean;

  @ApiProperty()
  public hasPrevious: boolean;

  @ApiProperty()
  public items: T[];

  public constructor(...args: any[]) {
    if (args.length === 3) {
      this.total = args[0];
      this.page = args[1];
      this.size = args[2];
      this.items = [];
      this.pages =
        Number(args[0]) === 0 ? 0 : Math.ceil((1.0 * this.total) / this.size);
    }
    if (args.length === 4) {
      this.total = args[1];
      this.page = args[2];
      this.size = args[3];
      this.items = args[0];
      this.pages =
        Number(args[1]) === 0 ? 0 : Math.ceil((1.0 * this.total) / this.size);
    }
    this.hasNext = this.pages > this.page;
    this.hasPrevious = this.page > 1;
  }
}
