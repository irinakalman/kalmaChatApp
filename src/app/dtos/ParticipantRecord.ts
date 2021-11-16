import {ParticipantModel} from './models/ParticipantModel';
import {DocumentReference, Timestamp} from '@angular/fire/firestore';

export class ParticipantRecord {
  id: string;
  docRef: DocumentReference;
  username: string;
  location: string;
  created: Date;
  status: 'online' | 'offline' | 'idle';

  constructor(data?: { id?: string, docRef?: DocumentReference } & ParticipantModel) {
    this.id = data.id;
    this.docRef = data.docRef;
    this.username = data.username || '';
    this.location = data.location || '👽';
    this.created = data.created.toDate() || new Date();
    this.status = data.status || 'offline';
  }

  toModel(): ParticipantModel {
    return {
      username: this.username,
      location: this.location,
      created: Timestamp.fromDate(this.created),
      status: this.status
    };
  }
}
