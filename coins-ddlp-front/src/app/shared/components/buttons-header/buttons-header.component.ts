import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface NavItem {
  label: string;
  routerLink: string;
  icon: string;
}

@Component({
  selector: 'app-buttons-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './buttons-header.component.html',
  styleUrl: './buttons-header.component.scss',
})
export class ButtonsHeaderComponent {
  title = input.required<string>();
  items = input<NavItem[]>([]);
}
