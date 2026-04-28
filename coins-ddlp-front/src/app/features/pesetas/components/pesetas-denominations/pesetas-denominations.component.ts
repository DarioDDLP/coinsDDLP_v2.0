import { Component, computed, ErrorHandler, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CollectionLayoutComponent } from '../../../../shared/components/collection-layout/collection-layout.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { PesetasService } from '../../services/pesetas.service';
import { Peseta } from '../../../../shared/interfaces/peseta.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';
import { restoreSearchQuery, saveSearchQuery } from '../../../../shared/helpers/search-state.helper';

interface DenominationCard {
  faceValueLabel: string;
  faceValueESP: number;
  total: number;
  owned: number;
  minYear: number;
  maxYear: number;
}

@Component({
  selector: 'app-pesetas-denominations',
  imports: [RouterLink, CollectionLayoutComponent, EmptyPanelComponent],
  templateUrl: './pesetas-denominations.component.html',
  styleUrl: './pesetas-denominations.component.scss',
})
export class PesetasDenominationsComponent implements OnInit {
  private service      = inject(PesetasService);
  private errorHandler = inject(ErrorHandler);

  readonly literals       = LITERALS.pesetas;
  readonly sharedLiterals = LITERALS.shared;

  private allPesetas  = signal<Peseta[]>([]);
  readonly searchQuery = signal('');
  readonly isReady     = signal(false);
  readonly hasError    = signal(false);

  ngOnInit(): void {
    this.searchQuery.set(restoreSearchQuery('pesetas-denominations'));
    this.service.getAll().subscribe({
      next: pesetas => { this.allPesetas.set(pesetas); this.isReady.set(true); },
      error: (e)    => { this.errorHandler.handleError(e); this.hasError.set(true); this.isReady.set(true); },
    });
  }

  readonly denominationCards = computed<DenominationCard[]>(() => {
    const query = normalizeString(this.searchQuery());
    const map = new Map<string, DenominationCard>();

    for (const p of this.allPesetas()) {
      const key = p.peseta_type.faceValueLabel;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          faceValueLabel: key,
          faceValueESP: p.peseta_type.faceValueESP ?? 0,
          total: 1,
          owned: p.uds > 0 ? 1 : 0,
          minYear: p.mintYear,
          maxYear: p.mintYear,
        });
      } else {
        existing.total++;
        if (p.uds > 0) existing.owned++;
        existing.minYear = Math.min(existing.minYear, p.mintYear);
        existing.maxYear = Math.max(existing.maxYear, p.mintYear);
      }
    }

    return [...map.values()]
      .sort((a, b) => a.faceValueESP - b.faceValueESP)
      .filter(d => !query || normalizeString(d.faceValueLabel).includes(query));
  });

  readonly isEmpty = computed(() => this.denominationCards().length === 0);

  readonly totals = computed(() => {
    const cards = this.denominationCards();
    return {
      owned: cards.reduce((acc, c) => acc + c.owned, 0),
      total: cards.reduce((acc, c) => acc + c.total, 0),
      minYear: Math.min(...cards.map(c => c.minYear)),
      maxYear: Math.max(...cards.map(c => c.maxYear)),
    };
  });

  onSearch(query: string): void {
    this.searchQuery.set(query);
    saveSearchQuery('pesetas-denominations', query);
  }
}
