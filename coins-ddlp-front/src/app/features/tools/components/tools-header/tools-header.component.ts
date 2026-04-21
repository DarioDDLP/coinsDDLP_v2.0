import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TOOLS_NAV_ITEMS, ToolsNavItem } from './tools-header.config';
import { LITERALS } from '../../../../shared/constants/literals';

@Component({
  selector: 'app-tools-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './tools-header.component.html',
  styleUrl: './tools-header.component.scss',
})
export class ToolsHeaderComponent {
  readonly title = LITERALS.herramientas.title;
  readonly items: ToolsNavItem[] = TOOLS_NAV_ITEMS;
}
