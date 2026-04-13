import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SearchInputComponent } from '../search-input/search-input.component';
import { CountryFlagComponent } from '../country-flag/country-flag.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-collection-layout',
  standalone: true,
  imports: [CommonModule, SearchInputComponent, CountryFlagComponent, ButtonComponent],
  templateUrl: './collection-layout.component.html',
  styleUrl: './collection-layout.component.scss',
})
export class CollectionLayoutComponent {
  private router = inject(Router);
  @Input() title = '';
  @Input() searchPlaceholder = '';
  @Input() searchValue = '';
  @Input() backLink: string[] | undefined;
  @Input() backLabel = '';
  @Input() country: string | undefined;
  @Input() cardBackground = 'rgba(255, 245, 232,)';

  @Output() searchChange = new EventEmitter<string>();

  onBack(): void {
    if (this.backLink) this.router.navigate(this.backLink);
  }

  onSearch(query: string): void {
    this.searchChange.emit(query);
  }
}
