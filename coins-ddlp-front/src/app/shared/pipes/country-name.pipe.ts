import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { translateCountry } from '../helpers/country.helper';

/** Nombre visible de un país a partir del nombre de la BD ("Alemania" → "Germany"). Impura para seguir el cambio de idioma. */
@Pipe({ name: 'countryName', pure: false })
export class CountryNamePipe implements PipeTransform {
  private countries = inject(I18nService).section('countries');

  transform(dbName: string | null | undefined): string {
    return dbName ? translateCountry(dbName, this.countries()) : '';
  }
}
