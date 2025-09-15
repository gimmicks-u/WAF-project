import { IsString, IsNotEmpty, IsIP, Matches } from 'class-validator';

export class CreateDomainDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/, {
    message: 'Please provide a valid domain name',
  })
  domain: string;

  @IsString()
  @IsNotEmpty()
  @IsIP()
  origin_ip: string;
}
