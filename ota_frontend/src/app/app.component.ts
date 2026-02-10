import { Component } from '@angular/core';
import { AddUserDrawerComponent } from './add-user-drawer/add-user-drawer.component';

@Component({
  selector: 'app-root',
  imports: [AddUserDrawerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'ota_frontend is being generated';
  addUserOpen = true;
}
