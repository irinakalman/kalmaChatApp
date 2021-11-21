import {ParticipantModel} from './ParticipantModel';
import {MessageModel} from './MessageModel';
import { Timestamp} from '@angular/fire/firestore';

export interface ChatRoomModel {
  created: Timestamp;
  participantLimit: number;
  participants?: ParticipantModelMap;
  lastMessages?: MessageModelMap;
  // bannedWords: string[];
  // bannedParticipants: string[];
}

export type MessageModelMap = {
  [key: string]: MessageModel;
};

export type ParticipantModelMap = {
  [key: string]: ParticipantModel;
};
