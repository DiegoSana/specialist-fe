import en from '@/messages/en.json';
import es from '@/messages/es.json';

type Messages = { [key: string]: string | Messages };

const leafKeys = (obj: Messages, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' ? leafKeys(value, path) : [path];
  });

describe('i18n message catalogs', () => {
  const enKeys = leafKeys(en as Messages).sort();
  const esKeys = leafKeys(es as Messages).sort();

  it('have the same keys in en and es', () => {
    const onlyEn = enKeys.filter((key) => !esKeys.includes(key));
    const onlyEs = esKeys.filter((key) => !enKeys.includes(key));

    expect({ onlyEn, onlyEs }).toEqual({ onlyEn: [], onlyEs: [] });
  });
});
