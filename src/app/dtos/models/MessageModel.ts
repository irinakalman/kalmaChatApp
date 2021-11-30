import firebase from 'firebase/compat';
import Timestamp = firebase.firestore.Timestamp;
import FieldValue = firebase.firestore.FieldValue;

export interface MessageModel {
  id: string;
  participantID: string;
  participantUsername: string;
  message: string;
  sent?: FieldValue;
  delivered?: FieldValue;
  seen?: FieldValue;
}
