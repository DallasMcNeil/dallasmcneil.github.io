// Utils for PDF's from Groupifier by Jonatan Kłosko
// Partially modified by Dallas McNeil
// https://github.com/jonatanklosko/groupifier/blob/74fe72310557a6dbe057167db300029abf3b5d0d/src/logic/documents/pdf-utils.js

const inRange = (x, a, b) => a <= x && x <= b;

const DetermineFont = text => {
    const code = text.charCodeAt(0);
    /* Based on https://en.wikipedia.org/wiki/Unicode_block */
    if (inRange(code, 0x0000, 0x052f)) {
      return 'NotoSans';
    } else if (inRange(code, 0x0600, 0x06ff) || inRange(code, 0x0750, 0x077f)) {
      return 'NotoSansArabic';
    } else if (inRange(code, 0x0e00, 0x0e7f)) {
      return 'NotoSansThai';
    } else if (inRange(code, 0x0530, 0x058f)) {
      return 'NotoSansArmenian';
    } else if (inRange(code, 0x10a0, 0x10ff)) {
      return 'NotoSansGeorgian';
    } else {
      /* Default to WenQuanYiZenHei as it supports the most characters (mostly CJK). */
      return 'WenQuanYiZenHei';
    }
};