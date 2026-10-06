import { Component, computed, input } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { StatGroup } from '../../../../shared/interfaces/euro-stats.interface';
import { injectLiterals } from '../../../../shared/services/i18n.service';

interface YearColumn {
  key: string;
  label: string;
  /** Alto de la columna del catálogo respecto al año con más monedas (%). */
  totalHeight: number;
  /** Parte obtenida dentro de su columna (%). */
  ownedHeight: number;
  description: string;
}

/** Columnas por año: catálogo en gris y lo obtenido en oro. */
@Component({
  selector: 'app-year-chart',
  imports: [TooltipModule],
  templateUrl: './year-chart.component.html',
  styleUrl: './year-chart.component.scss',
})
export class YearChartComponent {
  readonly groups = input.required<StatGroup[]>();

  readonly literals = injectLiterals('estadisticas');

  readonly columns = computed<YearColumn[]>(() => {
    const groups = this.groups();
    const max = Math.max(1, ...groups.map((g) => g.total));
    return groups.map((g) => ({
      key: g.key,
      label: g.label,
      totalHeight: (g.total / max) * 100,
      ownedHeight: g.total > 0 ? (g.owned / g.total) * 100 : 0,
      description: `${g.label}: ${g.owned} / ${g.total}`,
    }));
  });
}
