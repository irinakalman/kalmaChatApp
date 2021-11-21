import {Injectable} from '@angular/core';
import {firstValueFrom, Observable} from 'rxjs';
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

  // We have participantID on local storage.
  participantID: string;
  // We have username on local storage.
  username: string;
  // We have participant record (as model) on server.
  participant?: ParticipantRecord;

  /*
   * This gets called immediately whenever DataService is injected in another component (e.g: Line 17 @ app.component.ts)
   */
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
    // If there's no participant id, we create a participant on the server and we wait to get our unique ID.
    if (!this.participantID) {
      this.participantID = await this.createParticipantWithUsername(username);
    }
    // Alternatively, we can do line 41 like this with more code but less future errors:
    // this.createParticipantWithUsername(username)
    //   .then(participantID => console.log(participantID))
    //   .catch()
    //   .finally();

    // We subscribe to observable "getParticipantByID", we get the 1st result (our participant instance) and we stop observing for changes.
    this.participant = await firstValueFrom(this.getParticipantByID(this.participantID));
    console.log('participant dataSrv:', this.participant);
    // We locally update our participant's instance username with username given (usually from dialog).
    this.participant.username = username;
    // We send an updated participant instance to the server.
    await this.updateParticipant(this.participant);
    this.username = username;
    // We set local storage to remember these changes in case of refresh.
    localStorage.setItem('chatUsername', username);
    localStorage.setItem('userID', this.participantID);
  }

  /*
   * Promise -> we can use it like: this.checkIfRoomExists(id)
   * .then(myBoolean => console.log(myBoolean))
   * .catch(error => console.error(error)
   * .finally(() => console.log('Done'));
   *
   * or: const myBoolean = await this.checkIfRoomExists(id);
   */
  async checkIfRoomExists(id): Promise<boolean> {
    // this.firestore -> our database reference.
    // 'chatRooms' -> the collection inside our database to look in to.
    // id -> the document id inside the collection.
    // doc() -> creates a reference to the document(inside our database, inside our collection with this id).
    const roomRef = doc(this.firestore, `chatRooms/${id}`);
    // Once we have our reference that we want, we use getDoc(reference) to get our document from the server.
    const docSnapshot = await getDoc(roomRef);
    // Document.exists() checks if this room ID exists on our database.
    return docSnapshot.exists();
  }

  // Creates a chat room and returns id from server.
  async createChatRoom(): Promise<string> {
    // We initialize necessary data for our room as ChatRoomModel (for our server).
    const chatRoomData = {
      participantLimit: 2,
      created: Timestamp.fromDate(new Date())
    } as ChatRoomModel;
    // We create the collection reference to ask our database (this.firestore) with path "chatRooms" (our collection's path).
    const collectionRef = collection(this.firestore, 'chatRooms');
    // We add ChatRoomModel data to our collection reference and we await for the document reference to be created from server.
    const documentRef = await addDoc(collectionRef, chatRoomData);
    // We return the document reference's id.
    return documentRef.id;
  }

  /*
   * We create an observable for a chatRoom by giving its ID.
   * Any component can subscribe to this observable.
   * That component can then keep getting updates for this chatRoom (like new messages or participant status changes etc).
   */
  getChatRoomByID(id: string): Observable<ChatRoomRecord> {
    // We create a reference to our database's collection (this.firestore -> chatRooms) to get specific chatRoom ID.
    const documentReference = doc(this.firestore, `chatRooms/${id}`);
    /* DocSnapshots -> keeps getting document snapshots of our chatRoom.
     * We map our new snapshots from server (as ChatRoomModel) to new javascript instances/classes (new ChatRoomRecord(...)).
     */
    return docSnapshots(documentReference)
      .pipe(
        map(documentSnapshot => {
          /* We get our ChatRoomModel data from our documentSnapshot here (from the server).
           * const {} = obj -> creates variables with the same keys inside object as in variable name.
           * e.g. there's a "created" key inside documentSnapshot.data() object.
           * const created = documentSnapshot.data().created;
           * const participantLimit = documentSnapshot.data().participantLimit;
           * ....
           */
          const { created, participantLimit, participants, lastMessages } = documentSnapshot.data();
          /* We convert ChatRoomModel (documentSnapshot.data()) to new ChatRoomRecords (class).
           * We return it because we are inside a pipe -> map.. we map models to records basically.
           */
          return new ChatRoomRecord({
            id: documentSnapshot.id,
            docRef: documentSnapshot.ref,
            created,
            participantLimit,
            participants,
            lastMessages
          });
        })
      );
  }

  updateChatRoom(chatRoom: ChatRoomRecord): Promise<void> {
    // We generate our documentReference that points to the database and collection "chatRooms" -> specific chatRoom ID.
    const documentReference = doc(this.firestore, `chatRooms/${chatRoom.id}`);
    /* We take our documentReference and convert ChatRoomRecord to ChatRoomModel with chatRoom.toModel().
     * Then the data (as model) are sent to the firestore database.
     */
    return updateDoc(documentReference, chatRoom.toModel());
  }

  async createParticipantWithUsername(usr: string): Promise<string> {
    // We create a ParticipantModel (object) with the required data (username/location/created/status).
    const data = {
      username: usr,
      location: '',
      created: Timestamp.fromDate(new Date()),
      status: 'online'
    } as ParticipantModel;
    // We get collection reference (participants collection) from inside our database.
    const collectionReference = collection(this.firestore, 'participants');
    // We push to the server our data (participant model) with our collection reference that we just created.
    const documentReference = await addDoc(collectionReference, data);
    // We return this document's (participant) id.
    return documentReference.id;
  }

  getParticipantByID(id: string): Observable<ParticipantRecord> {
    const documentReference = doc(this.firestore, `participants/${id}`);
    return docSnapshots(documentReference)
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
    const documentReference = doc(this.firestore, `participants/${participant.id}`);
    return updateDoc(documentReference, participant.toModel());
  }
}
