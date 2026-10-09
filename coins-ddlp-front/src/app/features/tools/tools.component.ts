import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ButtonsHeaderComponent } from '../../shared/components/buttons-header/buttons-header.component';
import { PermissionsService } from '../../core/services/permissions.service';
import { getToolsNavItems } from './tools.config';
import { injectLiterals } from '../../shared/services/i18n.service';

@Component({
  selector: 'app-tools',
  imports: [RouterOutlet, ButtonsHeaderComponent],
  templateUrl: './tools.component.html',
  styleUrl: './tools.component.scss',
})
export class ToolsComponent {
  private permissions = inject(PermissionsService);
  private router = inject(Router);

  private literals = injectLiterals('herramientas');
  private navLiterals = injectLiterals('nav');
  readonly title = computed(() => this.literals().title);
  readonly overline = computed(() => this.navLiterals().groupManagement);
  readonly navItems = computed(() => getToolsNavItems(this.literals(), this.permissions.granted()));

  constructor() {
    // Si pierde los permisos (p. ej. al cerrar sesión) sale de Herramientas
    effect(() => {
      if (this.navItems().length === 0) {
        this.router.navigate(['/euros']);
      }
    });
  }
}
