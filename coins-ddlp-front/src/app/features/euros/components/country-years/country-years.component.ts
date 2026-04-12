import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { CollectionLayoutComponent } from '../../../../shared/components/collection-layout/collection-layout.component';
import { EurosService } from '../../services/euros.service';
import { LITERALS } from '../../../../shared/constants/literals';

interface YearGroup {
  year: number;
  count: number;
  regular: number;
  commemorative: number;
}

@Component({
  selector: 'app-country-years',
  standalone: true,
  imports: [CommonModule, CollectionLayoutComponent],
  templateUrl: './country-years.component.html',
  styleUrl: './country-years.component.scss',
})
export class CountryYearsComponent implements OnInit {
  private eurosService = inject(EurosService);
  private route = inject(ActivatedRoute);

  readonly literals = LITERALS.euros;

  readonly country = signal('');
  private allCoins = toSignal(this.eurosService.getAll(), { initialValue: [] });
  readonly searchQuery = signal('');

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.country.set(params['country'] || '');
    });
  }

  readonly yearGroups = computed(() => {
    const coins = this.allCoins();
    const currentCountry = this.country();
    const queryRaw = this.searchQuery().trim();

    if (!currentCountry) return [];

    // Normalizar query (minúsculas + sin acentos)
    const query = queryRaw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Filtrar por país y agrupar por año
    const grouped = new Map<number, { count: number; regular: number; commemorative: number }>();

    coins.forEach(coin => {
      if (coin.country === currentCountry) {
        const existing = grouped.get(coin.year) ?? { count: 0, regular: 0, commemorative: 0 };
        existing.count++;
        if (coin.commemorative) {
          existing.commemorative++;
        } else {
          existing.regular++;
        }
        grouped.set(coin.year, existing);
      }
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
