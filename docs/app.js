// docs/webjsx.js
var HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
function definesRenderSuspension(el) {
  return !!el.__webjsx_suspendRendering;
}
function withRenderSuspension(el, callback) {
  const isRenderingSuspended = !!el.__webjsx_suspendRendering;
  if (isRenderingSuspended) {
    el.__webjsx_suspendRendering();
  }
  try {
    return callback();
  } finally {
    if (isRenderingSuspended) {
      el.__webjsx_resumeRendering();
    }
  }
}
function flattenVNodes(vnodes, result = []) {
  if (Array.isArray(vnodes)) {
    for (const vnode of vnodes) {
      flattenVNodes(vnode, result);
    }
  } else if (isValidVNode(vnodes)) {
    result.push(vnodes);
  }
  return result;
}
function isValidVNode(vnode) {
  const typeofVNode = typeof vnode;
  return vnode !== null && vnode !== undefined && (typeofVNode === "string" || typeofVNode === "object" || typeofVNode === "number" || typeofVNode === "bigint");
}
function getChildNodes(parent) {
  const nodes = [];
  let current = parent.firstChild;
  while (current) {
    nodes.push(current);
    current = current.nextSibling;
  }
  return nodes;
}
function assignRef(node, ref) {
  if (typeof ref === "function") {
    ref(node);
  } else if (ref && typeof ref === "object") {
    ref.current = node;
  }
}
function isVElement(vnode) {
  const typeofVNode = typeof vnode;
  return typeofVNode !== "string" && typeofVNode !== "number" && typeofVNode !== "bigint";
}
function isNonBooleanPrimitive(vnode) {
  const typeofVNode = typeof vnode;
  return typeofVNode === "string" || typeofVNode === "number" || typeofVNode === "bigint";
}
function getNamespaceURI(node) {
  return node instanceof Element && node.namespaceURI !== HTML_NAMESPACE ? node.namespaceURI ?? undefined : undefined;
}
function setWebJSXProps(element, props) {
  element.__webjsx_props = props;
}
function getWebJSXProps(element) {
  let props = element.__webjsx_props;
  if (!props) {
    props = {};
    element.__webjsx_props = props;
  }
  return props;
}
function setWebJSXChildNodeCache(element, childNodes) {
  element.__webjsx_childNodes = childNodes;
}
function getWebJSXChildNodeCache(element) {
  return element.__webjsx_childNodes;
}
function updateEventListener(el, eventName, newHandler, oldHandler) {
  if (oldHandler && oldHandler !== newHandler) {
    el.removeEventListener(eventName, oldHandler);
  }
  if (newHandler && oldHandler !== newHandler) {
    el.addEventListener(eventName, newHandler);
    el.__webjsx_listeners = el.__webjsx_listeners ?? {};
    el.__webjsx_listeners[eventName] = newHandler;
  }
}
function updatePropOrAttr(el, key, value) {
  if (el instanceof HTMLElement) {
    if (key in el) {
      el[key] = value;
      return;
    }
    if (typeof value === "string") {
      el.setAttribute(key, value);
      return;
    }
    el[key] = value;
    return;
  }
  const isSVG = el.namespaceURI === "http://www.w3.org/2000/svg";
  if (isSVG) {
    if (value !== undefined && value !== null) {
      el.setAttribute(key, `${value}`);
    } else {
      el.removeAttribute(key);
    }
    return;
  }
  if (typeof value === "string") {
    el.setAttribute(key, value);
  } else {
    el[key] = value;
  }
}
function updateAttributesCore(el, newProps, oldProps = {}) {
  for (const key of Object.keys(newProps)) {
    const value = newProps[key];
    if (key === "children" || key === "key" || key === "dangerouslySetInnerHTML" || key === "nodes")
      continue;
    if (key.startsWith("on") && typeof value === "function") {
      const eventName = key.substring(2).toLowerCase();
      updateEventListener(el, eventName, value, el.__webjsx_listeners?.[eventName]);
    } else if (value !== oldProps[key]) {
      updatePropOrAttr(el, key, value);
    }
  }
  if (newProps.dangerouslySetInnerHTML) {
    if (!oldProps.dangerouslySetInnerHTML || newProps.dangerouslySetInnerHTML.__html !== oldProps.dangerouslySetInnerHTML.__html) {
      const html = newProps.dangerouslySetInnerHTML?.__html || "";
      el.innerHTML = html;
    }
  } else {
    if (oldProps.dangerouslySetInnerHTML) {
      el.innerHTML = "";
    }
  }
  for (const key of Object.keys(oldProps)) {
    if (!(key in newProps) && key !== "children" && key !== "key" && key !== "dangerouslySetInnerHTML" && key !== "nodes") {
      if (key.startsWith("on")) {
        const eventName = key.substring(2).toLowerCase();
        const existingListener = el.__webjsx_listeners?.[eventName];
        if (existingListener) {
          el.removeEventListener(eventName, existingListener);
          delete el.__webjsx_listeners[eventName];
        }
      } else if (key in el) {
        el[key] = undefined;
      } else {
        el.removeAttribute(key);
      }
    }
  }
}
function setAttributes(el, props) {
  if (definesRenderSuspension(el)) {
    withRenderSuspension(el, () => {
      updateAttributesCore(el, props);
    });
  } else {
    updateAttributesCore(el, props);
  }
}
function updateAttributes(el, newProps, oldProps) {
  if (definesRenderSuspension(el)) {
    withRenderSuspension(el, () => {
      updateAttributesCore(el, newProps, oldProps);
    });
  } else {
    updateAttributesCore(el, newProps, oldProps);
  }
}
var KNOWN_ELEMENTS = new Map(Object.entries({
  a: "A",
  abbr: "ABBR",
  address: "ADDRESS",
  area: "AREA",
  article: "ARTICLE",
  aside: "ASIDE",
  audio: "AUDIO",
  b: "B",
  base: "BASE",
  bdi: "BDI",
  bdo: "BDO",
  blockquote: "BLOCKQUOTE",
  body: "BODY",
  br: "BR",
  button: "BUTTON",
  canvas: "CANVAS",
  caption: "CAPTION",
  cite: "CITE",
  code: "CODE",
  col: "COL",
  colgroup: "COLGROUP",
  data: "DATA",
  datalist: "DATALIST",
  dd: "DD",
  del: "DEL",
  details: "DETAILS",
  dfn: "DFN",
  dialog: "DIALOG",
  div: "DIV",
  dl: "DL",
  dt: "DT",
  em: "EM",
  embed: "EMBED",
  fieldset: "FIELDSET",
  figcaption: "FIGCAPTION",
  figure: "FIGURE",
  footer: "FOOTER",
  form: "FORM",
  h1: "H1",
  h2: "H2",
  h3: "H3",
  h4: "H4",
  h5: "H5",
  h6: "H6",
  head: "HEAD",
  header: "HEADER",
  hgroup: "HGROUP",
  hr: "HR",
  html: "HTML",
  i: "I",
  iframe: "IFRAME",
  img: "IMG",
  input: "INPUT",
  ins: "INS",
  kbd: "KBD",
  label: "LABEL",
  legend: "LEGEND",
  li: "LI",
  link: "LINK",
  main: "MAIN",
  map: "MAP",
  mark: "MARK",
  menu: "MENU",
  meta: "META",
  meter: "METER",
  nav: "NAV",
  noscript: "NOSCRIPT",
  object: "OBJECT",
  ol: "OL",
  optgroup: "OPTGROUP",
  option: "OPTION",
  output: "OUTPUT",
  p: "P",
  picture: "PICTURE",
  pre: "PRE",
  progress: "PROGRESS",
  q: "Q",
  rp: "RP",
  rt: "RT",
  ruby: "RUBY",
  s: "S",
  samp: "SAMP",
  script: "SCRIPT",
  section: "SECTION",
  select: "SELECT",
  slot: "SLOT",
  small: "SMALL",
  source: "SOURCE",
  span: "SPAN",
  strong: "STRONG",
  style: "STYLE",
  sub: "SUB",
  summary: "SUMMARY",
  sup: "SUP",
  table: "TABLE",
  tbody: "TBODY",
  td: "TD",
  template: "TEMPLATE",
  textarea: "TEXTAREA",
  tfoot: "TFOOT",
  th: "TH",
  thead: "THEAD",
  time: "TIME",
  title: "TITLE",
  tr: "TR",
  track: "TRACK",
  u: "U",
  ul: "UL",
  var: "VAR",
  video: "VIDEO",
  wbr: "WBR"
}));
function createDOMElement(velement, parentNamespaceURI) {
  const namespaceURI = velement.props.xmlns !== undefined ? velement.props.xmlns : velement.type === "svg" ? SVG_NAMESPACE : parentNamespaceURI ?? undefined;
  const el = velement.props.is !== undefined ? namespaceURI !== undefined ? document.createElementNS(namespaceURI, velement.type, {
    is: velement.props.is
  }) : document.createElement(velement.type, {
    is: velement.props.is
  }) : namespaceURI !== undefined ? document.createElementNS(namespaceURI, velement.type) : document.createElement(velement.type);
  if (velement.props) {
    setAttributes(el, velement.props);
  }
  if (velement.props.key !== undefined) {
    el.__webjsx_key = velement.props.key;
  }
  if (velement.props.ref) {
    assignRef(el, velement.props.ref);
  }
  if (velement.props.children && !velement.props.dangerouslySetInnerHTML) {
    const children = velement.props.children;
    const nodes = [];
    for (let i = 0;i < children.length; i++) {
      const child = children[i];
      const node = isVElement(child) ? createDOMElement(child, namespaceURI) : document.createTextNode(`${child}`);
      nodes.push(node);
      el.appendChild(node);
    }
    setWebJSXProps(el, velement.props);
    setWebJSXChildNodeCache(el, nodes);
  }
  return el;
}
function applyDiff(parent, vnodes) {
  const newVNodes = flattenVNodes(vnodes);
  const newNodes = diffChildren(parent, newVNodes);
  const props = getWebJSXProps(parent);
  props.children = newVNodes;
  setWebJSXChildNodeCache(parent, newNodes);
}
function diffChildren(parent, newVNodes) {
  const parentProps = getWebJSXProps(parent);
  const oldVNodes = parentProps.children ?? [];
  if (newVNodes.length === 0) {
    if (oldVNodes.length > 0) {
      parent.innerHTML = "";
      return [];
    } else {
      return [];
    }
  }
  const changes = [];
  let keyedMap = null;
  const originalChildNodes = getWebJSXChildNodeCache(parent) ?? getChildNodes(parent);
  let hasKeyedNodes = false;
  let nodeOrderUnchanged = true;
  for (let i = 0;i < newVNodes.length; i++) {
    const newVNode = newVNodes[i];
    const oldVNode = oldVNodes[i];
    const currentNode = originalChildNodes[i];
    const newKey = isVElement(newVNode) ? newVNode.props.key : undefined;
    if (newKey !== undefined) {
      if (!keyedMap) {
        hasKeyedNodes = true;
        keyedMap = new Map;
        for (let j = 0;j < oldVNodes.length; j++) {
          const matchingVNode = oldVNodes[j];
          const key = matchingVNode.props.key;
          if (key !== undefined) {
            const node = originalChildNodes[j];
            keyedMap.set(key, { node, oldVNode: matchingVNode });
          }
        }
      }
      const keyedNode = keyedMap.get(newKey);
      if (keyedNode) {
        if (keyedNode.oldVNode !== oldVNode) {
          nodeOrderUnchanged = false;
        }
        changes.push({
          type: "update",
          node: keyedNode.node,
          newVNode,
          oldVNode: keyedNode.oldVNode
        });
      } else {
        nodeOrderUnchanged = false;
        changes.push({ type: "create", vnode: newVNode });
      }
    } else {
      if (!hasKeyedNodes && canUpdateVNodes(newVNode, oldVNode) && currentNode) {
        changes.push({
          type: "update",
          node: currentNode,
          newVNode,
          oldVNode
        });
      } else {
        nodeOrderUnchanged = false;
        changes.push({ type: "create", vnode: newVNode });
      }
    }
  }
  if (changes.length) {
    const { nodes, lastNode: lastPlacedNode } = applyChanges(parent, changes, originalChildNodes, nodeOrderUnchanged);
    while (lastPlacedNode?.nextSibling) {
      parent.removeChild(lastPlacedNode.nextSibling);
    }
    return nodes;
  } else {
    return originalChildNodes;
  }
}
function canUpdateVNodes(newVNode, oldVNode) {
  if (oldVNode === undefined)
    return false;
  if (isNonBooleanPrimitive(newVNode) && isNonBooleanPrimitive(oldVNode)) {
    return true;
  } else {
    if (isVElement(oldVNode) && isVElement(newVNode)) {
      const oldKey = oldVNode.props.key;
      const newKey = newVNode.props.key;
      return oldVNode.tagName === newVNode.tagName && (oldKey === undefined && newKey === undefined || oldKey !== undefined && newKey !== undefined && oldKey === newKey);
    } else {
      return false;
    }
  }
}
function applyChanges(parent, changes, originalNodes, nodeOrderUnchanged) {
  const nodes = [];
  let lastPlacedNode = null;
  for (const change of changes) {
    if (change.type === "create") {
      let node = undefined;
      if (isVElement(change.vnode)) {
        node = createDOMElement(change.vnode, getNamespaceURI(parent));
      } else {
        node = document.createTextNode(`${change.vnode}`);
      }
      if (!lastPlacedNode) {
        parent.prepend(node);
      } else {
        parent.insertBefore(node, lastPlacedNode.nextSibling ?? null);
      }
      lastPlacedNode = node;
      nodes.push(node);
    } else {
      const { node, newVNode, oldVNode } = change;
      if (isVElement(newVNode)) {
        const oldProps = oldVNode?.props || {};
        const newProps = newVNode.props;
        updateAttributes(node, newProps, oldProps);
        if (newVNode.props.key !== undefined) {
          node.__webjsx_key = newVNode.props.key;
        } else {
          if (oldVNode.props?.key) {
            delete node.__webjsx_key;
          }
        }
        if (newVNode.props.ref) {
          assignRef(node, newVNode.props.ref);
        }
        if (!newProps.dangerouslySetInnerHTML && newProps.children != null) {
          const childNodes = diffChildren(node, newProps.children);
          setWebJSXProps(node, newProps);
          setWebJSXChildNodeCache(node, childNodes);
        }
      } else {
        if (newVNode !== oldVNode) {
          node.textContent = `${newVNode}`;
        }
      }
      if (!nodeOrderUnchanged) {
        if (!lastPlacedNode) {
          if (node !== originalNodes[0]) {
            parent.prepend(node);
          }
        } else {
          if (lastPlacedNode.nextSibling !== node) {
            parent.insertBefore(node, lastPlacedNode.nextSibling ?? null);
          }
        }
      }
      lastPlacedNode = node;
      nodes.push(node);
    }
  }
  return { nodes, lastNode: lastPlacedNode };
}

// node_modules/webjsx/dist/elementTags.js
var KNOWN_ELEMENTS2 = new Map(Object.entries({
  a: "A",
  abbr: "ABBR",
  address: "ADDRESS",
  area: "AREA",
  article: "ARTICLE",
  aside: "ASIDE",
  audio: "AUDIO",
  b: "B",
  base: "BASE",
  bdi: "BDI",
  bdo: "BDO",
  blockquote: "BLOCKQUOTE",
  body: "BODY",
  br: "BR",
  button: "BUTTON",
  canvas: "CANVAS",
  caption: "CAPTION",
  cite: "CITE",
  code: "CODE",
  col: "COL",
  colgroup: "COLGROUP",
  data: "DATA",
  datalist: "DATALIST",
  dd: "DD",
  del: "DEL",
  details: "DETAILS",
  dfn: "DFN",
  dialog: "DIALOG",
  div: "DIV",
  dl: "DL",
  dt: "DT",
  em: "EM",
  embed: "EMBED",
  fieldset: "FIELDSET",
  figcaption: "FIGCAPTION",
  figure: "FIGURE",
  footer: "FOOTER",
  form: "FORM",
  h1: "H1",
  h2: "H2",
  h3: "H3",
  h4: "H4",
  h5: "H5",
  h6: "H6",
  head: "HEAD",
  header: "HEADER",
  hgroup: "HGROUP",
  hr: "HR",
  html: "HTML",
  i: "I",
  iframe: "IFRAME",
  img: "IMG",
  input: "INPUT",
  ins: "INS",
  kbd: "KBD",
  label: "LABEL",
  legend: "LEGEND",
  li: "LI",
  link: "LINK",
  main: "MAIN",
  map: "MAP",
  mark: "MARK",
  menu: "MENU",
  meta: "META",
  meter: "METER",
  nav: "NAV",
  noscript: "NOSCRIPT",
  object: "OBJECT",
  ol: "OL",
  optgroup: "OPTGROUP",
  option: "OPTION",
  output: "OUTPUT",
  p: "P",
  picture: "PICTURE",
  pre: "PRE",
  progress: "PROGRESS",
  q: "Q",
  rp: "RP",
  rt: "RT",
  ruby: "RUBY",
  s: "S",
  samp: "SAMP",
  script: "SCRIPT",
  section: "SECTION",
  select: "SELECT",
  slot: "SLOT",
  small: "SMALL",
  source: "SOURCE",
  span: "SPAN",
  strong: "STRONG",
  style: "STYLE",
  sub: "SUB",
  summary: "SUMMARY",
  sup: "SUP",
  table: "TABLE",
  tbody: "TBODY",
  td: "TD",
  template: "TEMPLATE",
  textarea: "TEXTAREA",
  tfoot: "TFOOT",
  th: "TH",
  thead: "THEAD",
  time: "TIME",
  title: "TITLE",
  tr: "TR",
  track: "TRACK",
  u: "U",
  ul: "UL",
  var: "VAR",
  video: "VIDEO",
  wbr: "WBR"
}));

// node_modules/webjsx/dist/utils.js
function flattenVNodes2(vnodes, result = []) {
  if (Array.isArray(vnodes)) {
    for (const vnode of vnodes) {
      flattenVNodes2(vnode, result);
    }
  } else if (isValidVNode2(vnodes)) {
    result.push(vnodes);
  }
  return result;
}
function isValidVNode2(vnode) {
  const typeofVNode = typeof vnode;
  return vnode !== null && vnode !== undefined && (typeofVNode === "string" || typeofVNode === "object" || typeofVNode === "number" || typeofVNode === "bigint");
}

// node_modules/webjsx/dist/createElement.js
function createElementJSX(type, props, key) {
  if (typeof type === "string") {
    props = props || {};
    const flatChildren = props ? flattenVNodes2(props.children) : [];
    if (key !== undefined) {
      props.key = key;
    }
    if (flatChildren.length > 0) {
      if (!props.dangerouslySetInnerHTML) {
        props.children = flatChildren;
      } else {
        props.children = [];
        console.warn("WebJSX: Ignoring children since dangerouslySetInnerHTML is set.");
      }
    } else {
      props.children = [];
    }
    const result = {
      type,
      tagName: KNOWN_ELEMENTS2.get(type) ?? type.toUpperCase(),
      props: props ?? {}
    };
    return result;
  } else {
    const flatChildren = props ? flattenVNodes2(props.children) : [];
    return flatChildren;
  }
}
// node_modules/webjsx/dist/jsx-runtime.js
function jsx2(type, props, key) {
  return createElementJSX(type, props, key);
}
function jsxDEV(type, props, key) {
  return jsx2(type, props, key);
}
// docs/_app.jsx
function calcSM2(state, score) {
  if (score < 3)
    return { ...state, interval: 1, repetitions: 0 };
  const ef = Math.max(1.3, state.easeFactor + 0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
  const interval = state.repetitions === 0 ? 1 : state.repetitions === 1 ? 6 : Math.round(state.interval * ef);
  return { easeFactor: ef, interval, repetitions: state.repetitions + 1 };
}
function defState() {
  return { easeFactor: 2.5, interval: 1, repetitions: 0, dueDate: today(), lastScore: null };
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(n) {
  const d = new Date;
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
var SK = "mccqe1_states";
var CK = "mccqe1_cfg";
var loadStates = () => {
  try {
    return JSON.parse(localStorage.getItem(SK) || "{}");
  } catch {
    return {};
  }
};
var saveStates = (s) => localStorage.setItem(SK, JSON.stringify(s));
var loadCfg = () => ({ examDate: "2026-06-15", dailyStudyMinutes: 60, targetGrade: "pass", ...JSON.parse(localStorage.getItem(CK) || "{}") });
var saveCfg = (c) => localStorage.setItem(CK, JSON.stringify(c));
var daysLeft = (cfg) => cfg.examDate ? Math.max(0, Math.ceil((new Date(cfg.examDate) - new Date) / 86400000)) : 999;
var isDue = (states, id) => (states[id]?.dueDate ?? today()) <= today();
var getDue = (cards) => {
  const s = loadStates();
  return cards.filter((c) => isDue(s, c.id));
};
function updateCard(id, score) {
  const states = loadStates();
  const next = calcSM2(states[id] ?? defState(), score);
  states[id] = { ...next, dueDate: addDays(next.interval), lastScore: score };
  saveStates(states);
}
function getStats(cards) {
  const states = loadStates();
  const t = today();
  const due = cards.filter((c) => (states[c.id]?.dueDate ?? t) <= t).length;
  const avgEF = cards.length ? cards.reduce((s, c) => s + (states[c.id]?.easeFactor ?? 2.5), 0) / cards.length : 0;
  const scored = cards.filter((c) => states[c.id]?.lastScore != null);
  const avgScore = scored.length ? scored.reduce((s, c) => s + states[c.id].lastScore, 0) / scored.length : null;
  return { total: cards.length, due, avgEF, avgScore };
}
var CARDS = [];
var view = "loading";
var ctx = {};
var go = (v, extra = {}) => {
  view = v;
  ctx = { ...ctx, ...extra };
  render();
};
var root = document.getElementById("app");
function Loading() {
  return /* @__PURE__ */ jsxDEV("div", {
    class: "flex items-center justify-center min-h-screen",
    children: /* @__PURE__ */ jsxDEV("div", {
      class: "text-center space-y-3",
      children: [
        /* @__PURE__ */ jsxDEV("span", {
          class: "loading loading-spinner loading-lg text-primary"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV("p", {
          class: "text-content2",
          children: "Loading cards..."
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
function Dashboard() {
  const cfg = loadCfg(), stats = getStats(CARDS), dr = daysLeft(cfg);
  const gp = Math.round(Math.max(0, Math.min(100, (stats.avgEF - 1.3) / (2.5 - 1.3) * 100)));
  return /* @__PURE__ */ jsxDEV("div", {
    class: "min-h-screen bg-base-100",
    children: /* @__PURE__ */ jsxDEV("div", {
      class: "max-w-4xl mx-auto p-6 space-y-6 fade-in",
      children: [
        /* @__PURE__ */ jsxDEV("div", {
          class: "flex items-center justify-between",
          children: [
            /* @__PURE__ */ jsxDEV("div", {
              children: [
                /* @__PURE__ */ jsxDEV("h1", {
                  class: "text-2xl font-bold",
                  children: "MCCQE1 SRS"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV("p", {
                  class: "text-sm text-content2",
                  children: "Spaced Repetition Study System"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV("button", {
              class: "btn btn-ghost btn-sm opacity-60 hover:opacity-100",
              onclick: () => render(),
              children: "⟳"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsxDEV("div", {
          class: "grid grid-cols-2 sm:grid-cols-4 gap-3",
          children: [
            ["Due Today", stats.due, stats.due > 0],
            ["Total Cards", stats.total, false],
            ["Days Left", dr, false],
            ["Target", cfg.targetGrade, false]
          ].map(([label, val, hi]) => /* @__PURE__ */ jsxDEV("div", {
            class: "card p-4 text-center space-y-1",
            children: [
              /* @__PURE__ */ jsxDEV("div", {
                class: "text-3xl font-bold " + (hi ? "text-primary" : ""),
                children: String(val)
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV("div", {
                class: "text-xs text-content2 uppercase tracking-wide",
                children: label
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this))
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV("div", {
          class: "card p-5 space-y-3",
          children: [
            /* @__PURE__ */ jsxDEV("div", {
              class: "flex justify-between items-baseline",
              children: [
                /* @__PURE__ */ jsxDEV("span", {
                  class: "font-semibold",
                  children: "Grade Progress"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV("span", {
                  class: "text-sm text-content2",
                  children: [
                    gp,
                    "% — EF ",
                    stats.avgEF.toFixed(2)
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              class: "relative w-full bg-base-200 rounded-full h-4",
              children: /* @__PURE__ */ jsxDEV("div", {
                class: "bg-primary h-4 rounded-full prog",
                style: "width:" + Math.max(gp, 2) + "%"
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              class: "flex justify-between text-xs text-content3",
              children: [["fail", "1.3"], ["pass", "2.0"], ["honours", "2.5"]].map(([l, v]) => /* @__PURE__ */ jsxDEV("div", {
                class: "text-center",
                children: [
                  /* @__PURE__ */ jsxDEV("div", {
                    class: "font-mono",
                    children: v
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV("div", {
                    class: "capitalize",
                    children: l
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this))
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        stats.avgScore != null && /* @__PURE__ */ jsxDEV("p", {
          class: "text-sm text-content2",
          children: [
            "Last score avg: ",
            /* @__PURE__ */ jsxDEV("span", {
              class: "font-medium text-base-content",
              children: [
                stats.avgScore.toFixed(1),
                "/5"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsxDEV("div", {
          class: "flex flex-wrap gap-3 pt-2",
          children: [
            /* @__PURE__ */ jsxDEV("button", {
              class: "btn btn-lg " + (stats.due > 0 ? "btn-primary" : "btn-ghost btn-disabled"),
              onclick: () => stats.due > 0 && startSession(),
              children: stats.due > 0 ? `Study Now — ${stats.due} card${stats.due === 1 ? "" : "s"}` : "No Cards Due"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              class: "flex gap-2 ml-auto",
              children: [["Stats", "stats"], ["Topics", "topics"], ["Config", "config"]].map(([l, v]) => /* @__PURE__ */ jsxDEV("button", {
                class: "btn btn-ghost btn-sm",
                onclick: () => go(v),
                children: l
              }, undefined, false, undefined, this))
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
function startSession() {
  const due = getDue(CARDS);
  ctx = { session: { cards: due, index: 0, results: [] }, phase: "question" };
  go("session");
}
function Session() {
  const { session, phase } = ctx;
  const card = session.cards[session.index];
  const progress = Math.round(session.index / session.cards.length * 100);
  const isLast = session.index >= session.cards.length - 1;
  if (!card)
    return /* @__PURE__ */ jsxDEV(SessionComplete, {}, undefined, false, undefined, this);
  return /* @__PURE__ */ jsxDEV("div", {
    class: "min-h-screen bg-base-100",
    children: /* @__PURE__ */ jsxDEV("div", {
      class: "max-w-2xl mx-auto p-6 space-y-6 fade-in",
      children: [
        /* @__PURE__ */ jsxDEV("div", {
          class: "flex items-center justify-between",
          children: [
            /* @__PURE__ */ jsxDEV("div", {
              class: "flex items-center gap-3",
              children: [
                /* @__PURE__ */ jsxDEV("button", {
                  class: "btn btn-ghost btn-sm",
                  onclick: () => go("dashboard"),
                  children: "← Exit"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV("span", {
                  class: "text-sm text-content2",
                  children: [
                    session.index + 1,
                    " / ",
                    session.cards.length
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV("span", {
              class: "text-sm text-content2",
              children: [
                progress,
                "%"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsxDEV("div", {
          class: "w-full bg-base-200 rounded-full h-1.5",
          children: /* @__PURE__ */ jsxDEV("div", {
            class: "bg-primary h-1.5 rounded-full prog",
            style: "width:" + progress + "%"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV("div", {
          class: "card p-6 space-y-4",
          children: [
            /* @__PURE__ */ jsxDEV("div", {
              class: "flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsxDEV("span", {
                  class: "badge badge-ghost badge-sm font-mono",
                  children: card.topicId
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV("span", {
                  class: "badge badge-ghost badge-sm",
                  children: card.bloomLevel
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV("p", {
              class: "text-lg font-medium leading-relaxed card-text",
              children: card.question
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        phase === "question" && /* @__PURE__ */ jsxDEV("button", {
          class: "btn btn-primary w-full",
          onclick: () => go("session", { phase: "answer" }),
          children: "Reveal Answer"
        }, undefined, false, undefined, this),
        phase === "answer" && /* @__PURE__ */ jsxDEV("div", {
          class: "card p-5 space-y-4 fade-in",
          children: [
            /* @__PURE__ */ jsxDEV("div", {
              children: [
                /* @__PURE__ */ jsxDEV("p", {
                  class: "text-xs text-content2 mb-2 uppercase tracking-wide",
                  children: "Answer"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV("p", {
                  class: "text-base leading-relaxed card-text",
                  children: card.answer
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            card.explanation && /* @__PURE__ */ jsxDEV("div", {
              class: "border-t border-base-200 pt-3",
              children: [
                /* @__PURE__ */ jsxDEV("p", {
                  class: "text-xs text-content2 mb-1 uppercase tracking-wide",
                  children: "Explanation"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV("p", {
                  class: "text-sm text-content2 leading-relaxed card-text",
                  children: card.explanation
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              class: "border-t border-base-200 pt-4 space-y-2",
              children: [
                /* @__PURE__ */ jsxDEV("p", {
                  class: "text-sm text-content2 mb-3",
                  children: "How well did you know this?"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV("div", {
                  class: "grid grid-cols-5 gap-2",
                  children: [1, 2, 3, 4, 5].map((score) => /* @__PURE__ */ jsxDEV("button", {
                    class: "btn btn-sm flex-col h-auto py-2 " + (score <= 2 ? "btn-error" : score === 3 ? "btn-warning" : "btn-success"),
                    onclick: () => {
                      updateCard(card.id, score);
                      session.results.push({ cardId: card.id, score });
                      if (isLast)
                        go("session_complete", { lastResults: session.results });
                      else {
                        session.index++;
                        go("session", { phase: "question" });
                      }
                    },
                    children: [
                      /* @__PURE__ */ jsxDEV("span", {
                        class: "font-bold text-base",
                        children: score
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV("span", {
                        class: "text-xs opacity-80",
                        children: ["", "Blank", "Wrong", "Hard", "Good", "Easy"][score]
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this))
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
function SessionComplete() {
  const results = ctx.lastResults ?? ctx.session?.results ?? [];
  const avg = results.length ? (results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1) : "—";
  const correct = results.filter((r) => r.score >= 4).length;
  return /* @__PURE__ */ jsxDEV("div", {
    class: "min-h-screen flex items-center justify-center",
    children: /* @__PURE__ */ jsxDEV("div", {
      class: "card p-8 text-center space-y-4 max-w-sm fade-in",
      children: [
        /* @__PURE__ */ jsxDEV("p", {
          class: "text-xl font-semibold",
          children: "Session Complete"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV("div", {
          class: "grid grid-cols-3 gap-3",
          children: [["Cards", results.length, "text-primary"], ["Correct", correct, "text-success"], ["Avg", avg, ""]].map(([l, v, cls]) => /* @__PURE__ */ jsxDEV("div", {
            children: [
              /* @__PURE__ */ jsxDEV("div", {
                class: "text-2xl font-bold " + cls,
                children: String(v)
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV("div", {
                class: "text-xs text-content2",
                children: l
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this))
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV("button", {
          class: "btn btn-primary w-full",
          onclick: () => go("dashboard"),
          children: "Back to Dashboard"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
function Stats() {
  const states = loadStates(), stats = getStats(CARDS);
  const byTopic = {};
  for (const c of CARDS) {
    if (!byTopic[c.topicId])
      byTopic[c.topicId] = { total: 0, due: 0, ef: 0 };
    const t = byTopic[c.topicId];
    const s = states[c.id] ?? defState();
    t.total++;
    t.ef += s.easeFactor;
    if (s.dueDate <= today())
      t.due++;
  }
  for (const t of Object.values(byTopic))
    t.ef = (t.ef / t.total).toFixed(2);
  const rows = Object.entries(byTopic).sort((a, b) => b[1].due - a[1].due);
  return /* @__PURE__ */ jsxDEV("div", {
    class: "min-h-screen bg-base-100",
    children: /* @__PURE__ */ jsxDEV("div", {
      class: "max-w-4xl mx-auto p-6 space-y-6 fade-in",
      children: [
        /* @__PURE__ */ jsxDEV("div", {
          class: "flex items-center gap-3",
          children: [
            /* @__PURE__ */ jsxDEV("button", {
              class: "btn btn-ghost btn-sm",
              onclick: () => go("dashboard"),
              children: "← Back"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("h2", {
              class: "text-xl font-bold",
              children: "Statistics"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsxDEV("div", {
          class: "grid grid-cols-2 sm:grid-cols-4 gap-3",
          children: [["Total", stats.total], ["Due", stats.due], ["Avg EF", stats.avgEF.toFixed(2)], ["Avg Score", stats.avgScore?.toFixed(1) ?? "—"]].map(([l, v]) => /* @__PURE__ */ jsxDEV("div", {
            class: "card p-4 text-center space-y-1",
            children: [
              /* @__PURE__ */ jsxDEV("div", {
                class: "text-2xl font-bold",
                children: String(v)
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV("div", {
                class: "text-xs text-content2 uppercase tracking-wide",
                children: l
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this))
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV("div", {
          class: "card overflow-hidden",
          children: /* @__PURE__ */ jsxDEV("table", {
            class: "table w-full text-sm",
            children: [
              /* @__PURE__ */ jsxDEV("thead", {
                children: /* @__PURE__ */ jsxDEV("tr", {
                  children: [
                    /* @__PURE__ */ jsxDEV("th", {
                      children: "Topic"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsxDEV("th", {
                      class: "text-right",
                      children: "Cards"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsxDEV("th", {
                      class: "text-right",
                      children: "Due"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsxDEV("th", {
                      class: "text-right",
                      children: "Avg EF"
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this)
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV("tbody", {
                children: rows.map(([tid, t]) => /* @__PURE__ */ jsxDEV("tr", {
                  children: [
                    /* @__PURE__ */ jsxDEV("td", {
                      class: "font-mono text-xs",
                      children: tid
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsxDEV("td", {
                      class: "text-right",
                      children: t.total
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsxDEV("td", {
                      class: "text-right " + (t.due > 0 ? "text-primary font-medium" : ""),
                      children: t.due
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsxDEV("td", {
                      class: "text-right",
                      children: t.ef
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this))
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
function Topics() {
  const byTopic = {};
  for (const c of CARDS)
    byTopic[c.topicId] = (byTopic[c.topicId] || 0) + 1;
  const topics = Object.entries(byTopic).sort((a, b) => b[1] - a[1]);
  return /* @__PURE__ */ jsxDEV("div", {
    class: "min-h-screen bg-base-100",
    children: /* @__PURE__ */ jsxDEV("div", {
      class: "max-w-4xl mx-auto p-6 space-y-6 fade-in",
      children: [
        /* @__PURE__ */ jsxDEV("div", {
          class: "flex items-center gap-3",
          children: [
            /* @__PURE__ */ jsxDEV("button", {
              class: "btn btn-ghost btn-sm",
              onclick: () => go("dashboard"),
              children: "← Back"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("h2", {
              class: "text-xl font-bold",
              children: [
                "Topics (",
                topics.length,
                ")"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsxDEV("div", {
          class: "grid grid-cols-2 sm:grid-cols-3 gap-2",
          children: topics.map(([tid, count]) => /* @__PURE__ */ jsxDEV("div", {
            class: "card p-3 flex items-center justify-between",
            children: [
              /* @__PURE__ */ jsxDEV("span", {
                class: "font-mono text-xs text-content2",
                children: tid
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV("span", {
                class: "badge badge-ghost badge-sm",
                children: count
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this))
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
function Config() {
  const cfg = loadCfg();
  let examEl, minsEl;
  return /* @__PURE__ */ jsxDEV("div", {
    class: "min-h-screen bg-base-100",
    children: /* @__PURE__ */ jsxDEV("div", {
      class: "max-w-xl mx-auto p-6 space-y-6 fade-in",
      children: [
        /* @__PURE__ */ jsxDEV("div", {
          class: "flex items-center gap-3",
          children: [
            /* @__PURE__ */ jsxDEV("button", {
              class: "btn btn-ghost btn-sm",
              onclick: () => go("dashboard"),
              children: "← Back"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("h2", {
              class: "text-xl font-bold",
              children: "Config"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsxDEV("div", {
          class: "card p-5 space-y-4",
          children: [
            /* @__PURE__ */ jsxDEV("div", {
              class: "space-y-1",
              children: [
                /* @__PURE__ */ jsxDEV("label", {
                  class: "text-sm text-content2 uppercase tracking-wide",
                  children: "Exam Date"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV("input", {
                  type: "date",
                  class: "input w-full",
                  value: cfg.examDate,
                  ref: (e) => examEl = e
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              class: "space-y-1",
              children: [
                /* @__PURE__ */ jsxDEV("label", {
                  class: "text-sm text-content2 uppercase tracking-wide",
                  children: "Daily Study Minutes"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV("input", {
                  type: "number",
                  class: "input w-full",
                  min: "10",
                  max: "360",
                  value: String(cfg.dailyStudyMinutes),
                  ref: (e) => minsEl = e
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV("div", {
              class: "flex gap-3 pt-2",
              children: [
                /* @__PURE__ */ jsxDEV("button", {
                  class: "btn btn-primary flex-1",
                  onclick: () => {
                    saveCfg({ ...cfg, examDate: examEl.value || cfg.examDate, dailyStudyMinutes: parseInt(minsEl.value) || cfg.dailyStudyMinutes });
                    go("dashboard");
                  },
                  children: "Save"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV("button", {
                  class: "btn btn-error btn-outline",
                  onclick: () => {
                    if (confirm("Reset all SRS progress? This cannot be undone.")) {
                      localStorage.removeItem(SK);
                      go("dashboard");
                    }
                  },
                  children: "Reset Progress"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsxDEV("div", {
          class: "card p-4 space-y-2",
          children: [
            /* @__PURE__ */ jsxDEV("p", {
              class: "text-sm font-medium",
              children: "Data Storage"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("p", {
              class: "text-xs text-content2",
              children: "All SRS progress is stored in your browser's localStorage. No account or server required."
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV("p", {
              class: "text-xs text-content2",
              children: [
                "Cards: ",
                CARDS.length,
                " loaded · States: ",
                Object.keys(loadStates()).length,
                " tracked"
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
function render() {
  const node = view === "loading" ? /* @__PURE__ */ jsxDEV(Loading, {}, undefined, false, undefined, this) : view === "session" || view === "session_complete" ? /* @__PURE__ */ jsxDEV(Session, {}, undefined, false, undefined, this) : view === "stats" ? /* @__PURE__ */ jsxDEV(Stats, {}, undefined, false, undefined, this) : view === "topics" ? /* @__PURE__ */ jsxDEV(Topics, {}, undefined, false, undefined, this) : view === "config" ? /* @__PURE__ */ jsxDEV(Config, {}, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV(Dashboard, {}, undefined, false, undefined, this);
  applyDiff(root, /* @__PURE__ */ jsxDEV("div", {
    class: "min-h-screen bg-base-100 text-base-content",
    children: node
  }, undefined, false, undefined, this));
}
render();
fetch("cards.json").then((r) => r.json()).then((cards) => {
  CARDS = cards;
  go("dashboard");
}).catch((err) => {
  applyDiff(root, /* @__PURE__ */ jsxDEV("div", {
    class: "flex items-center justify-center min-h-screen",
    children: /* @__PURE__ */ jsxDEV("div", {
      class: "card p-8 text-center space-y-4 max-w-sm",
      children: [
        /* @__PURE__ */ jsxDEV("p", {
          class: "text-error text-lg font-medium",
          children: "Failed to load cards"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV("p", {
          class: "text-content2 text-sm",
          children: err.message
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV("p", {
          class: "text-content3 text-xs",
          children: "Must be served over HTTP — not opened as a file://"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this));
});
