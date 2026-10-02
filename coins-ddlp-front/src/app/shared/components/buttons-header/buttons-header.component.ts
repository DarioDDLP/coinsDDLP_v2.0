import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface NavItem {
  label: string;
  routerLink: string;
  icon: string;
}

/** Cabecera de sección con pestañas enlazadas a rutas hijas (Admin, Herramientas). */
@Component({
  selector: 'app-buttons-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './buttons-header.component.html',
  styleUrl: './buttons-header.component.scss',
})
export class ButtonsHeaderComponent {
  title = input.required<string>();
  overline = input<string>('');
  items = input<NavItem[]>([]);
}
