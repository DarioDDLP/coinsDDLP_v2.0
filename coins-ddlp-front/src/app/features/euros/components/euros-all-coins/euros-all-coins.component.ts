import { Component, computed, ErrorHandler, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CollectionLayoutComponent } from '../../../../shared/components/collection-layout/collection-layout.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { CoinUdsDialogComponent } from '../coin-uds-dialog/coin-uds-dialog.component';
import { EurosService } from '../../services/euros.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EuroCoin } from '../../../../shared/interfaces/euro-coin.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';
import { getConservationBadge, getUdsBadge } from '../../../../shared/helpers/badge.helpers';
import { sortByFaceValue } from '../../constants/face-value-order.const';

@Component({
  selector: 'app-euros-all-coins',
  imports: [CommonModule, TableModule, CollectionLayoutComponent, BadgeComponent, ButtonComponent, EmptyPanelComponent, CoinUdsDialogComponent],
  templateUrl: './euros-all-coins.component.html',
  styleUrl: './euros-all-coins.component.scss',
})
export class EurosAllCoinsComponent implements OnInit {
  private eurosService  = inject(EurosService);
  private route         = inject(ActivatedRoute);
  private router        = inject(Router);
  private errorHandler  = inject(ErrorHandler);
  readonly authService  = inject(AuthService);

  readonly literals       = LITERALS.euros;
  readonly sharedLiterals = LITERALS.shared;

  readonly country      = signal('');
  readonly searchQuery  = signal('');
  readonly isReady      = signal(false);
  readonly hasError     = signal(false);
  readonly dialogVisible  = signal(false);
  readonly selectedCoin   = signal<EuroCoin | null>(null);

  private allCoins = signal<EuroCoin[]>([]);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const currentCountry = params['country'] || '';
      this.country.set(currentCountry);
      if (currentCountry) this.loadCoins(currentCountry);
    });
  }

  loadCoins(country: string): void {
    this.hasError.set(false);
    this.isReady.set(false);
    this.eurosService.getAllByCountry(country).subscribe({
      next: coins => { this.allCoins.set(coins); this.isReady.set(true); },
      error: (e) => { this.errorHandler.handleError(e); this.hasError.set(true); this.isReady.set(true); },
    });
  }

  readonly coinRows = computed(() => {
    const query = normalizeString(this.searchQuery());
    let coins = this.allCoins();

    if (query) {
      coins = coins.filter(c =>
        normalizeString(c.faceValue).includes(query) ||
        normalizeString(c.description).includes(query)
      );
    }

    return [...coins]
      .sort((a, b) => a.year !== b.year ? a.year - b.year : sortByFaceValue(a, b))
      .map(coin => ({
        coin,
        year: coin.year,
        conservationBadge: getConservationBadge(coin.conservation),
        udsBadge: getUdsBadge(coin.uds),
      }));
  });

  readonly hasMint = computed(() => this.allCoins().some(c => c.mint));
  readonly hasNonCirculating = computed(() => this.coinRows().some(r => !r.coin.circulation));
  readonly backLink = computed(() => ['/euros', this.country()]);

  onSearch(query: string): void { this.searchQuery.set(query); }

  onCoinClick(coin: EuroCoin): void {
    this.router.navigate(['/euros', this.country(), 'all', coin.id]);
  }

  onEditUnits(coin: EuroCoin): void {
    this.selectedCoin.set(coin);
    this.dialogVisible.set(true);
  }

  onDialogSaved(): void { this.loadCoins(this.country()); }

  onDialogClosed(): void {
    this.dialogVisible.set(false);
    this.selectedCoin.set(null);
  }
}
