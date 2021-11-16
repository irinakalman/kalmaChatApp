import {Injectable} from '@angular/core';
import {BehaviorSubject, firstValueFrom, Observable} from 'rxjs';
import {ChatRoomRecord} from '../dtos/ChatRoomRecord';
import {map} from 'rxjs/operators';
import {addDoc, collection, doc, docSnapshots, Firestore, getDoc, Timestamp, updateDoc} from '@angular/fire/firestore';
import {ParticipantRecord} from '../dtos/ParticipantRecord';
import {ParticipantModel} from '../dtos/models/ParticipantModel';
import {ChatRoomModel} from '../dtos/models/ChatRoomModel';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  currentRoomID = new BehaviorSubject<string>(null);
  participantID: string;
  username: string;
  participant?: ParticipantRecord;
  constructor(public firestore: Firestore) {
    this.checkLocalStorage();
  }

  private checkLocalStorage(): void {
    console.log('Checking local storage..');
    this.participantID = localStorage.getItem('userID');
    this.username = localStorage.getItem('chatUsername');
    console.log('Found user ID:', this.participantID);
    console.log('Found username:', this.username);
  }

  async initialize(username: string): Promise<void> {
    this.participantID = localStorage.getItem('userID');
    if (!this.participantID) {
      this.participantID = await this.createParticipantWithUsername(username);
    }
    this.participant = await firstValueFrom(this.getParticipantByID(this.participantID));
    console.log('participant dataSrv:', this.participant);
    this.participant.username = username;
    this.username = username;
    localStorage.setItem('chatUsername', username);
    await this.updateParticipant(this.participant);
    return localStorage.setItem('userID', this.participantID);
  }

  async checkIfRoomExists(id): Promise<boolean> {
    const roomRef = doc(this.firestore, `chatRooms/${id}`);
    const docSnap = await getDoc(roomRef);
    return docSnap.exists();
  }

  async createChatRoom(): Promise<string> {
    const data = {
      participantLimit: 2,
      created: Timestamp.fromDate(new Date())
    } as ChatRoomModel;
    const c = collection(this.firestore, 'chatRooms');
    const d = await addDoc(c, data);
    return d.id;
  }

  getChatRoomByID(id: string): Observable<ChatRoomRecord> {
    const d = doc(this.firestore, `chatRooms/${id}`);
    return docSnapshots(d)
      .pipe(
        map(res => {
          console.log(res);
          const { created, participantLimit, participants, lastMessages } = res.data();
          return new ChatRoomRecord({
            id: res.id,
            docRef: res.ref,
            created,
            participantLimit,
            participants,
            lastMessages
          });
        })
      );
  }

  updateChatRoom(chatRoom: ChatRoomRecord): Promise<void> {
    const d = doc(this.firestore, `chatRooms/${chatRoom.id}`);
    return updateDoc(d, chatRoom.toModel());
  }

  async createParticipantWithUsername(usr: string): Promise<string> {
    const data = {
      username: usr,
      location: '',
      created: Timestamp.fromDate(new Date()),
      status: 'online'
    } as ParticipantModel;
    const c = collection(this.firestore, 'participants');
    const d = await addDoc(c, data);
    return d.id;
  }

  getParticipantByID(id: string): Observable<ParticipantRecord> {
    const d = doc(this.firestore, `participants/${id}`);
    return docSnapshots(d)
      .pipe(
        map(res => {
          const { usr, location, created, status } = res.data();
          return new ParticipantRecord({
            id: res.id,
            docRef: res.ref,
            username: usr,
            location,
            created,
            status
          });
        })
      );
  }

  updateParticipant(participant: ParticipantRecord): Promise<void> {
    const d = doc(this.firestore, `participants/${participant.id}`);
    return updateDoc(d, participant.toModel());
  }
}
