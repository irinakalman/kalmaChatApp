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
    this.sent = data.sent?.toDate(); // We convert Timestamp to a date object for javascript.
    this.delivered = data.delivered?.toDate();
    this.seen = data.seen?.toDate();
  }

  // We need this function to convert our class to an object that is readable from firestore.
  // This function converts MessageRecord to MessageModel.
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
      sent: Timestamp.fromDate(this.sent), // Firestore can't store dates, it can store Timestamps so we convert date to Timestamp.
      delivered: this.delivered ? Timestamp.fromDate(this.delivered) : null,
      seen: this.seen ? Timestamp.fromDate(this.seen) : null,
    };
  }
}
