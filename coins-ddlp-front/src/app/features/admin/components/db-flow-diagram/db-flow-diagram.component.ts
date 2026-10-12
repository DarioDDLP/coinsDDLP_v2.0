import { Component, computed } from '@angular/core';
import { connectorPath, DiagramRect } from '../../../../shared/helpers/diagram.helper';
import { injectLiterals } from '../../../../shared/services/i18n.service';
import { Translations } from '../../../../shared/interfaces/translations.interface';

type FlowNodeName = 'browser' | 'edge' | 'dataApi' | 'auth' | 'postgres' | 'numista' | 'ipapi';
type FlowLiterals = Translations['admin']['db']['flow'];

interface FlowNode extends DiagramRect {
  name: FlowNodeName;
  /** Nodos de fuera de Supabase (navegador y servicios externos). */
  outside?: boolean;
}

const NODES: FlowNode[] = [
  { name: 'browser', x: 20, y: 110, width: 230, height: 80, outside: true },
  { name: 'edge', x: 330, y: 48, width: 260, height: 60 },
  { name: 'dataApi', x: 330, y: 124, width: 260, height: 60 },
  { name: 'auth', x: 330, y: 200, width: 260, height: 60 },
  { name: 'postgres', x: 650, y: 140, width: 220, height: 100 },
  { name: 'numista', x: 950, y: 24, width: 210, height: 60, outside: true },
  { name: 'ipapi', x: 950, y: 104, width: 210, height: 60, outside: true },
];

const LINKS: [FlowNodeName, FlowNodeName][] = [
  ['browser', 'edge'],
  ['browser', 'dataApi'],
  ['browser', 'auth'],
  ['edge', 'postgres'],
  ['dataApi', 'postgres'],
  ['auth', 'postgres'],
  ['edge', 'numista'],
  ['edge', 'ipapi'],
];

const SUBTITLE: Record<FlowNodeName, keyof FlowLiterals> = {
  browser: 'browserSub',
  edge: 'edgeSub',
  dataApi: 'dataApiSub',
  auth: 'authSub',
  postgres: 'postgresSub',
  numista: 'numistaSub',
  ipapi: 'ipapiSub',
};

const byName = (name: FlowNodeName) => NODES.find((n) => n.name === name)!;

/** Esquema fijo de cómo encajan el front, Supabase y los servicios externos. */
@Component({
  selector: 'app-db-flow-diagram',
  templateUrl: './db-flow-diagram.component.html',
  styleUrl: './db-flow-diagram.component.scss',
})
export class DbFlowDiagramComponent {
  private literals = injectLiterals('admin');
  readonly t = computed(() => this.literals().db.flow);
  readonly label = computed(() => this.literals().db.flowLabel);

  readonly viewBox = '0 0 1180 300';
  readonly supabase = { x: 310, y: 10, width: 580, height: 280 };
  readonly links = LINKS.map(([from, to]) => connectorPath(byName(from), byName(to)));

  readonly nodes = computed(() => {
    const t = this.t();
    return NODES.map((node) => ({
      ...node,
      title: t[node.name],
      subtitle: t[SUBTITLE[node.name]],
      cx: node.x + node.width / 2,
      cy: node.y + node.height / 2,
    }));
  });

  readonly steps = computed(() => {
    const t = this.t();
    return [t.step1, t.step2, t.step3, t.step4];
  });
}
