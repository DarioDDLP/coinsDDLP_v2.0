import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, LoadingSpinnerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly loadingService = inject(LoadingService);
}
