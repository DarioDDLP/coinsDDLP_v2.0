import { Injectable } from '@angular/core';
import ExcelJS from 'exceljs';
import { EuroCoin } from '../interfaces/euro-coin.interface';

export interface ConmExportRow {
  coin: EuroCoin;
  location: { album: number; page: number; position: string };
}

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

  private styleHeader(row: ExcelJS.Row): void {
    row.eachCell(cell => {
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

  async exportEurosYear(coins: EuroCoin[], country: string, year: number, hasMint: boolean): Promise<void> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`${country} ${year}`);

    const cols: Partial<ExcelJS.Column>[] = [
      { header: 'Valor facial', key: 'faceValue', width: 16 },
      { header: 'Descripción', key: 'description', width: 42 },
    ];
    if (hasMint) cols.push({ header: 'Ceca', key: 'mint', width: 20 });
    cols.push(
      { header: 'Conservación', key: 'conservation', width: 14 },
      { header: 'Uds.', key: 'uds', width: 8 },
      { header: 'Observaciones', key: 'observations', width: 32 },
    );
    ws.columns = cols;
    this.styleHeader(ws.getRow(1));

    for (const c of coins) {
      const row: Record<string, unknown> = {
        faceValue: c.faceValue,
        description: c.description,
        conservation: c.conservation ?? '',
        uds: c.uds,
        observations: c.observations ?? '',
      };
      if (hasMint) row['mint'] = c.mint ?? '';
      ws.addRow(row);
    }

    await this.download(wb, `euros_${country}_${year}.xlsx`);
  }

  async exportEurosAll(coins: EuroCoin[], country: string, hasMint: boolean): Promise<void> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(country);

    const cols: Partial<ExcelJS.Column>[] = [
      { header: 'Año', key: 'year', width: 8 },
      { header: 'Valor facial', key: 'faceValue', width: 16 },
      { header: 'Descripción', key: 'description', width: 42 },
    ];
    if (hasMint) cols.push({ header: 'Ceca', key: 'mint', width: 20 });
    cols.push(
      { header: 'Conservación', key: 'conservation', width: 14 },
      { header: 'Uds.', key: 'uds', width: 8 },
      { header: 'Observaciones', key: 'observations', width: 32 },
    );
    ws.columns = cols;
    this.styleHeader(ws.getRow(1));

    for (const c of coins) {
      const row: Record<string, unknown> = {
        year: c.year,
        faceValue: c.faceValue,
        description: c.description,
        conservation: c.conservation ?? '',
        uds: c.uds,
        observations: c.observations ?? '',
      };
      if (hasMint) row['mint'] = c.mint ?? '';
      ws.addRow(row);
    }

    await this.download(wb, `euros_${country}_todas.xlsx`);
  }

  async exportConmemorativas(groups: ConmExportGroup[], isAdmin: boolean): Promise<void> {
    const wb = new ExcelJS.Workbook();

    for (const group of groups) {
      const ws = wb.addWorksheet(`${group.year}`);

      const cols: Partial<ExcelJS.Column>[] = [
        { header: 'País', key: 'country', width: 22 },
        { header: 'Ceca', key: 'mint', width: 18 },
        { header: 'Descripción', key: 'description', width: 52 },
      ];
      if (isAdmin) cols.push({ header: 'Álb / H / Pos', key: 'location', width: 16 });
      cols.push(
        { header: 'Conservación', key: 'conservation', width: 14 },
        { header: 'Uds.', key: 'uds', width: 8 },
      );
      ws.columns = cols;
      this.styleHeader(ws.getRow(1));

      for (const r of group.rows) {
        const row: Record<string, unknown> = {
          country: r.coin.country,
          mint: r.coin.mint ?? '—',
          description: r.coin.description,
          conservation: r.coin.conservation ?? '',
          uds: r.coin.uds,
        };
        if (isAdmin) row['location'] = `${r.location.album} / ${r.location.page} / ${r.location.position}`;
        ws.addRow(row);
      }
    }

    await this.download(wb, 'conmemorativas.xlsx');
  }
}
