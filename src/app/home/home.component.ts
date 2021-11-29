import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {FormControl, ValidatorFn} from '@angular/forms';
import {DataService} from '../services/data.service';
import {MatDialog} from '@angular/material/dialog';
import {UsernameDialogComponent} from '../username-dialog/username-dialog.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  // Our form controller for room input field.
  roomControl!: FormControl;
  // We set this to true / false based on when user is typing on room input field or not.
  userTyping = false;
  // We set this to true / false based on when we are waiting for the server to respond with data.
  loading = false;

  constructor(private router: Router,
              private snackbar: MatSnackBar,
              public dataSrv: DataService,
              public dialogSrv: MatDialog) {
  }

  ngOnInit(): void {
    // We set our room input controller here with some initial value and the validators that we want as an array.
    this.roomControl = new FormControl('test room 1', [this.roomValidators()]);
  }

  // If user starts typing, set variable to true and dismiss any snackbar showing.
  startedTyping(): void {
    this.userTyping = true;
    this.snackbar.dismiss();
  }

  // We created our own validator because we want to have custom message this way.
  // Maybe it will have more cases later instead of just one.
  roomValidators(): ValidatorFn {
    // return (): { [key: string]: any } | null => {};
    return () => {
      if (this.roomControl?.value === '') {
        return { empty: 'Must not be empty' };
      }
      return null;
    };
  }

  /* We call this function to join a specific room ID.
   * It returns a Promise<void>, meaning we can chain it like so: joinRoom('123').then().catch();
   */
  async joinRoom(roomID: string): Promise<void> {
    // We set loading to true, so mat-spinner will appear.
    this.loading = true;
    // We check whether this room exists or not.
    const roomExists = await this.dataSrv.checkIfRoomExists(roomID);
    // If it doesn't exist, we show a snackbar at the bottom with some text and a button, set loading to false so mat-spinner disappears.
    if (!roomExists) {
      this.snackbar.open('Room doesn\'t exist!', 'Fine 🙄');
      this.loading = false;
      return;
    }
    // Else (since there's a return inside our if (line 63)) we open username dialog.
    this.openUsernameDialog(roomID);
  }

  /* We open a dialog to ask for user's username, then we initialize data service with that username.
   * Once initialization is complete, then we create / join a room.
   */
  openUsernameDialog(userTypedRoom?: string): void {
    // We create and store the reference of our newly initialized UsernameDialogComponent instance (class).
    // We set a width of 250px (custom options inside config {})
    const dialogRef = this.dialogSrv.open(UsernameDialogComponent, {width: '250px'});
    // We transfer to that instance's username, the data service's username, if it exists. Otherwise we put null.
    // If there was a value, then you will see that the input on the dialog is filled in with that value.
    // Otherwise it will be empty.
    dialogRef.componentInstance.username = this.dataSrv.username;
    // We subscribe to the observable of "afterClosed()", which means we will get the value "username", once the dialog is closed.
    // If the user clicked on "Cancel" button or left the dialog, the username will be null.
    dialogRef.afterClosed().subscribe(username => {
      // If there's no username typed in, we set loading to false and we exit. Nothing happens.
      if (!username) {
        this.loading = false;
        return;
      }
      // Otherwise we set loading to true to show mat-spinner.
      this.loading = true;
      console.log('The dialog was closed, result: ', username);
      // We initialize our data service (store username, id, update user's status etc).
      this.dataSrv.initialize(username)
        .then(_ => {
          if (!userTypedRoom) {
            // If user didn't type in a room ID, it means they clicked on "random room" button.
            // That means we have to create a chat room and then navigate to /chatRoom/id
            this.dataSrv.createChatRoom()
              .then(roomID => this.router.navigate(['/chatRoom/' + roomID]))
              .catch(e => this.showErrorSnackbar(e))
              .finally(() => this.loading = false);
          } else {
            // Otherwise we just navigate to /chatRoom/id
            this.router.navigate(['/chatRoom/' + userTypedRoom]);
          }
        })
        .catch(e => this.showErrorSnackbar(e));
    });
  }

  // If we encounter an error, we log it and set loading to false before showing a snackbar.
  showErrorSnackbar(e: any): void {
    console.error(e);
    this.loading = false;
    this.snackbar.open('Something went wrong 😕', 'Pff okay');
  }
}
