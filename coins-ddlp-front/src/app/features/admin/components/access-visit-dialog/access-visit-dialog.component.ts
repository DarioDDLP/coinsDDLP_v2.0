import {
  Component,
  computed,
  effect,
  ErrorHandler,
  inject,
  input,
  model,
  signal,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { DialogComponent } from '../../../../shared/components/dialog/dialog.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SkeletonComponent } from '../../../../shared/components/skeleton/skeleton.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { AccessEvent, AccessVisit } from '../../../../shared/interfaces/access-log.interface';
import { I18nService, injectLiterals } from '../../../../shared/services/i18n.service';
import {
  formatDuration,
  formatLocation,
  getEventIcon,
} from '../../../../shared/helpers/access-log.helper';
import { AccessLogAdminService } from '../../services/access-log-admin.service';

interface DetailField {
  label: string;
  value: string;
  /** Texto largo en monoespaciada (user-agent, rutas). */
  mono?: boolean;
}

/** Detalle de una visita del registro de accesos: todos sus datos y la línea de tiempo. */
@Component({
  selector: 'app-access-visit-dialog',
  imports: [DialogComponent, ButtonComponent, SkeletonComponent, BadgeComponent, DatePipe],
  templateUrl: './access-visit-dialog.component.html',
  styleUrl: './access-visit-dialog.component.scss',
})
export class AccessVisitDialogComponent {
  private service = inject(AccessLogAdminService);
  private errorHandler = inject(ErrorHandler);
  readonly lang = inject(I18nService).lang;

  readonly visible = model(false);
  readonly visit = input<AccessVisit | null>(null);

  readonly literals = injectLiterals('admin');
  readonly sharedLiterals = injectLiterals('shared');
  readonly t = computed(() => this.literals().accessLog);

  readonly events = signal<AccessEvent[]>([]);
  readonly eventsReady = signal(false);
  private loadSub?: Subscription;

  readonly fields = computed<DetailField[]>(() => {
    const v = this.visit();
    if (!v) return [];
    const t = this.t();
    const dash = '—';
    return [
      { label: t.colUser, value: v.userName ?? t.anonymous },
      { label: t.colIp, value: v.ip ?? dash, mono: true },
      { label: t.colLocation, value: formatLocation(v) ?? t.unknown },
      { label: t.colDevice, value: v.deviceType ? t.devices[v.deviceType] : dash },
      {
        label: t.fieldBrowser,
        value: [v.browser, v.browserVersion].filter(Boolean).join(' ') || dash,
      },
      { label: t.fieldOs, value: v.os ?? dash },
      { label: t.fieldScreen, value: v.screen ?? dash },
      { label: t.fieldLanguage, value: v.language ?? dash },
      { label: t.fieldAppLang, value: v.appLang?.toUpperCase() ?? dash },
      { label: t.colDuration, value: formatDuration(v.durationSeconds) },
      { label: t.fieldLanding, value: v.landingPath ?? dash, mono: true },
      { label: t.fieldReferrer, value: v.referrer || t.direct, mono: !!v.referrer },
      { label: t.fieldVersion, value: v.appVersion ?? dash },
      { label: t.fieldUserAgent, value: v.userAgent ?? dash, mono: true },
    ];
  });

  readonly timeline = computed(() =>
    this.events().map((e) => ({
      ...e,
      icon: getEventIcon(e.type),
      label: this.t().events[e.type],
      failed: e.type === 'login_failed',
    })),
  );

  constructor() {
    // Al abrir: se piden los eventos de la visita
    effect(() => {
      if (!this.visible()) return;
      const visit = this.visit();
      if (!visit) return;
      untracked(() => this.loadEvents(visit.id));
    });
  }

  private loadEvents(visitId: string): void {
    this.loadSub?.unsubscribe();
    this.eventsReady.set(false);
    this.loadSub = this.service.getEvents(visitId).subscribe({
      next: (events) => {
        this.events.set(events);
        this.eventsReady.set(true);
      },
      error: (e) => {
        this.errorHandler.handleError(e);
        this.eventsReady.set(true);
      },
    });
  }

  protected onHidden(): void {
    this.loadSub?.unsubscribe();
    this.events.set([]);
    this.eventsReady.set(false);
  }
}
