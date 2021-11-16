import firebase from 'firebase/compat';
import Timestamp = firebase.firestore.Timestamp;

export interface ParticipantModel {
  username: string;
  location: string;
  created?: Timestamp;
  status?: 'online' | 'offline' | 'idle';
}
