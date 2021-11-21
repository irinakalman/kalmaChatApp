import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {initializeApp, provideFirebaseApp} from '@angular/fire/app';
import {environment} from '../environments/environment';
import {ScreenTrackingService, UserTrackingService} from '@angular/fire/analytics';
import {connectFirestoreEmulator, getFirestore, provideFirestore} from '@angular/fire/firestore';
import {HomeComponent} from './home/home.component';
import {ChatroomComponent} from './chatroom/chatroom.component';
import {LoginComponent} from './login/login.component';
import {RouterModule} from '@angular/router';
import {AppRoutingModule} from './app-routing.module';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatDividerModule} from '@angular/material/divider';
import {MatRippleModule} from '@angular/material/core';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { UsernameDialogComponent } from './username-dialog/username-dialog.component';
import {MatDialogModule} from '@angular/material/dialog';
import { ExitRoomDialogComponent } from './exit-room-dialog/exit-room-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ChatroomComponent,
    LoginComponent,
    UsernameDialogComponent,
    ExitRoomDialogComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => {
      const db = getFirestore();
      if (environment.production) { return db; }
      connectFirestoreEmulator(db, 'localhost', 8080);
      return db;
    }),
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    FormsModule,
    MatDividerModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  providers: [
    ScreenTrackingService,
    UserTrackingService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
