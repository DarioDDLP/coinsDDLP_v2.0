import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CollectionLayoutComponent } from '../../../../shared/components/collection-layout/collection-layout.component';
import { CoinBadgeComponent } from '../../../../shared/components/coin-badge/coin-badge.component';
import { EurosService } from '../../services/euros.service';
import { EuroCoin } from '../../../../shared/interfaces/euro-coin.interface';
import { LITERALS } from '../../../../shared/constants/literals';

@Component({
  selector: 'app-euros-detail',
  standalone: true,
  imports: [CommonModule, TableModule, CollectionLayoutComponent, CoinBadgeComponent],
  templateUrl: './euros-detail.component.html',
  styleUrl: './euros-detail.component.scss',
})
export class EurosDetailComponent implements OnInit {
  private eurosService = inject(EurosService);
  private route = inject(ActivatedRoute);

  readonly literals = LITERALS.euros;

  readonly country = signal('');
  readonly year = signal<number | null>(null);
  private yearCoins = signal<EuroCoin[]>([]);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const currentCountry = params['country'] || '';
      const currentYear = params['year'] ? parseInt(params['year'], 10) : null;

      this.country.set(currentCountry);
      this.year.set(currentYear);

      if (currentCountry && currentYear !== null) {
        this.eurosService.getByCountryAndYear(currentCountry, currentYear).subscribe(coins => {
          this.yearCoins.set(coins);
        });
      }
    });
  }

  readonly coins = computed<EuroCoin[]>(() => {
    return this.yearCoins();
  });

  readonly hasMint = computed(() => this.yearCoins().some(c => c.mint));

  readonly title = computed(() => {
    const currentYear = this.year();
    return currentYear ? currentYear.toString() : '';
  });

  readonly backLink = computed(() => {
    const currentCountry = this.country();
    return currentCountry ? ['/euros', currentCountry] : ['/euros'];
  });

  onSearch(query: string): void {
    // Búsqueda no implementada por ahora en tabla de detalle
  }
}
