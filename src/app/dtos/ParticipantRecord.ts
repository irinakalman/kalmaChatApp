import {ParticipantModel} from './models/ParticipantModel';
import {DocumentReference, Timestamp} from '@angular/fire/firestore';

export class ParticipantRecord {
  id: string; // Firebase -> Firestore document's id.
  docRef: DocumentReference; // Firebase -> Firestore document reference.
  username: string;
  location: string;
  created: Date;
  status: 'online' | 'offline' | 'idle'; // Type that allows only 3 specific strings.

  constructor(data?: { id?: string, docRef?: DocumentReference } & ParticipantModel) {
    this.id = data.id;
    this.docRef = data.docRef;
    this.username = data.username || '';
    this.location = data.location || '👽';
    this.created = data.created.toDate() || new Date(); // We convert Timestamp to a date object for javascript, if it exists || new Date()
    this.status = data.status || 'offline';
  }

  // We need this function to convert our class to an object that is readable from firestore.
  // This function converts ParticipantRecord to ParticipantModel.
  toModel(): ParticipantModel {
    return {
      username: this.username,
      location: this.location,
      created: Timestamp.fromDate(this.created), // Firestore can't store dates, it can store Timestamps so we convert date to Timestamp.
      status: this.status
    };
  }
}
