export type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'bot';

export interface ParsedUserAgent {
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  deviceType: DeviceType;
}

const BOT =
  /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|curl|wget|python|axios|node-fetch/i;

// Orden importante: Edge, Opera y Samsung también dicen "Chrome"; Chrome también dice "Safari"
const BROWSERS: [string, RegExp][] = [
  ['Edge', /Edg(?:e|A|iOS)?\/([\d.]+)/],
  ['Opera', /(?:OPR|Opera)\/([\d.]+)/],
  ['Samsung Internet', /SamsungBrowser\/([\d.]+)/],
  ['Firefox', /(?:Firefox|FxiOS)\/([\d.]+)/],
  ['Chrome', /(?:Chrome|CriOS)\/([\d.]+)/],
  ['Safari', /Version\/([\d.]+).*Safari/],
];

const OSES: [string, RegExp][] = [
  ['Windows', /Windows NT/],
  ['iPadOS', /iPad/],
  ['iOS', /iPhone|iPod/],
  ['Android', /Android/],
  ['ChromeOS', /CrOS/],
  ['macOS', /Mac OS X|Macintosh/],
  ['Linux', /Linux/],
];

/**
 * Parser mínimo de user-agent: navegador, versión mayor, sistema y tipo de dispositivo.
 * `touch`: el iPad con iPadOS 13+ se presenta como Mac; el front avisa si la pantalla es táctil.
 */
export function parseUserAgent(ua: string, touch = false): ParsedUserAgent {
  const browserMatch = BROWSERS.find(([, re]) => re.test(ua));
  const version = browserMatch ? ua.match(browserMatch[1])?.[1] : undefined;
  let os = OSES.find(([, re]) => re.test(ua))?.[0] ?? null;

  let deviceType: DeviceType;
  if (BOT.test(ua)) deviceType = 'bot';
  else if (/iPad|Tablet/i.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)))
    deviceType = 'tablet';
  else if (os === 'macOS' && touch) {
    deviceType = 'tablet';
    os = 'iPadOS';
  } else if (/Mobi|iPhone|iPod|Android/.test(ua)) deviceType = 'mobile';
  else deviceType = 'desktop';

  return {
    browser: browserMatch?.[0] ?? null,
    browserVersion: version?.split('.')[0] ?? null,
    os,
    deviceType,
  };
}
