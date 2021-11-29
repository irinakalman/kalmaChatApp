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
  /*
   * Chat input ngmodel variable gives data to user's input field in HTML.
   * It can also take data from that input a to typescript
   * because we're using [()] in our chatroom.component.html:49 // TODO: line might have changed
   * Starts undefined because we don't want the input field to have any value.
   */
  chatInputValue?: string;

  // The chat room that we're in right now will be initialized here once we get the ID from routing + check it on server.
  chatRoom?: ChatRoomRecord;

  // A boolean that controls the loading animation on HTML template ( *ngIf="loading" )
  loading = true;

  // A boolean to check if we updated user's status to "online" when they join the room.
  userStatusUpdated = false;

  // A variable to check which message was clicked on UI so we can show timestamp of when the message was sent.
  selectedMessage: MessageRecord | null = null;

  constructor(public dataSrv: DataService,
              private route: ActivatedRoute,
              private router: Router,
              private snackbar: MatSnackBar,
              public dialogSrv: MatDialog) { }

  ngOnInit(): void {
    // We subscribe to the changes that happen in navigation here
    this.route.paramMap.subscribe(async params => {
      const roomID = params.get('id');
      // We try to get parameter named "id"
      if (!roomID) {
        // If we can't find it, we navigate to /home.
        this.goToHome();
        return;
      }
      // If we find it, we check if that id exists in our server's database with room IDs
      console.log('Navigation room id:', roomID);
      const roomExists = await this.dataSrv.checkIfRoomExists(roomID);
      if (!roomExists) {
        // If the room doesn't exist, we navigate to /home.
        console.log('Room does not exist');
        this.goToHome();
        return;
      }
      // If the room exists, we check if our data service has a username already.
      if (!this.dataSrv.username) {
        // If data service doesn't have a username stored, we ask for user's username.
        console.log('no username found', this.dataSrv.username);
        return this.firstTimeUser(roomID);
      }
      // If data service has a username stored, we proceed to initialize / join the chat room.
      console.log('Found username: ', this.dataSrv.username);
      this.initChatRoom(this.dataSrv.username, roomID);
    });
  }

  // Function to navigate to /home.
  goToHome(): void {
    this.router.navigate(['/home']);
  }

  // We initialize the chatroom with a username and we give a room id to subscribe to this room's changes
  // Changes we expect: participant names & their status, new messages
  initChatRoom(username: string, roomID: string): void {
    this.dataSrv.initialize(username)
      .then(id => {
        this.dataSrv.getChatRoomByID(roomID).subscribe(chatRoomData => this.handleRoomData(chatRoomData));
      })
      .catch(e => {
        console.error(e);
        this.snackbar.open('Something went wrong 😕', 'I understand');
      })
      .finally(() => this.loading = false);
  }

  // Function to handle user that hasn't input their username before joining (e.g. given a link to join first time)
  firstTimeUser(roomID: string): void {
    // We open a dialog and we keep its reference.
    const dialogRef = this.dialogSrv.open(UsernameDialogComponent, {width: '250px'});
    // Using the dialog's reference, we get its instance and pass any existing username from data service / local storage
    dialogRef.componentInstance.username = this.dataSrv.username;
    // We subscribe to this dialog reference's afterClosed() observable to get the username (if there is any given).
    dialogRef.afterClosed().subscribe(username => {
      console.log('The dialog was closed, result: ', username);
      // Finally, we initialize the chatroom.
      this.initChatRoom(username, roomID);
    });
  }

  // Function to handle room data from observable ( this.dataSrv.getChatRoomByID().subscribe() )
  handleRoomData(chatRoomData: ChatRoomRecord): void {
    console.log('Chat room data:', chatRoomData);
    this.chatRoom = chatRoomData;
    this.updateParticipantStatus();

    // We scroll to bottom  whenever we receive or send a message.
    setTimeout(() => {
      const el = document.getElementById('contentElement');
      if (!el) { return; }
      el.scrollTop = el.scrollHeight;
    }, 1);
  }

  // Function to handle whether we should update the chatRoom's participant status.
  // We need to tell the other users that we left or just went A.F.K.
  updateParticipantStatus(): void {
    // If there's no chatRoom initialized, don't proceed.
    if (!this.chatRoom) { return; }
    // Flag to check if we should update at the end of the if statements or not.
    let shouldUpdate = false;
    // Check if we're in this chat room's participant list (checking by ID, not username - username isn't unique).
    const findMe = this.chatRoom.participants[this.dataSrv.participantID];
    if (!findMe) {
      // If we are not in this chat room's participant list, we put ourselves in and update the flag to true (boolean)
      this.chatRoom.participants[this.dataSrv.participantID] = this.dataSrv.participant;
      shouldUpdate = true;
    } else if (findMe && findMe.username !== this.dataSrv.username) {
      // If we are in this chat room's participant list, but with different username.
      // We update our name on this chat room.
      findMe.username = this.dataSrv.username;
      shouldUpdate = true;
    } else if (!this.userStatusUpdated) { // TODO: might need to remove "else", make it standalone if.
      // We update user's status to online once.
      findMe.status = 'online';
      this.dataSrv.participant.status = 'online';
      shouldUpdate = true;
      this.userStatusUpdated = true;
    }
    // If we didn't go through any of the if statements, we don't update the chatroom.
    if (!shouldUpdate) { return; }
    this.dataSrv.updateChatRoom(this.chatRoom);
  }

  // Function to handle sending messages (user pressed enter on input field or clicked on send button).
  sendMessage(): void {
    // If input field value is empty, we do not proceed.
    if (this.chatInputValue === '') { return; }
    // We store input field value in a temporary variable so we can set input's value to empty.
    const tempInput = this.chatInputValue;
    this.chatInputValue = '';
    // We generate a new unique ID.
    const newId = uuid.v4();
    // We create a new Message record with this new ID & our message data (who sent it, when, etc.)
    const newMessage = new MessageRecord({
      id: newId,
      message: tempInput,
      participantID: this.dataSrv.participantID,
      participantUsername: this.dataSrv.username,
    });
    newMessage.sent = new Date();
    // We get our messages sorted array and if there are more than 20 messages, we delete the one with earliest date.
    const sortedArray = this.sortedMessagesArray(this.chatRoom);
    if (sortedArray?.length >= 20) {
      const valueToRemove = sortedArray[0];
      delete this.chatRoom.lastMessages[valueToRemove.id]; // last 20 messages only
      // this.chatRoom.lastMessages = [];
    }
    // We set the new message to our chatRoom's "lastMessages" object.
    this.chatRoom.lastMessages[newId] = newMessage;
    // We update the chatRoom
    this.dataSrv.updateChatRoom(this.chatRoom)
      .then(() => console.log('sent'))
      .catch(e => {
        // If there was an error sending this message, we revert the array to previous state (almost - we deleted a message)
        console.error(e);
        // We open a snackbar at the bottom indicating the error to the user.
        this.snackbar.open('Something went wrong 😕', 'I understand');
        // We set the temporary variable's value as input field value.
        this.chatInputValue = tempInput;
        delete this.chatRoom.lastMessages[newId];
      });
  }

  // Function to handle user's exit button click.
  exitRoomDialog(): void {
    // If there's no chatRoom initialized, do not proceed.
    if (!this.chatRoom) {
      return; // TODO: snackbar error
    }
    // We open the ExitRoomDialog and we store its reference in a variable.
    const dialogRef = this.dialogSrv.open(ExitRoomDialogComponent, {width: '250px'});
    // We subscribe to this reference's .afterClosed() observable and wait for the user to click
    // either cancel or "leave room". We get the result of their choice as a boolean "userWillLeave".
    dialogRef.afterClosed().subscribe((userWillLeave: boolean) => {
      console.log('User will leave: ', userWillLeave);
      // If user clicked "cancel", we don't do anything.
      if (!userWillLeave) { return; }
      // If user clicked "leave room", we delete him from this chat room's participant list and we update the room.
      // Once the room on the server is updated, then we navigate to home.
      delete this.chatRoom.participants[this.dataSrv.participantID];
      this.dataSrv.updateChatRoom(this.chatRoom)
        .then(() => this.router.navigate(['/home']))
        .catch(e => {
          console.error(e);
        });
    });
  }

  // Function to handle user clicking logo / home button.
  goOfflineAtChatRoom(): void {
    // If there's no chatRoom initialized, do not proceed.
    if (!this.chatRoom) { return; }
    // We set user's status to offline for this chat room and we update the chatroom.
    this.chatRoom.participants[this.dataSrv.participantID].status = 'offline';
    this.dataSrv.updateChatRoom(this.chatRoom)
      .then(() => this.router.navigate(['/home']))
      .catch(e => {
        console.error(e);
      });
  }

  /*
   * Function to handle whether we show username above a message on UI.
   * We only want to show when a different user wrote something.
   * If same user keeps sending message, we don't show their username on every message.
   * (first time / message, we need to display regardless [idx === 0])
   */
  shouldShowUsername(message: MessageRecord, idx: number): boolean {
    if (idx === 0) {
      return true;
    }
    // If this chat room's previous message's participant ID is different from this message's participant ID.
    return this.sortedMessagesArray(this.chatRoom)[idx - 1]?.participantID !== message.participantID;
  }

  // Function to set which is the selected message when user clicks on a message.
  showTimestampForMessage(message: MessageRecord): void {
    this.selectedMessage = this.selectedMessage === message ? null : message;
  }

  // Function to get participant list as array instead of object.
  participantsArray(chatRoom: ChatRoomRecord): ParticipantRecord[] {
    return Object.values(chatRoom.participants || {});
  }

  // Function to get messages of chat room as a sorted array instead of object.
  sortedMessagesArray(chatRoom: ChatRoomRecord): MessageRecord[] {
    // Sort by message's sent date.
    // In order to sort by date, we convert date to number so our comparator works. (date.getTime() -> number)
    return Object.values(chatRoom.lastMessages || {})
      .sort((a, b) => a.sent.getTime() - b.sent.getTime());
  }
}
