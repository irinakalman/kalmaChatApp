import { Component, OnInit } from '@angular/core';
import {DataService} from '../services/data.service';
import {ChatRoomRecord} from '../dtos/ChatRoomRecord';
import {ActivatedRoute, Router} from '@angular/router';
import {UsernameDialogComponent} from '../username-dialog/username-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MessageRecord} from '../dtos/MessageRecord';
import * as uuid from 'uuid';

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
        this.dataSrv.currentRoomID.next(roomID);
        this.dataSrv.getChatRoomByID(roomID).subscribe(res => this.handleRoomData(res));
      })
      .catch(e => {
        this.dataSrv.currentRoomID.next(null);
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
    console.log('current user ID:', this.dataSrv.participantID);
    console.log('dataSrv participant:', this.dataSrv.participant);
    this.updateParticipantStatus();
  }

  updateParticipantStatus(): void {
    if (!this.dataSrv.currentRoomID.value) { return; }
    let shouldUpdate = false;
    const findMe = this.chatRoom.participants.find(p => p.id === this.dataSrv.participantID);
    console.log(findMe);
    if (!findMe) {
      this.chatRoom.participants.push(this.dataSrv.participant);
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
    const newMessage = new MessageRecord({
      id: uuid.v4(),
      message: tempInput,
      participantID: this.dataSrv.participantID,
      participantUsername: this.dataSrv.username,
    });
    newMessage.sent = new Date();
    if (this.chatRoom?.lastMessages?.length >= 20) {
      this.chatRoom.lastMessages?.pop(); // last 20 messages only
      // this.chatRoom.lastMessages = [];
    }
    this.chatRoom.lastMessages.push(newMessage);
    this.dataSrv.updateChatRoom(this.chatRoom)
      .then(() => console.log('sent'))
      .catch(e => {
        console.error(e);
        this.snackbar.open('Something went wrong 😕', 'I understand');
        this.cInput = tempInput;
        this.chatRoom.lastMessages.splice(this.chatRoom.lastMessages.indexOf(newMessage), 1);
      });
  }

  shouldShowUsername(message: MessageRecord, idx: number): boolean {
    if (idx === this.chatRoom.lastMessages.length - 1) {
      return true;
    }
    return this.chatRoom.lastMessages[idx + 1]?.participantID !== message.participantID;
  }

  showTimestampForMessage(message: MessageRecord): void {
    this.selectedMessage = this.selectedMessage === message ? null : message;
  }
}
