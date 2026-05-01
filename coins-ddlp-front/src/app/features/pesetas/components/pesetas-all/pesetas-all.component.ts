import { Component, computed, ErrorHandler, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CollectionLayoutComponent } from '../../../../shared/components/collection-layout/collection-layout.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { PesetasService } from '../../services/pesetas.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Peseta } from '../../../../shared/interfaces/peseta.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';
import { restoreSearchQuery, saveSearchQuery } from '../../../../shared/helpers/search-state.helper';
import { getConservationBadge, getUdsBadge } from '../../../../shared/helpers/badge.helpers';
import { PesetaEditDialogComponent } from '../peseta-edit-dialog/peseta-edit-dialog.component';

interface PesetaRow {
  peseta: Peseta;
  conservationBadge: ReturnType<typeof getConservationBadge>;
  udsBadge: ReturnType<typeof getUdsBadge>;
}

interface DenominationGroup {
  faceValueLabel: string;
  rows: PesetaRow[];
}

@Component({
  selector: 'app-pesetas-all',
  imports: [TableModule, CollectionLayoutComponent, BadgeComponent, ButtonComponent, EmptyPanelComponent, PesetaEditDialogComponent],
  templateUrl: './pesetas-all.component.html',
  styleUrl: './pesetas-all.component.scss',
})
export class PesetasAllComponent implements OnInit {
  private service      = inject(PesetasService);
  private router       = inject(Router);
  private errorHandler = inject(ErrorHandler);
  readonly authService = inject(AuthService);

  readonly literals       = LITERALS.pesetas;
  readonly sharedLiterals = LITERALS.shared;

  private allPesetas  = signal<Peseta[]>([]);
  readonly searchQuery = signal('');
  readonly isReady     = signal(false);
  readonly hasError    = signal(false);

  readonly dialogVisible  = signal(false);
  readonly selectedPeseta = signal<Peseta | null>(null);

  readonly backLink = ['/pesetas'];

  ngOnInit(): void {
    this.searchQuery.set(restoreSearchQuery('pesetas-all'));
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
      normalizeString(p.peseta_type.title).includes(query) ||
      normalizeString(p.label).includes(query) ||
      p.mintYear.toString().includes(query)
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
      .map(([faceValueLabel, { pesetas }]) => ({
        faceValueLabel,
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
    saveSearchQuery('pesetas-all', query);
  }

  onCoinClick(peseta: Peseta): void {
    this.router.navigate(['/pesetas', peseta.peseta_type.faceValueLabel, peseta.id], { queryParams: { from: 'all' } });
  }

  onEdit(peseta: Peseta): void {
    this.selectedPeseta.set(peseta);
    this.dialogVisible.set(true);
  }

  onDialogSaved(): void {
    this.loadPesetas();
  }

  onDialogClosed(): void {
    this.dialogVisible.set(false);
    this.selectedPeseta.set(null);
  }
}
