import { Component, computed, ErrorHandler, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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

@Component({
  selector: 'app-pesetas-list',
  imports: [TableModule, CollectionLayoutComponent, BadgeComponent, ButtonComponent, EmptyPanelComponent, PesetaEditDialogComponent],
  templateUrl: './pesetas-list.component.html',
  styleUrl: './pesetas-list.component.scss',
})
export class PesetasListComponent implements OnInit {
  private service      = inject(PesetasService);
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private errorHandler = inject(ErrorHandler);
  readonly authService = inject(AuthService);

  readonly literals       = LITERALS.pesetas;
  readonly sharedLiterals = LITERALS.shared;

  readonly faceValue   = signal('');
  private allPesetas   = signal<Peseta[]>([]);
  readonly searchQuery  = signal('');
  readonly isReady      = signal(false);
  readonly hasError     = signal(false);

  readonly dialogVisible  = signal(false);
  readonly selectedPeseta = signal<Peseta | null>(null);

  readonly backLink = ['/pesetas'];

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const faceValue = params['faceValue'] ?? '';
      this.faceValue.set(faceValue);
      this.searchQuery.set(restoreSearchQuery(`pesetas-${faceValue}`));
      this.loadPesetas();
    });
  }

  loadPesetas(): void {
    this.hasError.set(false);
    this.isReady.set(false);
    this.service.getAll().subscribe({
      next: pesetas => {
        const fv = this.faceValue();
        this.allPesetas.set(
          [...pesetas.filter(p => p.peseta_type.faceValueLabel === fv)]
            .sort((a, b) => a.mintYear - b.mintYear)
        );
        this.isReady.set(true);
      },
      error: (e) => { this.errorHandler.handleError(e); this.hasError.set(true); this.isReady.set(true); },
    });
  }

  readonly rows = computed<PesetaRow[]>(() => {
    const query = normalizeString(this.searchQuery());
    return this.allPesetas()
      .filter(p =>
        !query ||
        normalizeString(p.peseta_type.title).includes(query) ||
        normalizeString(p.label).includes(query) ||
        p.mintYear.toString().includes(query)
      )
      .map(peseta => ({
        peseta,
        conservationBadge: getConservationBadge(peseta.conservation),
        udsBadge: getUdsBadge(peseta.uds),
      }));
  });

  readonly isEmpty = computed(() => this.rows().length === 0);

  onSearch(query: string): void {
    this.searchQuery.set(query);
    saveSearchQuery(`pesetas-${this.faceValue()}`, query);
  }

  onCoinClick(peseta: Peseta): void {
    this.router.navigate(['/pesetas', this.faceValue(), peseta.id]);
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
