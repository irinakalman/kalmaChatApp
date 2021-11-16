import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-username-dialog',
  templateUrl: './username-dialog.component.html',
  styleUrls: ['./username-dialog.component.scss']
})
export class UsernameDialogComponent implements OnInit {

  @Input() username = '';
  constructor() { }

  ngOnInit(): void {
  }

}
