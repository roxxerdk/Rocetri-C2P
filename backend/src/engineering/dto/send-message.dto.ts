import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ConversationType } from '../../shared/enums';

export class SendMessageDto {
  @IsEnum(ConversationType)
  type: ConversationType;

  @IsString()
  @IsNotEmpty()
  message: string;
}
