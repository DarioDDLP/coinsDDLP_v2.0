import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CountryFlagComponent } from '../../../../shared/components/country-flag/country-flag.component';
import { CollectionLayoutComponent } from '../../../../shared/components/collection-layout/collection-layout.component';
import { EurosService } from '../../services/euros.service';
import { LITERALS } from '../../../../shared/constants/literals';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';

interface CountryGroup {
  country: string;
  minYear: number;
  maxYear: number;
}

@Component({
  selector: 'app-euros-list',
  standalone: true,
  imports: [CommonModule, RouterLink, CountryFlagComponent, CollectionLayoutComponent],
  templateUrl: './euros-list.component.html',
  styleUrl: './euros-list.component.scss',
})
export class EurosListComponent {
  private eurosService = inject(EurosService);

  readonly literals = LITERALS.euros;

  private allCoins = toSignal(this.eurosService.getAll(), { initialValue: [] });
  readonly searchQuery = signal('');

  readonly countryGroups = computed(() => {
    const coins = this.allCoins();
    const queryRaw = this.searchQuery().trim();

    const query = normalizeString(queryRaw);

    console.log(`📊 Total de monedas cargadas: ${coins.length}`);

    // Agrupar por país y calcular min/max year
    const grouped = new Map<string, { minYear: number; maxYear: number }>();

    coins.forEach(coin => {
      if (!grouped.has(coin.country)) {
        grouped.set(coin.country, { minYear: coin.year, maxYear: coin.year });
      } else {
        const group = grouped.get(coin.country)!;
        group.minYear = Math.min(group.minYear, coin.year);
        group.maxYear = Math.max(group.maxYear, coin.year);
      }
    });

    // Convertir a array y filtrar por búsqueda
    let result = Array.from(grouped.entries()).map(([country, { minYear, maxYear }]) => ({
      country,
      minYear,
      maxYear,
    }));

    console.log(`🌍 Países encontrados: ${result.length}`, result.map(r => r.country).sort());

    if (query) {
      result = result.filter(group => normalizeString(group.country).includes(query));
    }

    // Ordenar alfabéticamente
    result.sort((a, b) => a.country.localeCompare(b.country));

    return result;
  });

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }
}

