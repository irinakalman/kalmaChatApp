import {Component, OnInit} from '@angular/core';
import {DataService} from './services/data.service';
import {Router} from '@angular/router';
import {ExitRoomDialogComponent} from './exit-room-dialog/exit-room-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {firstValueFrom} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'kalma';
  userJoinedRoom = false;

  constructor(public dataSrv: DataService,
              public dialogSrv: MatDialog,
              private router: Router) {
  }

  ngOnInit(): void {
    this.dataSrv.currentRoomID.subscribe(res => this.userJoinedRoom = !!res);
  }

  exitRoomDialog(): void {
    if (!this.dataSrv.currentRoomID.value) {
      return; // TODO: snackbar error
    }
    firstValueFrom(this.dataSrv.getChatRoomByID(this.dataSrv.currentRoomID.value)).then(roomData => {
      const dialogRef = this.dialogSrv.open(ExitRoomDialogComponent, {width: '250px'});
      dialogRef.afterClosed().subscribe((userWillLeave: boolean) => {
        console.log('User will leave: ', userWillLeave);
        if (!userWillLeave) { return; }
        this.dataSrv.currentRoomID.next(null);
        const find = roomData.participants.find(p => p.id === this.dataSrv.participantID);
        roomData.participants.splice(roomData.participants.indexOf(find), 1);
        this.dataSrv.updateChatRoom(roomData)
          .then(() => this.router.navigate(['/home']))
          .catch(e => {
            console.error(e);
          });
      });
    });
  }

  goOfflineAtChatRoom(): void {
    if (!this.dataSrv.currentRoomID.value) { return; }
    firstValueFrom(this.dataSrv.getChatRoomByID(this.dataSrv.currentRoomID.value)).then(roomData => {
      this.dataSrv.currentRoomID.next(null);
      const find = roomData.participants.find(p => p.id === this.dataSrv.participantID);
      find.status = 'offline';
      this.dataSrv.updateChatRoom(roomData)
        .then(() => this.router.navigate(['/home']))
        .catch(e => {
          console.error(e);
        });
    });
  }
}
