import { Component } from '@angular/core';
import { ConmemorativasListComponent } from './components/conmemorativas-list/conmemorativas-list.component';

@Component({
  selector: 'app-conmemorativas',
  imports: [ConmemorativasListComponent],
  templateUrl: './conmemorativas.component.html',
  styleUrl: './conmemorativas.component.scss',
})
export class ConmemorativasComponent {}
