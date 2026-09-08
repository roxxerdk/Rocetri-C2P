import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ConversationType } from '../../shared/enums';

export class ConversationMessage {
  role: string;       // 'user' | 'assistant' | 'system'
  content: string;
  timestamp: Date;
}

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId: Types.ObjectId;

  @Prop({ type: String, enum: ConversationType, required: true })
  type: ConversationType;

  @Prop({ type: Types.ObjectId, ref: 'Context', default: null })
  contextReference: Types.ObjectId;

  @Prop({
    type: [{ role: String, content: String, timestamp: Date }],
    default: [],
  })
  messages: ConversationMessage[];
}

export type ConversationDocument = Conversation & Document;
export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ projectId: 1, type: 1 });
