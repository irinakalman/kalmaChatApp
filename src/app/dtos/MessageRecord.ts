import {MessageModel} from './models/MessageModel';
import {Timestamp} from '@angular/fire/firestore';

export class MessageRecord {
  id: string;
  participantID: string;
  participantUsername: string;
  message: string;
  sent?: Date;
  delivered?: Date;
  seen?: Date;

  constructor(data?: MessageModel) {
    this.id = data.id;
    this.participantID = data.participantID;
    this.participantUsername = data.participantUsername;
    this.message = data.message;
    this.sent = data.sent?.toDate();
    this.delivered = data.delivered?.toDate();
    this.seen = data.seen?.toDate();
  }

  toModel(): MessageModel {
    // let deliveredMessage = null;
    // if (this.delivered) {
    //   deliveredMessage = Timestamp.fromDate(this.delivered);
    // }
    // return { message: this.message, ..., delivered: deliveredMessage, ... }
    // we instead went for inline if here:
    return {
      id: this.id,
      participantID: this.participantID,
      participantUsername: this.participantUsername,
      message: this.message,
      sent: Timestamp.fromDate(this.sent),
      delivered: this.delivered ? Timestamp.fromDate(this.delivered) : null,
      seen: this.seen ? Timestamp.fromDate(this.seen) : null,
    };
  }
}
