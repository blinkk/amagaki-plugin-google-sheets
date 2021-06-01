// eslint-disable-next-line node/no-unpublished-import
import * as googleSheetsPlugin from '../dist';

import {Pod} from '@amagaki/amagaki';

export default (pod: Pod) => {
  const sheets = googleSheetsPlugin.register(pod, {
    keyFile: '/Users/jeremydw/Downloads/madebygoog-52e1c116d139.json',
  });
  sheets.bindCollection({
    collectionPath: '/content/strings',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    ranges: ['homepage', 'about'],
    transform: googleSheetsPlugin.Transformation.STRINGS,
  });
  sheets.saveFile({
    podPath: '/content/transformations/strings.yaml',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    range: 'homepage',
    transform: googleSheetsPlugin.Transformation.STRINGS,
  });
  sheets.saveFile({
    podPath: '/content/transformations/grid.yaml',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    range: 'items',
    transform: googleSheetsPlugin.Transformation.GRID,
  });
  sheets.saveFile({
    podPath: '/content/transformations/objectRows.yaml',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    range: 'items',
    transform: googleSheetsPlugin.Transformation.OBJECT_ROWS,
  });
  sheets.saveFile({
    podPath: '/content/transformations/rows.yaml',
    spreadsheetId: '1qP7IPYJ1nIA5useXKbm8nHyj96Ue_6YMEFkwgpUoL-c',
    range: 'items',
    transform: googleSheetsPlugin.Transformation.ROWS,
  });
};
