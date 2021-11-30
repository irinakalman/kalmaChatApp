import {ParticipantModel} from './ParticipantModel';
import {MessageModel} from './MessageModel';
import { Timestamp} from '@angular/fire/firestore';
import firebase from 'firebase/compat';
import FieldValue = firebase.firestore.FieldValue;

export interface ChatRoomModel {
  created: FieldValue;
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
