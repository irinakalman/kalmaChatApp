import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {FormControl, ValidatorFn} from '@angular/forms';
import * as uuid from 'uuid';
import {DataService} from '../services/data.service';
import {MatDialog} from '@angular/material/dialog';
import {UsernameDialogComponent} from '../username-dialog/username-dialog.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  roomControl!: FormControl;
  userTyping = false;
  loading = false;

  constructor(private router: Router,
              private snackbar: MatSnackBar,
              public dataSrv: DataService,
              public dialogSrv: MatDialog) {
  }

  ngOnInit(): void {
    this.roomControl = new FormControl('test room 1', [this.roomValidators()]);
  }

  startedTyping(): void {
    this.userTyping = true;
    this.snackbar.dismiss();
  }

  roomValidators(): ValidatorFn {
    return (): { [key: string]: any } | null => {
      if (this.roomControl?.value === '') {
        return {empty: 'Must not be empty'};
      }
      return null;
    };
  }

  async joinRoom(roomID: string): Promise<void> {
    this.loading = true;
    const roomExists = await this.dataSrv.checkIfRoomExists(roomID);
    if (!roomExists) {
      this.snackbar.open('Room doesn\'t exist!', 'Fine 🙄');
      this.loading = false;
      return;
    }
    this.openUsernameDialog(roomID);
  }

  generateRandomRoomAndJoin(): void {
    this.openUsernameDialog();
  }

  openUsernameDialog(userTypedRoom?: string): void {
    this.loading = true;
    const dialogRef = this.dialogSrv.open(UsernameDialogComponent, {width: '250px'});
    dialogRef.componentInstance.username = this.dataSrv.username;
    dialogRef.afterClosed().subscribe(username => {
      console.log('The dialog was closed, result: ', username);
      this.dataSrv.initialize(username)
        .then(id => {
          if (!userTypedRoom) {
            this.dataSrv.createChatRoom()
              .then(roomID => this.router.navigate(['/chatRoom/' + roomID]));
          } else {
            this.router.navigate(['/chatRoom/' + userTypedRoom]);
          }
        })
        .catch(e => {
          console.error(e);
          this.snackbar.open('Something went wrong 😕', 'I understand');
        })
        .finally(() => this.loading = false);
    });
  }
}
