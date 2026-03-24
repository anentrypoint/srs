import * as _webjsx from '/node_modules/webjsx/dist/index.js';
export const Fragment = _webjsx.Fragment;
export const applyDiff = _webjsx.applyDiff;
export const createDOMElement = _webjsx.createDOMElement;
export function createElement(type, props, ...children) {
  if (typeof type === 'function') return type({ ...props, children });
  return _webjsx.createElement(type, props, ...children);
}
