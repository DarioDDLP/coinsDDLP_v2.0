import { Component, computed, ErrorHandler, inject, OnInit, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { PageLayoutComponent } from '../../../../shared/components/page-layout/page-layout.component';
import { CountryFlagComponent } from '../../../../shared/components/country-flag/country-flag.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyPanelComponent } from '../../../../shared/components/empty-panel/empty-panel.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { UbicacionEditDialogComponent } from '../ubicacion-edit-dialog/ubicacion-edit-dialog.component';
import { UbicacionService } from '../../services/ubicacion.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
  AlbumGroup,
  CountryLocation,
} from '../../../../shared/interfaces/country-location.interface';
import { LITERALS } from '../../../../shared/constants/literals';
import { TOAST_MESSAGES } from '../../../../shared/constants/toast-messages.const';
import { normalizeString } from '../../../../shared/helpers/normalize-strings.helper';

@Component({
  selector: 'app-ubicacion-map',
  imports: [
    PageLayoutComponent,
    CountryFlagComponent,
    BadgeComponent,
    LoadingSpinnerComponent,
    EmptyPanelComponent,
    ConfirmDialogComponent,
    ButtonComponent,
    UbicacionEditDialogComponent,
  ],
  templateUrl: './ubicacion-map.component.html',
  styleUrl: './ubicacion-map.component.scss',
})
export class UbicacionMapComponent implements OnInit {
  private service = inject(UbicacionService);
  private authService = inject(AuthService);
  private errorHandler = inject(ErrorHandler);
  private messageService = inject(MessageService);

  readonly literals = LITERALS.ubicacion;
  readonly sharedLiterals = LITERALS.shared;

  private allLocations = signal<CountryLocation[]>([]);
  readonly searchQuery = signal('');
  readonly isReady = signal(false);
  readonly hasError = signal(false);
  readonly isDeleting = signal(false);
  readonly showConfirmDelete = signal(false);
  readonly showEditDialog = signal(false);

  private locationToDelete = signal<CountryLocation | null>(null);
  readonly selectedLocation = signal<CountryLocation | null>(null);

  readonly canEdit = computed(() => this.authService.isAdmin());

  private readonly filteredLocations = computed<CountryLocation[]>(() => {
    const query = normalizeString(this.searchQuery());
    if (!query) return this.allLocations();
    return this.allLocations().filter((loc) => normalizeString(loc.country).includes(query));
  });

  readonly albumGroups = computed<AlbumGroup[]>(() => {
    const map = new Map<number, CountryLocation[]>();
    for (const loc of this.filteredLocations()) {
      const existing = map.get(loc.album) ?? [];
      map.set(loc.album, [...existing, loc]);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a - b)
      .map(([album, locations]) => ({ album, locations }));
  });

  ngOnInit(): void {
    this.loadLocations();
  }

  protected yearRange(loc: CountryLocation): string {
    return loc.yearTo ? `${loc.yearFrom} → ${loc.yearTo}` : `${loc.yearFrom} →`;
  }

  protected onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  protected onAddCountry(): void {
    this.selectedLocation.set(null);
    this.showEditDialog.set(true);
  }

  protected onEdit(loc: CountryLocation): void {
    this.selectedLocation.set(loc);
    this.showEditDialog.set(true);
  }

  protected onDelete(loc: CountryLocation): void {
    this.locationToDelete.set(loc);
    this.showConfirmDelete.set(true);
  }

  protected async onConfirmDelete(): Promise<void> {
    const loc = this.locationToDelete();
    if (!loc) return;
    this.isDeleting.set(true);
    try {
      await this.service.remove(loc.id);
      this.allLocations.update((list) => list.filter((l) => l.id !== loc.id));
      this.messageService.add({ ...TOAST_MESSAGES.ubicacion.deleteSuccess, life: 3000 });
    } catch (e) {
      this.errorHandler.handleError(e);
      this.messageService.add({ ...TOAST_MESSAGES.ubicacion.deleteError, life: 3000 });
    } finally {
      this.isDeleting.set(false);
      this.showConfirmDelete.set(false);
      this.locationToDelete.set(null);
    }
  }

  protected onCloseConfirmDelete(): void {
    this.showConfirmDelete.set(false);
    this.locationToDelete.set(null);
  }

  protected onDialogSaved(): void {
    this.showEditDialog.set(false);
    this.selectedLocation.set(null);
    this.loadLocations();
  }

  protected onDialogClosed(): void {
    this.showEditDialog.set(false);
    this.selectedLocation.set(null);
  }

  private loadLocations(): void {
    this.service.getAll().subscribe({
      next: (locations) => {
        this.allLocations.set(locations);
        this.isReady.set(true);
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        this.hasError.set(true);
        this.isReady.set(true);
      },
    });
  }
}
