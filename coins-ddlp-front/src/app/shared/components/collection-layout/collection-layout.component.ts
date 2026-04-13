import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SearchInputComponent } from '../search-input/search-input.component';
import { CountryFlagComponent } from '../country-flag/country-flag.component';

@Component({
  selector: 'app-collection-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, SearchInputComponent, CountryFlagComponent],
  templateUrl: './collection-layout.component.html',
  styleUrl: './collection-layout.component.scss',
})
export class CollectionLayoutComponent {
  @Input() title = '';
  @Input() searchPlaceholder = '';
  @Input() searchValue = '';
  @Input() backLink: string[] | undefined;
  @Input() backLabel = '';
  @Input() country: string | undefined;
  @Input() cardBackground = 'rgba(255, 245, 232,)';

  @Output() searchChange = new EventEmitter<string>();

  onSearch(query: string): void {
    this.searchChange.emit(query);
  }
}
