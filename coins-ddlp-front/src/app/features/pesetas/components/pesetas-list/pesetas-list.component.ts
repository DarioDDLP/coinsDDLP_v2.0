import { Component, computed, ErrorHandler, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CollectionLayoutComponent } from '../../../../shared/components/collection-layout/collection-layout.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { PesetasService } from '../../services/pesetas.service';
import { Peseta } from '../../../../shared/interfaces/peseta.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';
import { restoreSearchQuery, saveSearchQuery } from '../../../../shared/helpers/search-state.helper';
import { getConservationBadge, getUdsBadge } from '../../../../shared/helpers/badge.helpers';

interface PesetaRow {
  peseta: Peseta;
  conservationBadge: ReturnType<typeof getConservationBadge>;
  udsBadge: ReturnType<typeof getUdsBadge>;
}

interface DenominationGroup {
  faceValueLabel: string;
  faceValueESP: number;
  rows: PesetaRow[];
}

@Component({
  selector: 'app-pesetas-list',
  imports: [TableModule, CollectionLayoutComponent, BadgeComponent, EmptyPanelComponent, DecimalPipe],
  templateUrl: './pesetas-list.component.html',
  styleUrl: './pesetas-list.component.scss',
})
export class PesetasListComponent implements OnInit {
  private service      = inject(PesetasService);
  private errorHandler = inject(ErrorHandler);

  readonly literals       = LITERALS.pesetas;
  readonly sharedLiterals = LITERALS.shared;

  private allPesetas   = signal<Peseta[]>([]);
  readonly searchQuery  = signal('');
  readonly isReady      = signal(false);
  readonly hasError     = signal(false);

  ngOnInit(): void {
    this.searchQuery.set(restoreSearchQuery('pesetas'));
    this.loadPesetas();
  }

  loadPesetas(): void {
    this.hasError.set(false);
    this.isReady.set(false);
    this.service.getAll().subscribe({
      next: pesetas => { this.allPesetas.set(pesetas); this.isReady.set(true); },
      error: (e)    => { this.errorHandler.handleError(e); this.hasError.set(true); this.isReady.set(true); },
    });
  }

  readonly groupedPesetas = computed<DenominationGroup[]>(() => {
    const query = normalizeString(this.searchQuery());
    const filtered = this.allPesetas().filter(p =>
      !query ||
      normalizeString(p.peseta_type.faceValueLabel).includes(query) ||
      normalizeString(p.peseta_type.title).includes(query)
    );

    const byDenomination = new Map<string, { faceValueESP: number; pesetas: Peseta[] }>();
    for (const p of filtered) {
      const key = p.peseta_type.faceValueLabel;
      const entry = byDenomination.get(key) ?? { faceValueESP: p.peseta_type.faceValueESP ?? 0, pesetas: [] };
      entry.pesetas.push(p);
      byDenomination.set(key, entry);
    }

    return [...byDenomination.entries()]
      .sort(([, a], [, b]) => a.faceValueESP - b.faceValueESP)
      .map(([faceValueLabel, { faceValueESP, pesetas }]) => ({
        faceValueLabel,
        faceValueESP,
        rows: [...pesetas]
          .sort((a, b) => a.mintYear - b.mintYear)
          .map(peseta => ({
            peseta,
            conservationBadge: getConservationBadge(peseta.conservation),
            udsBadge: getUdsBadge(peseta.uds),
          })),
      }));
  });

  readonly isEmpty = computed(() => this.groupedPesetas().length === 0);

  onSearch(query: string): void {
    this.searchQuery.set(query);
    saveSearchQuery('pesetas', query);
  }
}
