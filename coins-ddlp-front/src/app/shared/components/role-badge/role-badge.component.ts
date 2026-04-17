import { Component, input } from '@angular/core';
import { LITERALS } from '../../constants/literals';

@Component({
  selector: 'app-role-badge',
  templateUrl: './role-badge.component.html',
  styleUrl: './role-badge.component.scss',
})
export class RoleBadgeComponent {
  readonly role = input.required<string | null>();
  readonly size = input<'sm' | 'md'>('sm');

  readonly literals = LITERALS.admin;
}
