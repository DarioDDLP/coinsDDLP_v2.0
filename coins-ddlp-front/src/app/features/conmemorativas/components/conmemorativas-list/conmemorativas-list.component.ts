import { Component, computed, ErrorHandler, inject, OnInit, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { CollectionLayoutComponent } from '../../../../shared/components/collection-layout/collection-layout.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { ConmemorativasService } from '../../services/conmemorativas.service';
import { EuroCoin } from '../../../../shared/interfaces/euro-coin.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';
import { getConservationBadge, getUdsBadge } from '../../../../shared/helpers/badge.helpers';
import {
  ALBUM_POSITIONS_PER_ROW,
  ALBUM_POSITIONS_PER_PAGE,
  ALBUM_POSITIONS_PER_ALBUM,
} from '../../conmemorativas.config';

interface AlbumLocation {
  album: number;
  page: number;
  position: string;
}

interface CoinRow {
  coin: EuroCoin;
  conservationBadge: ReturnType<typeof getConservationBadge>;
  udsBadge: ReturnType<typeof getUdsBadge>;
  location: AlbumLocation;
}

function computeLocation(index: number): AlbumLocation {
  const album      = Math.floor(index / ALBUM_POSITIONS_PER_ALBUM) + 1;
  const withinAlbum = index % ALBUM_POSITIONS_PER_ALBUM;
  const page       = Math.floor(withinAlbum / ALBUM_POSITIONS_PER_PAGE) + 1;
  const withinPage  = withinAlbum % ALBUM_POSITIONS_PER_PAGE;
  const row        = Math.floor(withinPage / ALBUM_POSITIONS_PER_ROW) + 1;
  const col        = (withinPage % ALBUM_POSITIONS_PER_ROW) + 1;
  return { album, page, position: `${row}.${col}` };
}

interface YearGroup {
  year: number;
  rows: CoinRow[];
}

@Component({
  selector: 'app-conmemorativas-list',
  imports: [TableModule, CollectionLayoutComponent, BadgeComponent, EmptyPanelComponent],
  templateUrl: './conmemorativas-list.component.html',
  styleUrl: './conmemorativas-list.component.scss',
})
export class ConmemorativasListComponent implements OnInit {
  private service      = inject(ConmemorativasService);
  private errorHandler = inject(ErrorHandler);

  readonly literals       = LITERALS.conmemorativas;
  readonly sharedLiterals = LITERALS.shared;

  private allCoins    = signal<EuroCoin[]>([]);
  readonly searchQuery = signal('');
  readonly isReady     = signal(false);
  readonly hasError    = signal(false);

  ngOnInit(): void {
    this.loadCoins();
  }

  loadCoins(): void {
    this.hasError.set(false);
    this.isReady.set(false);
    this.service.getAll().subscribe({
      next: coins => { this.allCoins.set(coins); this.isReady.set(true); },
      error: (e)  => { this.errorHandler.handleError(e); this.hasError.set(true); this.isReady.set(true); },
    });
  }

  readonly groupedCoins = computed<YearGroup[]>(() => {
    const query = normalizeString(this.searchQuery());
    const filtered = this.allCoins().filter(c =>
      !query ||
      normalizeString(c.country).includes(query) ||
      normalizeString(c.description).includes(query)
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
          .map(coin => ({
            coin,
            conservationBadge: getConservationBadge(coin.conservation),
            udsBadge: getUdsBadge(coin.uds),
            location: computeLocation(globalIndex++),
          })),
      }));
  });

  readonly isEmpty = computed(() => this.groupedCoins().length === 0);

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }
}
