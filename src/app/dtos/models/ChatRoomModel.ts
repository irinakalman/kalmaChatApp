import {ParticipantModel} from './ParticipantModel';
import {MessageModel} from './MessageModel';
import { Timestamp} from '@angular/fire/firestore';

export interface ChatRoomModel {
  created: Timestamp;
  participantLimit: number;
  participants?: (ParticipantModel & { id: string })[];
  lastMessages?: MessageModel[];
  // bannedWords: string[];
  // bannedParticipants: string[];
}
