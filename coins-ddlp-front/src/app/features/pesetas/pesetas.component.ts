import { Component } from '@angular/core';
import { PesetasListComponent } from './components/pesetas-list/pesetas-list.component';

@Component({
  selector: 'app-pesetas',
  imports: [PesetasListComponent],
  templateUrl: './pesetas.component.html',
  styleUrl: './pesetas.component.scss',
})
export class PesetasComponent {}
