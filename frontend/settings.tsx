import {
  useGlobalConfig,
} from '@airtable/blocks/ui';
import { isEmpty } from './utils';

export const PDF_DIFF_SVC_URL = "pdfDiffServiceUrl";

export const DEFAULT_PDF_DIFF_ENDPOINT = 'https://localhost:8000';

export type Settings = {
  pdfDiffEndpoint: string,
}

export type UseSettingsHook = {
  isValid: boolean,
  // this is available when isValid is false
  message?: string,
  settings: Settings,
}

export function useSettings(): UseSettingsHook {
  const globalConfig = useGlobalConfig();

  const pdfDiffEndpoint = globalConfig.get(PDF_DIFF_SVC_URL) as string;

  const settings = {
    pdfDiffEndpoint,
  };

  if (isEmpty(pdfDiffEndpoint)) {
    return {
      isValid: false,
      message: 'Settings are invalid, please configure them once again',
      settings,
    };
  }
  return {
    isValid: true,
    settings,
  };
}

declare global {
  interface String {
    hashCode(): number;
  }
}

String.prototype.hashCode = function () {
  var hash = 0;
  if (this.length == 0) {
    return hash;
  }
  for (var i = 0; i < this.length; i++) {
    var char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
