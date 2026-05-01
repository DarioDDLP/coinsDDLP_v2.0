import { DecimalPipe } from '@angular/common';
import { Component, computed, ErrorHandler, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PesetasService } from '../../services/pesetas.service';
import { Peseta } from '../../../../shared/interfaces/peseta.interface';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { CollectionLayoutComponent } from '../../../../shared/components/collection-layout/collection-layout.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { getConservationBadge, getUdsBadge } from '../../../../shared/helpers/badge.helpers';
import { LITERALS } from '../../../../shared/constants/literals';

@Component({
  selector: 'app-peseta-detail',
  imports: [BadgeComponent, CollectionLayoutComponent, EmptyPanelComponent, DecimalPipe],
  templateUrl: './peseta-detail.component.html',
  styleUrl: './peseta-detail.component.scss',
})
export class PesetaDetailComponent implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private service      = inject(PesetasService);
  private errorHandler = inject(ErrorHandler);

  readonly literals       = LITERALS.pesetaDetail;
  readonly sharedLiterals = LITERALS.shared;

  readonly peseta   = signal<Peseta | null>(null);
  readonly isReady  = signal(false);
  readonly hasError = signal(false);

  readonly conservationBadge = computed(() => getConservationBadge(this.peseta()?.conservation ?? undefined));
  readonly udsBadge          = computed(() => getUdsBadge(this.peseta()?.uds ?? 0));

  readonly backLink = computed(() => {
    const faceValue = this.route.snapshot.paramMap.get('faceValue') ?? '';
    const from      = this.route.snapshot.queryParamMap.get('from');
    return from === 'all' ? ['/pesetas', 'all'] : ['/pesetas', faceValue];
  });

  readonly numistaUrl = computed(() => {
    const idNum = this.peseta()?.peseta_type?.idNum;
    return idNum ? `https://en.numista.com/catalogue/pieces${idNum}.html` : null;
  });

  ngOnInit(): void {
    const id        = this.route.snapshot.paramMap.get('id')!;
    const faceValue = this.route.snapshot.paramMap.get('faceValue')!;

    this.service.getById(id).subscribe({
      next: peseta => {
        if (!peseta) { this.router.navigate(['/pesetas', faceValue]); return; }
        this.peseta.set(peseta);
        this.isReady.set(true);
      },
      error: (e) => { this.errorHandler.handleError(e); this.hasError.set(true); this.isReady.set(true); },
    });
  }
}
