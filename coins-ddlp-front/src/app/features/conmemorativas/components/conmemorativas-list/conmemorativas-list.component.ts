import { Component, computed, effect, ErrorHandler, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CollectionLayoutComponent } from '../../../../shared/components/collection-layout/collection-layout.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { ConmemorativasService } from '../../services/conmemorativas.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EuroCoin } from '../../../../shared/interfaces/euro-coin.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';
import {
  restoreSearchQuery,
  saveSearchQuery,
} from '../../../../shared/helpers/search-state.helper';
import { getConservationBadge, getUdsBadge } from '../../../../shared/helpers/badge.helpers';
import { ExcelExportService } from '../../../../shared/services/excel-export.service';
import {
  ALBUM_POSITIONS_PER_ROW,
  ALBUM_POSITIONS_PER_PAGE,
  ALBUM_POSITIONS_PER_ALBUM,
} from '../../conmemorativas.config';
import { FilterPillsComponent } from '../../../../shared/components/filter-pills/filter-pills.component';
import { OWNERSHIP_FILTER_OPTIONS } from '../../../../shared/constants/ownership-filter.config';
import { OWNER_FILTER_OPTIONS } from '../../../../shared/constants/owner-filter.config';
import { OwnerService } from '../../../../core/services/owner.service';
import { OwnerSlug } from '../../../../shared/interfaces/owner.interface';

interface AlbumLocation {
  album: number;
  page: number;
  position: string;
}

interface CoinRow {
  coin: EuroCoin;
  conservationBadge: ReturnType<typeof getConservationBadge>;
  udsBadge: ReturnType<typeof getUdsBadge>;
  conservationBadgeAlt: ReturnType<typeof getConservationBadge>;
  udsBadgeAlt: ReturnType<typeof getUdsBadge> | null;
  location: AlbumLocation;
}

function computeLocation(index: number): AlbumLocation {
  const album = Math.floor(index / ALBUM_POSITIONS_PER_ALBUM) + 1;
  const withinAlbum = index % ALBUM_POSITIONS_PER_ALBUM;
  const page = Math.floor(withinAlbum / ALBUM_POSITIONS_PER_PAGE) + 1;
  const withinPage = withinAlbum % ALBUM_POSITIONS_PER_PAGE;
  const row = Math.floor(withinPage / ALBUM_POSITIONS_PER_ROW) + 1;
  const col = (withinPage % ALBUM_POSITIONS_PER_ROW) + 1;
  return { album, page, position: `${row}.${col}` };
}

interface YearGroup {
  year: number;
  rows: CoinRow[];
}

@Component({
  selector: 'app-conmemorativas-list',
  imports: [
    TableModule,
    CollectionLayoutComponent,
    BadgeComponent,
    EmptyPanelComponent,
    ButtonComponent,
    FilterPillsComponent,
  ],
  templateUrl: './conmemorativas-list.component.html',
  styleUrl: './conmemorativas-list.component.scss',
})
export class ConmemorativasListComponent {
  private service = inject(ConmemorativasService);
  private excelExport = inject(ExcelExportService);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandler);
  private authService = inject(AuthService);
  readonly ownerService = inject(OwnerService);

  readonly isAdmin = this.authService.isAdmin;

  readonly literals = LITERALS.conmemorativas;
  readonly sharedLiterals = LITERALS.shared;

  private allCoins = signal<EuroCoin[]>([]);
  readonly searchQuery = signal(restoreSearchQuery('conmemorativas'));
  readonly ownershipFilter = signal('all');
  readonly filterOptions = OWNERSHIP_FILTER_OPTIONS;
  readonly ownerOptions = OWNER_FILTER_OPTIONS;
  readonly isReady = signal(false);
  readonly hasError = signal(false);

  constructor() {
    this.setupReloadEffect();
  }

  private setupReloadEffect(): void {
    effect(() => {
      this.ownerService.current();
      this.loadCoins();
    });
  }

  loadCoins(): void {
    this.hasError.set(false);
    this.isReady.set(false);
    this.service.getAll().subscribe({
      next: (coins) => {
        this.allCoins.set(coins);
        this.isReady.set(true);
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        this.hasError.set(true);
        this.isReady.set(true);
      },
    });
  }

  readonly groupedCoins = computed<YearGroup[]>(() => {
    const ownership = this.ownershipFilter();
    const both = this.isBoth();
    let base = this.allCoins();
    if (ownership === 'owned') {
      base = both
        ? base.filter((c) => c.uds > 0 && (c.udsAlt ?? 0) > 0)
        : base.filter((c) => c.uds > 0);
    } else if (ownership === 'missing') {
      base = both
        ? base.filter((c) => c.uds === 0 && (c.udsAlt ?? 0) === 0)
        : base.filter((c) => c.uds === 0);
    }

    const query = normalizeString(this.searchQuery());
    const filtered = base.filter(
      (c) =>
        !query ||
        String(c.year).includes(query) ||
        normalizeString(c.country).includes(query) ||
        normalizeString(c.description).includes(query),
    );

    const byYear = new Map<number, EuroCoin[]>();
    for (const coin of filtered) {
      const group = byYear.get(coin.year) ?? [];
      group.push(coin);
      byYear.set(coin.year, group);
    }

    let globalIndex = 0;

    return [...byYear.entries()]
      .sort(([a], [b]) => a - b)
      .map(([year, coins]) => ({
        year,
        rows: [...coins]
          .sort((a, b) => {
            const country = a.country.localeCompare(b.country);
            if (country !== 0) return country;
            const mint = (a.mint ?? '').localeCompare(b.mint ?? '');
            if (mint !== 0) return mint;
            return a.description.localeCompare(b.description);
          })
          .map((coin) => ({
            coin,
            conservationBadge: getConservationBadge(coin.conservation),
            udsBadge: getUdsBadge(coin.uds),
            conservationBadgeAlt: coin.conservationAlt
              ? getConservationBadge(coin.conservationAlt)
              : null,
            udsBadgeAlt: coin.udsAlt !== undefined ? getUdsBadge(coin.udsAlt) : null,
            location: computeLocation(globalIndex++),
          })),
      }));
  });

  readonly isBoth = computed(() => this.ownerService.current() === 'both');
  readonly isEmpty = computed(() => this.groupedCoins().length === 0);

  onSearch(query: string): void {
    this.searchQuery.set(query);
    saveSearchQuery('conmemorativas', query);
  }

  onOwnerChange(slug: string): void {
    this.ownerService.setOwner(slug as OwnerSlug);
  }

  onCoinClick(coin: EuroCoin): void {
    this.router.navigate(['/euros', coin.country, coin.year, coin.id], {
      queryParams: { from: 'conmemorativas' },
    });
  }

  async exportExcel(): Promise<void> {
    await this.excelExport.exportConmemorativas(this.groupedCoins(), this.isAdmin(), this.isBoth());
  }
}
