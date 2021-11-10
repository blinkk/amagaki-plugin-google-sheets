// eslint-disable-next-line node/no-unpublished-import
import {GoogleSheetsPlugin, Transformation} from '../dist';

import {Pod} from '@amagaki/amagaki';

export default (pod: Pod) => {
  const sheets = GoogleSheetsPlugin.register(pod);
  sheets.addCellType('capitalize', (data: string) => {
    return data.toUpperCase();
  });
  sheets.bindCollection({
    collectionPath: '/content/strings',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    ranges: ['homepage', 'about'],
    transform: Transformation.STRINGS,
  });
  sheets.saveFile({
    podPath: '/content/transformations/strings.yaml',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    range: 'homepage',
    transform: Transformation.STRINGS,
  });
  sheets.saveFile({
    podPath: '/content/transformations/grid.yaml',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    range: 'items',
    transform: Transformation.GRID,
  });
  sheets.saveFile({
    podPath: '/content/transformations/objectRows.yaml',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    range: 'items',
    transform: Transformation.OBJECT_ROWS,
  });
  sheets.saveFile({
    podPath: '/content/transformations/rows.yaml',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    range: 'items',
    transform: Transformation.ROWS,
  });
};
