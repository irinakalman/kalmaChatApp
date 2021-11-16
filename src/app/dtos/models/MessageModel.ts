import firebase from 'firebase/compat';
import Timestamp = firebase.firestore.Timestamp;

export interface MessageModel {
  id: string;
  participantID: string;
  participantUsername: string;
  message: string;
  sent?: Timestamp;
  delivered?: Timestamp;
  seen?: Timestamp;
}
