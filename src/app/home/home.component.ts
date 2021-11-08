import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {FormControl, ValidatorFn} from '@angular/forms';
import * as uuid from 'uuid';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  roomControl!: FormControl;
  userTyping = false;

  constructor(private router: Router, private snackbar: MatSnackBar) {
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
        return { empty: 'Must not be empty' };
      }
      if (this.roomControl?.value === '1') {
        return { taken: 'This room ID is taken' };
      }
      if (this.roomControl?.value.length < 7) {
        return { minLength: 'This room ID is not long enough' };
      }
      if (this.roomControl?.value.length >= 255) {
        return { maxLength: 'This room ID is too long' };
      }
      return null;
    };
  }

  joinRoom(room: string): Promise<boolean> {
    if (room) {
      return this.router.navigate(['/chatRoom/' + room]);
    }
    this.snackbar.open('Incorrect room ID', 'Fine 🙄');
  }

  generateRandomRoomID(): void {
    this.roomControl.setValue(String(uuid.v4()).split('-').join('').toUpperCase());
  }
}
