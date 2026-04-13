import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CollectionLayoutComponent } from '../../../../shared/components/collection-layout/collection-layout.component';
import { EurosService } from '../../services/euros.service';
import { LITERALS } from '../../../../shared/constants/literals';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';

interface YearGroup {
  year: number;
  count: number;
  regular: number;
  commemorative: number;
}

@Component({
  selector: 'app-country-years',
  standalone: true,
  imports: [CommonModule, RouterLink, CollectionLayoutComponent],
  templateUrl: './country-years.component.html',
  styleUrl: './country-years.component.scss',
})
export class CountryYearsComponent implements OnInit {
  private eurosService = inject(EurosService);
  private route = inject(ActivatedRoute);

  readonly literals = LITERALS.euros;

  readonly country = signal('');
  readonly searchQuery = signal('');

  private countryCoins = signal<any[]>([]);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const currentCountry = params['country'] || '';
      this.country.set(currentCountry);

      if (currentCountry) {
        this.eurosService.getByCountry(currentCountry).subscribe(coins => {
          this.countryCoins.set(coins);
        });
      }
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
