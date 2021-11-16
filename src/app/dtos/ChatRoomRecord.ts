import {ParticipantRecord} from './ParticipantRecord';
import {MessageRecord} from './MessageRecord';
import {DocumentReference, Timestamp} from '@angular/fire/firestore';
import {ChatRoomModel} from './models/ChatRoomModel';
import {ParticipantModel} from './models/ParticipantModel';

export class ChatRoomRecord {
  id: string;
  docRef: DocumentReference;
  created: Date;
  participantLimit: number;
  participants?: ParticipantRecord[];
  lastMessages?: MessageRecord[];

  constructor(data?: { id?: string, docRef?: DocumentReference } & ChatRoomModel) {
    this.id = data.id;
    this.docRef = data.docRef;
    this.created = data.created.toDate();
    this.participantLimit = data.participantLimit;
    this.lastMessages = data.lastMessages
      ?.map(m => new MessageRecord(m))
      ?.sort((a, b) => b.sent.getTime() - a.sent.getTime()) || [];
    this.participants = data.participants?.map(p => new ParticipantRecord(p)) || [];
    console.log(this.participants);
    // we can't get participants and last messages from model, because we don't have ID yet here.
  }

  toModel(): ChatRoomModel {
    return {
      created: Timestamp.fromDate(this.created),
      participantLimit: this.participantLimit,
      participants: this.participants?.map(participant => {
        const p = participant.toModel() as ParticipantModel & {id: string};
        p.id = participant.id;
        return p;
      }) || [],
      lastMessages: this.lastMessages?.map(message => message.toModel()) || []
    };
  }
}
