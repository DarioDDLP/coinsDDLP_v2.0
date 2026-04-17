import { Pipe, PipeTransform } from '@angular/core';

/**
 * Muestra el valor facial de una moneda con su símbolo.
 * Ejemplo: "2 Euros" → "2 €", "50 Céntimos" → "50 ¢"
 */
@Pipe({ name: 'euroValue' })
export class EuroValuePipe implements PipeTransform {
  transform(value: string): string {
    return value
      .replace(/euros?/i, '€')
      .replace(/céntimos?/i, '¢')
      .trim();
  }
}
