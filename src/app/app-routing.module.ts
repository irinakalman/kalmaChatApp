import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {HomeComponent} from './home/home.component';
import {ChatroomComponent} from './chatroom/chatroom.component';
import {LoginComponent} from './login/login.component';

// routes = Route[] or Routes. It's an interface (object) without constructor.
const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'login',
    component: LoginComponent, // TODO: later
  },
  /*
  * When you go to chatRoom/123, you can grab '123' from => private or public route: ActivatedRoute (initialized / injected on constructor)
  * then => ngOnInit => this.route.paramMap.subscribe(params => {
  *   const id = params.get('id');
  *   console.log(id);
  * });
  */
  {
    path: 'chatRoom/:id',
    component: ChatroomComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
