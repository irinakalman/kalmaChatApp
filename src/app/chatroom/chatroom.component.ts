import { Component, OnInit } from '@angular/core';
import {DataService} from '../services/data.service';
import {ChatRoomRecord} from '../dtos/ChatRoomRecord';
import {ActivatedRoute, Router} from '@angular/router';
import {UsernameDialogComponent} from '../username-dialog/username-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MessageRecord} from '../dtos/MessageRecord';
import * as uuid from 'uuid';
import {ParticipantRecord} from '../dtos/ParticipantRecord';
import {ExitRoomDialogComponent} from '../exit-room-dialog/exit-room-dialog.component';

@Component({
  selector: 'app-chatroom',
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.scss']
})
export class ChatroomComponent implements OnInit {
  cInput?: string;
  chatRoom?: ChatRoomRecord;
  loading = true;
  roomNotFound = false;
  allowOnce = true;
  selectedMessage: MessageRecord | null = null;

  constructor(public dataSrv: DataService,
              private route: ActivatedRoute,
              private router: Router,
              private snackbar: MatSnackBar,
              public dialogSrv: MatDialog) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(async params => {
      const roomID = params.get('id');
      if (!roomID) {
        this.goToHome();
        return;
      }
      console.log('Navigation room id:', roomID);
      const roomExists = await this.dataSrv.checkIfRoomExists(roomID);
      if (!roomExists) {
        console.log('Room does not exist');
        this.roomNotFound = true;
        this.goToHome();
        return;
      }
      if (!this.dataSrv.username) {
        console.log('no username found', this.dataSrv.username);
        return this.firstTimeUser(roomID);
      }
      console.log('Found username: ', this.dataSrv.username);
      this.initChatRoom(this.dataSrv.username, roomID);
    });
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }

  initChatRoom(username: string, roomID: string): void {
    this.dataSrv.initialize(username)
      .then(id => {
        this.dataSrv.getChatRoomByID(roomID).subscribe(res => this.handleRoomData(res));
      })
      .catch(e => {
        console.error(e);
        this.snackbar.open('Something went wrong 😕', 'I understand');
      })
      .finally(() => this.loading = false);
  }

  firstTimeUser(roomID: string): void {
    const dialogRef = this.dialogSrv.open(UsernameDialogComponent, {width: '250px'});
    dialogRef.componentInstance.username = this.dataSrv.username;
    dialogRef.afterClosed().subscribe(username => {
      console.log('The dialog was closed, result: ', username);
      this.initChatRoom(username, roomID);
    });
  }

  handleRoomData(chatRoomData: ChatRoomRecord): void {
    this.chatRoom = chatRoomData;
    console.log('Chat room data:', chatRoomData);
    this.updateParticipantStatus();

    // We scroll to bottom  whenever we receive or send a message.
    setTimeout(() => {
      const el = document.getElementById('contentElement');
      if (!el) { return; }
      el.scrollTop = el.scrollHeight;
    }, 1);
  }

  updateParticipantStatus(): void {
    if (!this.chatRoom) { return; }
    let shouldUpdate = false;
    const findMe = this.chatRoom.participants[this.dataSrv.participantID];
    if (!findMe) {
      this.chatRoom.participants[this.dataSrv.participantID] = this.dataSrv.participant;
      shouldUpdate = true;
    } else if (findMe && findMe.username !== this.dataSrv.username) {
      findMe.username = this.dataSrv.username;
      shouldUpdate = true;
    } else if (this.allowOnce) {
      findMe.status = 'online';
      this.dataSrv.participant.status = 'online';
      shouldUpdate = true;
      this.allowOnce = false;
    }
    if (!shouldUpdate) { return; }
    this.dataSrv.updateChatRoom(this.chatRoom);
  }

  sendMessage(): void {
    if (this.cInput === '') { return; }
    const tempInput = this.cInput;
    this.cInput = '';
    const newId = uuid.v4();
    const newMessage = new MessageRecord({
      id: newId,
      message: tempInput,
      participantID: this.dataSrv.participantID,
      participantUsername: this.dataSrv.username,
    });
    newMessage.sent = new Date();
    const sortedArray = this.sortedMessagesArray(this.chatRoom);
    if (sortedArray?.length >= 20) {
      const valueToRemove = sortedArray[0];
      delete this.chatRoom.lastMessages[valueToRemove.id]; // last 20 messages only
      // this.chatRoom.lastMessages = [];
    }
    this.chatRoom.lastMessages[newId] = newMessage;
    this.dataSrv.updateChatRoom(this.chatRoom)
      .then(() => console.log('sent'))
      .catch(e => {
        console.error(e);
        this.snackbar.open('Something went wrong 😕', 'I understand');
        this.cInput = tempInput;
        delete this.chatRoom.lastMessages[newId];
      });
  }

  exitRoomDialog(): void {
    if (!this.chatRoom) {
      return; // TODO: snackbar error
    }
    const dialogRef = this.dialogSrv.open(ExitRoomDialogComponent, {width: '250px'});
    dialogRef.afterClosed().subscribe((userWillLeave: boolean) => {
      console.log('User will leave: ', userWillLeave);
      if (!userWillLeave) { return; }
      delete this.chatRoom.participants[this.dataSrv.participantID];
      this.dataSrv.updateChatRoom(this.chatRoom)
        .then(() => this.router.navigate(['/home']))
        .catch(e => {
          console.error(e);
        });
    });
  }

  goOfflineAtChatRoom(): void {
    if (!this.chatRoom) { return; }
    this.chatRoom.participants[this.dataSrv.participantID].status = 'offline';
    this.dataSrv.updateChatRoom(this.chatRoom)
      .then(() => this.router.navigate(['/home']))
      .catch(e => {
        console.error(e);
      });
  }

  shouldShowUsername(message: MessageRecord, idx: number): boolean {
    if (idx === 0) {
      return true;
    }
    return this.sortedMessagesArray(this.chatRoom)[idx - 1]?.participantID !== message.participantID;
  }

  showTimestampForMessage(message: MessageRecord): void {
    this.selectedMessage = this.selectedMessage === message ? null : message;
  }

  participantsArray(chatRoom: ChatRoomRecord): ParticipantRecord[] {
    return Object.values(chatRoom.participants || {});
  }

  sortedMessagesArray(chatRoom: ChatRoomRecord): MessageRecord[] {
    return Object.values(chatRoom.lastMessages || {})
      .sort((a, b) => a.sent.getTime() - b.sent.getTime());
  }
}
