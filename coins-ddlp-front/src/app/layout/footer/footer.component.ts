import { Component } from '@angular/core';
import { injectLiterals } from '../../shared/services/i18n.service';
import { APP_VERSION } from '../../shared/constants/app-version.const';
import { DdlpLogoComponent } from '../../shared/components/ddlp-logo/ddlp-logo.component';

/** Pie de todas las páginas: firma del autor con su monograma, © del año en curso y versión. */
@Component({
  selector: 'app-footer',
  imports: [DdlpLogoComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly literals = injectLiterals('footer');
  readonly year = new Date().getFullYear();
  readonly version = APP_VERSION;
}
