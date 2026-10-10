import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TranslocoTestingModule } from '@jsverse/transloco';
import es from '../../../../../../public/i18n/es.json';
import { AdminAccessLogComponent } from './admin-access-log.component';
import { AccessLogAdminService } from '../../services/access-log-admin.service';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AccessVisit } from '../../../../shared/interfaces/access-log.interface';

const visit: AccessVisit = {
  id: 'v1',
  startedAt: '2026-10-10T10:00:00Z',
  lastSeenAt: '2026-10-10T10:03:20Z',
  userId: null,
  userName: null,
  ip: '203.0.113.7',
  country: 'Spain',
  countryCode: 'ES',
  region: 'Madrid',
  city: 'Madrid',
  userAgent: 'Mozilla/5.0',
  browser: 'Firefox',
  browserVersion: '140',
  os: 'macOS',
  deviceType: 'desktop',
  screen: '1920×1080',
  language: 'es-ES',
  appLang: 'es',
  referrer: null,
  landingPath: '/euros',
  appVersion: '3.4.0',
  pageCount: 4,
  durationSeconds: 200,
};

describe('AdminAccessLogComponent', () => {
  const service = {
    getPage: vi.fn(() => of({ rows: [visit], total: 1 })),
    getStats: vi.fn(() => of({ visits: 1, visitors: 1, users: 0, logins: 0, failedLogins: 0 })),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [
        AdminAccessLogComponent,
        TranslocoTestingModule.forRoot({
          langs: { es },
          translocoConfig: { availableLangs: ['es', 'en'], defaultLang: 'es' },
          preloadLangs: true,
        }),
      ],
      providers: [
        MessageService,
        { provide: AccessLogAdminService, useValue: service },
        { provide: AdminService, useValue: { getUsers: () => of([]) } },
        { provide: AuthService, useValue: { currentUser: signal({ uid: 'me' }) } },
      ],
    }).compileComponents();
  });

  it('pide la primera página ocultando las visitas propias y pinta la fila', async () => {
    const fixture = TestBed.createComponent(AdminAccessLogComponent);
    await fixture.whenStable();

    expect(service.getPage).toHaveBeenCalledWith(
      expect.objectContaining({ excludeUserId: 'me', user: null, search: '' }),
      0,
      50,
    );
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Madrid, Spain');
    expect(text).toContain('3 min 20 s');
    expect(text).toContain(es.admin.accessLog.anonymous);
  });
});
