import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EurosService } from '../../services/euros.service';
import { NumistaService } from '../../../../core/services/numista.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { EuroCoin } from '../../../../shared/interfaces/euro-coin.interface';
import { NumistaCoin } from '../../../../shared/interfaces/numista-coin.interface';
import { CoinBadgeComponent } from '../../../../shared/components/coin-badge/coin-badge.component';
import { UnitBadgeComponent } from '../../../../shared/components/unit-badge/unit-badge.component';
import { CountryFlagComponent } from '../../../../shared/components/country-flag/country-flag.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { CollectionLayoutComponent } from '../../../../shared/components/collection-layout/collection-layout.component';
import { LITERALS } from '../../../../shared/constants/literals';

@Component({
  selector: 'app-coin-detail',
  standalone: true,
  imports: [CoinBadgeComponent, UnitBadgeComponent, CountryFlagComponent, ButtonComponent, LoadingSpinnerComponent, CollectionLayoutComponent],
  templateUrl: './coin-detail.component.html',
  styleUrl: './coin-detail.component.scss',
})
export class CoinDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eurosService = inject(EurosService);
  private numistaService = inject(NumistaService);
  readonly loadingService = inject(LoadingService);

  readonly literals = LITERALS.coinDetail;
  readonly sharedLiterals = LITERALS.shared;

  readonly coin = signal<EuroCoin | null>(null);
  readonly numista = signal<NumistaCoin | null>(null);
  readonly numistaError = signal(false);

  readonly coinTitle = computed(() => {
    const title = this.numista()?.title ?? '';
    const parenIdx = title.indexOf('(');
    return parenIdx > -1 ? title.slice(0, parenIdx).trim() : title;
  });

  readonly coinSubtitle = computed(() => {
    const title = this.numista()?.title ?? '';
    const parenIdx = title.indexOf('(');
    return parenIdx > -1 ? title.slice(parenIdx + 1, -1).trim() : '';
  });

  readonly techniqueText = computed(() => {
    const raw = this.numista()?.technique?.text ?? '';
    const match = raw.match(/>([^<]+)</);
    return match ? match[1] : raw;
  });

  readonly references = computed(() => {
    return (this.numista()?.references ?? [])
      .map(r => `${r.catalogue.code} ${r.number}`)
      .join(' · ');
  });

  readonly backLink = computed(() => {
    const country = this.route.snapshot.paramMap.get('country') ?? '';
    const year = this.route.snapshot.paramMap.get('year') ?? '';
    return ['/euros', country, year];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    const country = this.route.snapshot.paramMap.get('country')!;
    const year = this.route.snapshot.paramMap.get('year')!;

    // Ocupamos el contador antes de empezar para que el spinner
    // no se apague entre la llamada a Supabase y la de Numista
    this.loadingService.showLoading();

    this.eurosService.getById(id).subscribe(coin => {
      if (!coin) {
        this.loadingService.hideLoading();
        this.router.navigate(['/euros', country, year]);
        return;
      }
      this.coin.set(coin);

      if (coin.idNum) {
        this.numistaService.getCoinByIdNum(coin.idNum).subscribe({
          next: (data) => {
            this.numista.set(data);
            this.loadingService.hideLoading();
          },
          error: () => {
            this.numistaError.set(true);
            this.loadingService.hideLoading();
          },
        });
      } else {
        this.loadingService.hideLoading();
      }
    });
  }

  goBack(): void {
    const country = this.route.snapshot.paramMap.get('country')!;
    const year = this.route.snapshot.paramMap.get('year')!;
    this.router.navigate(['/euros', country, year]);
  }
}
