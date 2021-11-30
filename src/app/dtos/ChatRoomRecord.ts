import {ParticipantRecord} from './ParticipantRecord';
import {MessageRecord} from './MessageRecord';
import {DocumentReference, Timestamp, serverTimestamp} from '@angular/fire/firestore';
import {ChatRoomModel} from './models/ChatRoomModel';

// [key: string]: MessageRecord means that we can have any key as a string that will give us a MessageRecord as a value.
// In our case, it's just a random id as key e.g. "ajhj48an210": {MessageRecord object/class here}
export type MessageRecordMap = {
  [key: string]: MessageRecord;
};

export type ParticipantRecordMap = {
  [key: string]: ParticipantRecord;
};

export class ChatRoomRecord {
  id: string;
  docRef: DocumentReference;
  created: Date;
  participantLimit: number;
  participants?: ParticipantRecordMap;
  lastMessages?: MessageRecordMap;

  constructor(data?: { id?: string, docRef?: DocumentReference } & ChatRoomModel) {
    this.id = data.id;
    this.docRef = data.docRef;
    this.created = (data.created as Timestamp)?.toDate();
    this.participantLimit = data.participantLimit;
    this.participants = {};
    this.lastMessages = {};
    Object.keys(data.lastMessages || [])
      ?.forEach(id => this.lastMessages[id] = new MessageRecord(data.lastMessages[id]));
      // ?.sort((a, b) => b.sent.getTime() - a.sent.getTime());
    Object.keys(data.participants || [])
      ?.forEach(id => this.participants[id] = new ParticipantRecord(data.participants[id]));
    // we can't get participants and last messages from model, because we don't have ID yet here.
  }

  toModel(): ChatRoomModel {
    const participantMap = {};
    const lastMessagesMap = {};
    Object.keys(this.lastMessages).forEach(id => lastMessagesMap[id] = this.lastMessages[id].toModel());
    Object.keys(this.participants).forEach(id => participantMap[id] = this.participants[id].toModel());
    return {
      // If there's already a created date, we use that instead of getting server timestamp.
      created: this.created ? Timestamp.fromDate(this.created) : serverTimestamp(),
      participantLimit: this.participantLimit,
      participants: participantMap,
      lastMessages: lastMessagesMap
    };
  }
}
