import { Component, computed, input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { StatGroup } from '../../../../shared/interfaces/euro-stats.interface';
import { ComparedNames } from '../../../../shared/interfaces/owned-count.interface';
import { injectLiterals } from '../../../../shared/services/i18n.service';

interface YearColumn {
  key: string;
  label: string;
  /** Alto de la columna del catálogo respecto al año con más monedas (%). */
  totalHeight: number;
  /** Parte obtenida dentro de su columna (%); al comparar, la conjunta (marca horizontal). */
  ownedHeight: number;
  /** Solo al comparar: parte de cada colección dentro de su columna (%). */
  primaryHeight: number;
  compareHeight: number;
  description: string;
}

/**
 * Columnas por año: catálogo en gris y lo obtenido en oro. Al comparar dos
 * colecciones, dos barras (oro la principal, azul la comparada) y una marca con
 * lo que tienen entre las dos.
 */
@Component({
  selector: 'app-year-chart',
  imports: [TooltipModule],
  templateUrl: './year-chart.component.html',
  styleUrl: './year-chart.component.scss',
})
export class YearChartComponent {
  readonly groups = input.required<StatGroup[]>();
  /** Nombres de las colecciones comparadas (`null` si no se compara). */
  readonly names = input<ComparedNames>(null);

  readonly literals = injectLiterals('estadisticas');

  readonly columns = computed<YearColumn[]>(() => {
    const groups = this.groups();
    const names = this.names();
    const max = Math.max(1, ...groups.map((g) => g.total));
    const pct = (value: number, total: number) => (total > 0 ? (value / total) * 100 : 0);
    return groups.map((g) => {
      const parts = [`${g.label}: ${g.owned} / ${g.total}`];
      if (names)
        parts.push(`${names.primary} ${g.ownedPrimary}`, `${names.compare} ${g.ownedCompare}`);
      return {
        key: g.key,
        label: g.label,
        totalHeight: (g.total / max) * 100,
        ownedHeight: pct(g.owned, g.total),
        primaryHeight: pct(g.ownedPrimary, g.total),
        compareHeight: pct(g.ownedCompare, g.total),
        description: parts.join(' · '),
      };
    });
  });
}
