import { Injectable } from '@angular/core';
import ExcelJS from 'exceljs';
import { EuroCoin } from '../interfaces/euro-coin.interface';
import { Translations } from '../interfaces/translations.interface';

export interface ConmExportRow {
  coin: EuroCoin;
  location: { album: number; page: number; position: string };
}

/** Cabeceras y nombres de fichero en el idioma activo; las pasa el componente. */
export type ExcelLabels = Translations['excel'] &
  Pick<Translations['shared'], 'ownerDario' | 'ownerManolo'>;

export interface ConmExportGroup {
  year: number;
  rows: ConmExportRow[];
}

@Injectable({ providedIn: 'root' })
export class ExcelExportService {
  private readonly HEADER_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1B2A4A' },
  };

  private readonly HEADER_FONT: Partial<ExcelJS.Font> = {
    bold: true,
    color: { argb: 'FFFFF5E8' },
    size: 11,
  };

  private conservation(code: string | undefined, uds: number): string {
    return uds > 0 ? (code ?? '') : '';
  }

  private styleHeader(row: ExcelJS.Row): void {
    row.eachCell((cell) => {
      cell.fill = this.HEADER_FILL;
      cell.font = this.HEADER_FONT;
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });
    row.height = 22;
  }

  private async download(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportEurosYear(
    coins: EuroCoin[],
    country: string,
    year: number,
    hasMint: boolean,
    l: ExcelLabels,
    isBoth = false,
  ): Promise<void> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`${country} ${year}`);

    const cols: Partial<ExcelJS.Column>[] = [
      { header: l.faceValue, key: 'faceValue', width: 16 },
      { header: l.description, key: 'description', width: 42 },
    ];
    if (hasMint) cols.push({ header: l.mint, key: 'mint', width: 20 });
    if (isBoth) {
      cols.push(
        { header: `${l.conservation} (${l.ownerDario})`, key: 'conservation', width: 20 },
        { header: `${l.units} (${l.ownerDario})`, key: 'uds', width: 12 },
        { header: `${l.observations} (${l.ownerDario})`, key: 'observations', width: 32 },
        { header: `${l.conservation} (${l.ownerManolo})`, key: 'conservationAlt', width: 20 },
        { header: `${l.units} (${l.ownerManolo})`, key: 'udsAlt', width: 12 },
        { header: `${l.observations} (${l.ownerManolo})`, key: 'observationsAlt', width: 32 },
      );
    } else {
      cols.push(
        { header: l.conservation, key: 'conservation', width: 14 },
        { header: l.units, key: 'uds', width: 8 },
        { header: l.observations, key: 'observations', width: 32 },
      );
    }
    ws.columns = cols;
    this.styleHeader(ws.getRow(1));

    for (const c of coins) {
      const row: Record<string, unknown> = {
        faceValue: c.faceValue,
        description: c.description,
        conservation: this.conservation(c.conservation, c.uds),
        uds: c.uds,
        observations: c.uds > 0 ? (c.observations ?? '') : '',
      };
      if (hasMint) row['mint'] = c.mint ?? '';
      if (isBoth) {
        const udsAlt = c.udsAlt ?? 0;
        row['conservationAlt'] = this.conservation(c.conservationAlt, udsAlt);
        row['udsAlt'] = udsAlt;
        row['observationsAlt'] = udsAlt > 0 ? (c.observationsAlt ?? '') : '';
      }
      ws.addRow(row);
    }

    await this.download(wb, `euros_${country}_${year}.xlsx`);
  }

  async exportEurosAll(
    coins: EuroCoin[],
    country: string,
    hasMint: boolean,
    l: ExcelLabels,
    isBoth = false,
  ): Promise<void> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(country);

    const cols: Partial<ExcelJS.Column>[] = [
      { header: l.year, key: 'year', width: 8 },
      { header: l.faceValue, key: 'faceValue', width: 16 },
      { header: l.description, key: 'description', width: 42 },
    ];
    if (hasMint) cols.push({ header: l.mint, key: 'mint', width: 20 });
    if (isBoth) {
      cols.push(
        { header: `${l.conservation} (${l.ownerDario})`, key: 'conservation', width: 20 },
        { header: `${l.units} (${l.ownerDario})`, key: 'uds', width: 12 },
        { header: `${l.observations} (${l.ownerDario})`, key: 'observations', width: 32 },
        { header: `${l.conservation} (${l.ownerManolo})`, key: 'conservationAlt', width: 20 },
        { header: `${l.units} (${l.ownerManolo})`, key: 'udsAlt', width: 12 },
        { header: `${l.observations} (${l.ownerManolo})`, key: 'observationsAlt', width: 32 },
      );
    } else {
      cols.push(
        { header: l.conservation, key: 'conservation', width: 14 },
        { header: l.units, key: 'uds', width: 8 },
        { header: l.observations, key: 'observations', width: 32 },
      );
    }
    ws.columns = cols;
    this.styleHeader(ws.getRow(1));

    for (const c of coins) {
      const row: Record<string, unknown> = {
        year: c.year,
        faceValue: c.faceValue,
        description: c.description,
        conservation: this.conservation(c.conservation, c.uds),
        uds: c.uds,
        observations: c.uds > 0 ? (c.observations ?? '') : '',
      };
      if (hasMint) row['mint'] = c.mint ?? '';
      if (isBoth) {
        const udsAlt = c.udsAlt ?? 0;
        row['conservationAlt'] = this.conservation(c.conservationAlt, udsAlt);
        row['udsAlt'] = udsAlt;
        row['observationsAlt'] = udsAlt > 0 ? (c.observationsAlt ?? '') : '';
      }
      ws.addRow(row);
    }

    await this.download(wb, `euros_${country}_${l.allFileSuffix}.xlsx`);
  }

  async exportConmemorativas(
    groups: ConmExportGroup[],
    isAdmin: boolean,
    l: ExcelLabels,
    isBoth = false,
  ): Promise<void> {
    const wb = new ExcelJS.Workbook();

    for (const group of groups) {
      const ws = wb.addWorksheet(`${group.year}`);

      const cols: Partial<ExcelJS.Column>[] = [
        { header: l.country, key: 'country', width: 22 },
        { header: l.mint, key: 'mint', width: 18 },
        { header: l.description, key: 'description', width: 52 },
      ];
      if (isAdmin) cols.push({ header: l.location, key: 'location', width: 16 });
      if (isBoth) {
        cols.push(
          { header: `${l.conservation} (${l.ownerDario})`, key: 'conservation', width: 20 },
          { header: `${l.units} (${l.ownerDario})`, key: 'uds', width: 12 },
          { header: `${l.conservation} (${l.ownerManolo})`, key: 'conservationAlt', width: 20 },
          { header: `${l.units} (${l.ownerManolo})`, key: 'udsAlt', width: 12 },
        );
      } else {
        cols.push(
          { header: l.conservation, key: 'conservation', width: 14 },
          { header: l.units, key: 'uds', width: 8 },
        );
      }
      ws.columns = cols;
      this.styleHeader(ws.getRow(1));

      for (const r of group.rows) {
        const row: Record<string, unknown> = {
          country: r.coin.country,
          mint: r.coin.mint ?? '—',
          description: r.coin.description,
          conservation: this.conservation(r.coin.conservation, r.coin.uds),
          uds: r.coin.uds,
        };
        if (isAdmin)
          row['location'] = `${r.location.album} / ${r.location.page} / ${r.location.position}`;
        if (isBoth) {
          const udsAlt = r.coin.udsAlt ?? 0;
          row['conservationAlt'] = this.conservation(r.coin.conservationAlt, udsAlt);
          row['udsAlt'] = udsAlt;
        }
        ws.addRow(row);
      }
    }

    await this.download(wb, `${l.conmemorativasFile}.xlsx`);
  }
}
