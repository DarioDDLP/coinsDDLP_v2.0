import { Component, computed, ErrorHandler, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CollectionLayoutComponent } from '../../../../shared/components/collection-layout/collection-layout.component';
import { EurosService } from '../../services/euros.service';
import { EuroCoin } from '../../../../shared/interfaces/euro-coin.interface';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { LITERALS } from '../../../../shared/constants/literals';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';

interface YearGroup {
  year: number;
  count: number;
  regular: number;
  commemorative: number;
}

@Component({
  selector: 'app-euros-years',
  imports: [CommonModule, RouterLink, CollectionLayoutComponent, EmptyPanelComponent],
  templateUrl: './euros-years.component.html',
  styleUrl: './euros-years.component.scss',
})
export class EurosYearsComponent implements OnInit {
  private eurosService = inject(EurosService);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(ErrorHandler);

  readonly literals = LITERALS.euros;

  readonly country = signal('');
  readonly searchQuery = signal('');
  readonly isReady = signal(false);
  readonly hasError = signal(false);

  readonly sharedLiterals = LITERALS.shared;

  private countryCoins = signal<Pick<EuroCoin, 'year' | 'commemorative'>[]>([]);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const currentCountry = params['country'] || '';
      this.country.set(currentCountry);

      if (currentCountry) {
        this.loadYears(currentCountry);
      }
    });
  }

  loadYears(country: string): void {
    this.hasError.set(false);
    this.isReady.set(false);
    this.eurosService.getByCountry(country).subscribe({
      next: coins => { this.countryCoins.set(coins); this.isReady.set(true); },
      error: (e) => { this.errorHandler.handleError(e); this.hasError.set(true); this.isReady.set(true); },
    });
  }

  readonly yearGroups = computed(() => {
    const coins = this.countryCoins();
    const queryRaw = this.searchQuery().trim();

    const query = normalizeString(queryRaw);

    // Agrupar por año (datos ya vienen filtrados por país desde Supabase)
    const grouped = new Map<number, { count: number; regular: number; commemorative: number }>();

    coins.forEach(coin => {
      const existing = grouped.get(coin.year) ?? { count: 0, regular: 0, commemorative: 0 };
      existing.count++;
      if (coin.commemorative) {
        existing.commemorative++;
      } else {
        existing.regular++;
      }
      grouped.set(coin.year, existing);
    });

    // Convertir a array y filtrar por búsqueda
    let result: YearGroup[] = Array.from(grouped.entries()).map(([year, { count, regular, commemorative }]) => ({
      year,
      count,
      regular,
      commemorative,
    }));

    if (query) {
      result = result.filter(group => {
        const yearStr = group.year.toString();
        return yearStr.includes(query);
      });
    }

    // Ordenar ascendentemente (años más antiguos primero)
    result.sort((a, b) => a.year - b.year);

    return result;
  });

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }
}
