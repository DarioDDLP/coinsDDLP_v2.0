import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { translateFaceValue } from '../helpers/face-value.helper';

/** Valor facial del euro en el idioma activo ("2 Euros C" → "2 euros C"). Impura para seguir el cambio de idioma. */
@Pipe({ name: 'faceValue', pure: false })
export class FaceValuePipe implements PipeTransform {
  private faceValues = inject(I18nService).section('faceValues');

  transform(value: string | null | undefined): string {
    return value ? translateFaceValue(value, this.faceValues()) : '';
  }
}
