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
function createElement(type, props, ...children) {
  if (typeof type === "string") {
    const normalizedProps = props ? props : {};
    const flatChildren = flattenVNodes(children);
    if (flatChildren.length > 0) {
      if (!normalizedProps.dangerouslySetInnerHTML) {
        normalizedProps.children = flatChildren;
      } else {
        normalizedProps.children = [];
        console.warn("WebJSX: Ignoring children since dangerouslySetInnerHTML is set.");
      }
    } else {
      normalizedProps.children = [];
    }
    const result = {
      type,
      tagName: KNOWN_ELEMENTS.get(type) ?? type.toUpperCase(),
      props: normalizedProps ?? {}
    };
    return result;
  } else {
    return flattenVNodes(children);
  }
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
var loadCfg = () => ({ examDate: "2026-06-15", dailyStudyMinutes: 60, newCardsPerDay: 0, targetGrade: "pass", ...JSON.parse(localStorage.getItem(CK) || "{}") });
var saveCfg = (c) => localStorage.setItem(CK, JSON.stringify(c));
var daysLeft = (cfg) => cfg.examDate ? Math.max(0, Math.ceil((new Date(cfg.examDate) - new Date) / 86400000)) : 999;
var isSeen = (states, id) => !!states[id]?.lastScore;
var isReviewDue = (states, id) => isSeen(states, id) && states[id].dueDate <= today();
function calcNewPerDay(cards, states, cfg) {
  const unseen = cards.filter((c) => !isSeen(states, c.id)).length;
  const dr = daysLeft(cfg);
  const deadline = Math.max(1, dr - 14);
  const auto = Math.ceil(unseen / deadline);
  const perDay = cfg.newCardsPerDay > 0 ? cfg.newCardsPerDay : auto;
  return { perDay, auto, unseen, deadline };
}
function getNewCardsToday(cards, states, cfg) {
  const { perDay } = calcNewPerDay(cards, states, cfg);
  const t = today();
  const introducedToday = cards.filter((c) => states[c.id]?.introducedOn === t).length;
  const remaining = Math.max(0, perDay - introducedToday);
  return cards.filter((c) => !isSeen(states, c.id) && !states[c.id]?.introducedOn).slice(0, remaining);
}
function getDue(cards) {
  const s = loadStates(), cfg = loadCfg();
  const reviews = cards.filter((c) => isReviewDue(s, c.id));
  const newCards = getNewCardsToday(cards, s, cfg);
  return [...reviews, ...newCards];
}
function updateCard(id, score) {
  const states = loadStates();
  const prev = states[id] ?? defState();
  const next = calcSM2(prev, score);
  states[id] = { ...next, dueDate: addDays(next.interval), lastScore: score, introducedOn: prev.introducedOn || today() };
  saveStates(states);
}
function getStats(cards) {
  const states = loadStates(), cfg = loadCfg(), t = today();
  const seen = cards.filter((c) => isSeen(states, c.id));
  const unseen = cards.filter((c) => !isSeen(states, c.id));
  const reviews = cards.filter((c) => isReviewDue(states, c.id));
  const newToday = getNewCardsToday(cards, states, cfg);
  const due = reviews.length + newToday.length;
  const avgEF = seen.length ? seen.reduce((s, c) => s + (states[c.id]?.easeFactor ?? 2.5), 0) / seen.length : 0;
  const scored = cards.filter((c) => states[c.id]?.lastScore != null);
  const avgScore = scored.length ? scored.reduce((s, c) => s + states[c.id].lastScore, 0) / scored.length : null;
  return { total: cards.length, due, reviews: reviews.length, newToday: newToday.length, seen: seen.length, unseen: unseen.length, avgEF, avgScore };
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
var bloomClass = (b) => b === "recall" ? "bloom-recall" : b === "apply" ? "bloom-apply" : "bloom-analyze";
var bloomLabel = (b) => b ?? "recall";
function Loading() {
  return /* @__PURE__ */ createElement("div", {
    class: "shell",
    style: "display:flex;align-items:center;justify-content:center;min-height:100vh;"
  }, /* @__PURE__ */ createElement("div", {
    style: "text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px;"
  }, /* @__PURE__ */ createElement("div", {
    class: "spinner"
  }), /* @__PURE__ */ createElement("p", {
    style: "color:var(--text2);font-size:0.875rem;"
  }, "Loading cards…")));
}
function Dashboard() {
  const cfg = loadCfg(), stats = getStats(CARDS), dr = daysLeft(cfg);
  const gp = Math.round(Math.max(0, Math.min(100, (stats.avgEF - 1.3) / (2.5 - 1.3) * 100)));
  const pct = (v) => Math.round(Math.max(0, Math.min(100, (v - 1.3) / (2.5 - 1.3) * 100)));
  const grades = [["Fail", "1.3", pct(1.3)], ["Pass", "2.0", pct(2)], ["Honours", "2.5", pct(2.5)]];
  return /* @__PURE__ */ createElement("div", {
    class: "shell fade-in"
  }, /* @__PURE__ */ createElement("div", {
    class: "page"
  }, /* @__PURE__ */ createElement("div", {
    class: "nav"
  }, /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("div", {
    class: "title"
  }, "MCCQE1 SRS"), /* @__PURE__ */ createElement("div", {
    class: "subtitle"
  }, "Spaced Repetition · Canadian Medical Licensing")), /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    onclick: () => render(),
    title: "Refresh"
  }, /* @__PURE__ */ createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2.5"
  }, /* @__PURE__ */ createElement("path", {
    d: "M1 4v6h6"
  }), /* @__PURE__ */ createElement("path", {
    d: "M23 20v-6h-6"
  }), /* @__PURE__ */ createElement("path", {
    d: "M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
  })), "Refresh")), /* @__PURE__ */ createElement("div", {
    class: "stat-grid",
    style: "margin-bottom:20px;"
  }, [
    { key: "Reviews Due", val: stats.reviews, hi: stats.reviews > 0 },
    { key: "New Today", val: stats.newToday, hi: stats.newToday > 0 },
    { key: "Learned", val: stats.seen.toLocaleString() + " / " + stats.total.toLocaleString(), hi: false },
    { key: "Days Left", val: dr, hi: dr <= 14 }
  ].map(({ key, val, hi }) => /* @__PURE__ */ createElement("div", {
    class: "stat-tile" + (hi ? " hi" : "")
  }, /* @__PURE__ */ createElement("div", {
    class: "val"
  }, String(val)), /* @__PURE__ */ createElement("div", {
    class: "key"
  }, key)))), /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1.25rem 1.5rem;margin-bottom:20px;"
  }, /* @__PURE__ */ createElement("div", {
    style: "display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px;"
  }, /* @__PURE__ */ createElement("span", {
    style: "font-weight:600;font-size:0.9375rem;"
  }, "Grade Progress"), /* @__PURE__ */ createElement("span", {
    style: "font-size:0.8125rem;color:var(--text2);"
  }, "EF ", stats.avgEF.toFixed(2), " / 2.50")), /* @__PURE__ */ createElement("div", {
    class: "prog-track",
    style: "margin-bottom:10px;"
  }, /* @__PURE__ */ createElement("div", {
    class: "prog-fill",
    style: "width:" + Math.max(gp, 1) + "%"
  })), /* @__PURE__ */ createElement("div", {
    style: "display:flex;justify-content:space-between;"
  }, grades.map(([label, val, pos]) => /* @__PURE__ */ createElement("div", {
    style: "text-align:center;"
  }, /* @__PURE__ */ createElement("div", {
    style: "font-size:0.75rem;font-weight:600;color:var(--text2);"
  }, val), /* @__PURE__ */ createElement("div", {
    style: "font-size:0.6875rem;color:" + (pos <= gp ? "var(--accent)" : "var(--text3)") + ";text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;"
  }, label))))), cfg.examDate && /* @__PURE__ */ createElement("div", {
    style: "display:flex;align-items:center;gap:10px;margin-bottom:20px;padding:12px 16px;background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.15);border-radius:12px;"
  }, /* @__PURE__ */ createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--accent)",
    "stroke-width": "2"
  }, /* @__PURE__ */ createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2"
  }), /* @__PURE__ */ createElement("line", {
    x1: "16",
    y1: "2",
    x2: "16",
    y2: "6"
  }), /* @__PURE__ */ createElement("line", {
    x1: "8",
    y1: "2",
    x2: "8",
    y2: "6"
  }), /* @__PURE__ */ createElement("line", {
    x1: "3",
    y1: "10",
    x2: "21",
    y2: "10"
  })), /* @__PURE__ */ createElement("span", {
    style: "font-size:0.8125rem;color:var(--text2);"
  }, "Exam ", /* @__PURE__ */ createElement("strong", {
    style: "color:var(--text1);"
  }, cfg.examDate), " — ", /* @__PURE__ */ createElement("strong", {
    style: "color:var(--accent);"
  }, dr, " days"), " remaining")), /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1.25rem;margin-bottom:16px;"
  }, /* @__PURE__ */ createElement("div", {
    class: "label-xs",
    style: "margin-bottom:12px;"
  }, "Today's Study"), /* @__PURE__ */ createElement("div", {
    style: "display:flex;flex-direction:column;gap:8px;"
  }, /* @__PURE__ */ createElement("button", {
    class: "btn-study" + (stats.due === 0 ? " disabled" : ""),
    style: "width:100%;justify-content:center;min-height:48px;",
    onclick: () => stats.due > 0 && go("prompt")
  }, stats.due > 0 ? `Step 1: Send ${stats.reviews} reviews + ${stats.newToday} new to ChatGPT` : "All Caught Up for Today"), /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    style: "width:100%;justify-content:center;padding:0.75rem;min-height:48px;",
    onclick: () => go("assess")
  }, "Step 2: Import Scores from Session"))), cfg.lastSessionDate && /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1rem;margin-bottom:16px;"
  }, /* @__PURE__ */ createElement("div", {
    class: "label-xs",
    style: "margin-bottom:8px;"
  }, "Last Session — ", cfg.lastSessionDate), /* @__PURE__ */ createElement("div", {
    style: "font-size:0.8125rem;line-height:1.6;"
  }, cfg.lastWeakAreas && /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("span", {
    style: "color:var(--danger);font-weight:600;"
  }, "Weak: "), /* @__PURE__ */ createElement("span", {
    style: "color:var(--text2);"
  }, cfg.lastWeakAreas)), cfg.lastStrongAreas && /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("span", {
    style: "color:var(--success);font-weight:600;"
  }, "Strong: "), /* @__PURE__ */ createElement("span", {
    style: "color:var(--text2);"
  }, cfg.lastStrongAreas)), cfg.lastRecommendation && /* @__PURE__ */ createElement("div", {
    style: "margin-top:4px;"
  }, /* @__PURE__ */ createElement("span", {
    style: "color:var(--accent);font-weight:600;"
  }, "Focus: "), /* @__PURE__ */ createElement("span", {
    style: "color:var(--text2);"
  }, cfg.lastRecommendation)))), /* @__PURE__ */ createElement("div", {
    style: "display:flex;flex-wrap:wrap;gap:8px;align-items:center;"
  }, /* @__PURE__ */ createElement("button", {
    class: "btn-ghost" + (stats.due === 0 ? " disabled" : ""),
    onclick: () => stats.due > 0 && startSession()
  }, "Quick Study (in-app cards)"), /* @__PURE__ */ createElement("div", {
    style: "display:flex;gap:8px;margin-left:auto;"
  }, [["Stats", "stats"], ["Topics", "topics"], ["Config", "config"]].map(([l, v]) => /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    onclick: () => go(v)
  }, l))))));
}
function startSession() {
  const due = getDue(CARDS);
  ctx = { session: { cards: due, index: 0, results: [] }, phase: "question" };
  go("session");
}
function Session() {
  const { session, phase } = ctx;
  const card = session.cards[session.index];
  const progress = session.cards.length ? Math.round(session.index / session.cards.length * 100) : 0;
  const isLast = session.index >= session.cards.length - 1;
  if (!card)
    return SessionComplete();
  const scoreLabels = ["", "Blank", "Wrong", "Hard", "Good", "Easy"];
  const scoreCls = ["", "s1", "s2", "s3", "s4", "s5"];
  return /* @__PURE__ */ createElement("div", {
    class: "shell fade-in"
  }, /* @__PURE__ */ createElement("div", {
    class: "page"
  }, /* @__PURE__ */ createElement("div", {
    style: "display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;"
  }, /* @__PURE__ */ createElement("div", {
    style: "display:flex;align-items:center;gap:12px;"
  }, /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    onclick: () => go("dashboard")
  }, /* @__PURE__ */ createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2.5"
  }, /* @__PURE__ */ createElement("line", {
    x1: "19",
    y1: "12",
    x2: "5",
    y2: "12"
  }), /* @__PURE__ */ createElement("polyline", {
    points: "12 19 5 12 12 5"
  })), "Exit"), /* @__PURE__ */ createElement("span", {
    style: "font-size:0.8125rem;color:var(--text2);"
  }, session.index + 1, " ", /* @__PURE__ */ createElement("span", {
    style: "color:var(--text3);"
  }, "/ ", session.cards.length))), /* @__PURE__ */ createElement("span", {
    style: "font-size:0.8125rem;color:var(--text2);font-weight:600;"
  }, progress, "%")), /* @__PURE__ */ createElement("div", {
    class: "prog-track thin",
    style: "margin-bottom:24px;"
  }, /* @__PURE__ */ createElement("div", {
    class: "prog-fill",
    style: "width:" + Math.max(progress, 0.5) + "%"
  })), /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1.5rem;margin-bottom:16px;"
  }, /* @__PURE__ */ createElement("div", {
    style: "display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:16px;"
  }, /* @__PURE__ */ createElement("span", {
    class: "badge-topic"
  }, card.topicId), /* @__PURE__ */ createElement("span", {
    class: "badge-bloom " + bloomClass(card.bloomLevel)
  }, bloomLabel(card.bloomLevel)), card.difficulty && /* @__PURE__ */ createElement("span", {
    style: "font-size:0.6875rem;color:var(--text3);margin-left:4px;"
  }, "★".repeat(card.difficulty) + "☆".repeat(5 - card.difficulty))), /* @__PURE__ */ createElement("p", {
    class: "card-question"
  }, card.question)), phase === "question" && /* @__PURE__ */ createElement("button", {
    class: "btn-reveal",
    onclick: () => go("session", { phase: "answer" })
  }, "Reveal Answer"), phase === "answer" && /* @__PURE__ */ createElement("div", {
    class: "gcard-inner fade-in",
    style: "padding:1.25rem;"
  }, /* @__PURE__ */ createElement("div", {
    style: "margin-bottom:1rem;"
  }, /* @__PURE__ */ createElement("div", {
    class: "label-xs",
    style: "margin-bottom:8px;"
  }, "Answer"), /* @__PURE__ */ createElement("p", {
    class: "card-answer"
  }, card.answer)), card.explanation && /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("div", {
    class: "divider"
  }), /* @__PURE__ */ createElement("div", {
    class: "label-xs",
    style: "margin-bottom:8px;"
  }, "Explanation"), /* @__PURE__ */ createElement("p", {
    class: "card-explain"
  }, card.explanation)), /* @__PURE__ */ createElement("div", {
    class: "divider"
  }), /* @__PURE__ */ createElement("div", {
    class: "label-xs",
    style: "margin-bottom:10px;"
  }, "How well did you know this?"), /* @__PURE__ */ createElement("div", {
    class: "score-grid"
  }, [1, 2, 3, 4, 5].map((score) => /* @__PURE__ */ createElement("button", {
    class: "score-btn " + scoreCls[score],
    onclick: () => {
      updateCard(card.id, score);
      session.results.push({ cardId: card.id, score });
      if (isLast)
        go("session_complete", { lastResults: [...session.results] });
      else {
        session.index++;
        go("session", { phase: "question" });
      }
    }
  }, /* @__PURE__ */ createElement("span", {
    class: "num"
  }, score), /* @__PURE__ */ createElement("span", {
    class: "lbl"
  }, scoreLabels[score])))))));
}
function SessionComplete() {
  const results = ctx.lastResults ?? ctx.session?.results ?? [];
  const avg = results.length ? (results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1) : "—";
  const correct = results.filter((r) => r.score >= 4).length;
  const pct = results.length ? Math.round(correct / results.length * 100) : 0;
  return /* @__PURE__ */ createElement("div", {
    class: "shell",
    style: "display:flex;align-items:center;justify-content:center;min-height:100vh;"
  }, /* @__PURE__ */ createElement("div", {
    class: "gcard fade-in",
    style: "padding:2.5rem;max-width:400px;width:100%;text-align:center;"
  }, /* @__PURE__ */ createElement("div", {
    style: "font-size:2.5rem;margin-bottom:12px;"
  }, "\uD83C\uDF89"), /* @__PURE__ */ createElement("div", {
    style: "font-size:1.375rem;font-weight:700;margin-bottom:6px;"
  }, "Session Complete"), /* @__PURE__ */ createElement("div", {
    style: "font-size:0.875rem;color:var(--text2);margin-bottom:1.75rem;"
  }, pct, "% correct — great work"), /* @__PURE__ */ createElement("div", {
    class: "complete-grid"
  }, /* @__PURE__ */ createElement("div", {
    class: "complete-stat"
  }, /* @__PURE__ */ createElement("div", {
    class: "v",
    style: "color:var(--accent);"
  }, results.length), /* @__PURE__ */ createElement("div", {
    class: "k"
  }, "Cards")), /* @__PURE__ */ createElement("div", {
    class: "complete-stat"
  }, /* @__PURE__ */ createElement("div", {
    class: "v",
    style: "color:var(--success);"
  }, correct), /* @__PURE__ */ createElement("div", {
    class: "k"
  }, "Correct")), /* @__PURE__ */ createElement("div", {
    class: "complete-stat"
  }, /* @__PURE__ */ createElement("div", {
    class: "v"
  }, avg), /* @__PURE__ */ createElement("div", {
    class: "k"
  }, "Avg Score"))), /* @__PURE__ */ createElement("button", {
    class: "btn-study",
    style: "width:100%;justify-content:center;",
    onclick: () => go("dashboard")
  }, "Back to Dashboard")));
}
function Stats() {
  const states = loadStates(), stats = getStats(CARDS);
  const byTopic = {};
  for (const c of CARDS) {
    if (!byTopic[c.topicId])
      byTopic[c.topicId] = { total: 0, seen: 0, due: 0, ef: 0 };
    const t = byTopic[c.topicId];
    const seen = isSeen(states, c.id);
    t.total++;
    if (seen) {
      t.seen++;
      t.ef += states[c.id].easeFactor;
    }
    if (isReviewDue(states, c.id))
      t.due++;
  }
  for (const t of Object.values(byTopic))
    t.ef = t.seen > 0 ? (t.ef / t.seen).toFixed(2) : "—";
  const rows = Object.entries(byTopic).sort((a, b) => b[1].due - a[1].due);
  return /* @__PURE__ */ createElement("div", {
    class: "shell fade-in"
  }, /* @__PURE__ */ createElement("div", {
    class: "page-wide"
  }, /* @__PURE__ */ createElement("div", {
    class: "nav"
  }, /* @__PURE__ */ createElement("div", {
    style: "display:flex;align-items:center;gap:12px;"
  }, /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    onclick: () => go("dashboard")
  }, /* @__PURE__ */ createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2.5"
  }, /* @__PURE__ */ createElement("line", {
    x1: "19",
    y1: "12",
    x2: "5",
    y2: "12"
  }), /* @__PURE__ */ createElement("polyline", {
    points: "12 19 5 12 12 5"
  })), "Back"), /* @__PURE__ */ createElement("span", {
    class: "title",
    style: "font-size:1.25rem;"
  }, "Statistics"))), /* @__PURE__ */ createElement("div", {
    class: "stat-grid",
    style: "margin-bottom:24px;"
  }, [
    { k: "Total Cards", v: stats.total.toLocaleString() },
    { k: "Learned", v: stats.seen.toLocaleString() },
    { k: "Reviews Due", v: stats.reviews },
    { k: "Avg Score", v: stats.avgScore?.toFixed(1) ?? "—" }
  ].map(({ k, v }) => /* @__PURE__ */ createElement("div", {
    class: "stat-tile"
  }, /* @__PURE__ */ createElement("div", {
    class: "val"
  }, String(v)), /* @__PURE__ */ createElement("div", {
    class: "key"
  }, k)))), /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "overflow:hidden;"
  }, /* @__PURE__ */ createElement("table", {
    class: "data-table"
  }, /* @__PURE__ */ createElement("thead", null, /* @__PURE__ */ createElement("tr", null, /* @__PURE__ */ createElement("th", null, "Topic"), /* @__PURE__ */ createElement("th", {
    class: "r"
  }, "Cards"), /* @__PURE__ */ createElement("th", {
    class: "r"
  }, "Learned"), /* @__PURE__ */ createElement("th", {
    class: "r"
  }, "Review"), /* @__PURE__ */ createElement("th", {
    class: "r"
  }, "Avg EF"))), /* @__PURE__ */ createElement("tbody", null, rows.map(([tid, t]) => /* @__PURE__ */ createElement("tr", null, /* @__PURE__ */ createElement("td", {
    style: "font-family:'SF Mono','Fira Code',monospace;font-size:0.8125rem;color:var(--text2);"
  }, tid), /* @__PURE__ */ createElement("td", {
    class: "r",
    style: "color:var(--text2);"
  }, t.total), /* @__PURE__ */ createElement("td", {
    class: "r",
    style: "color:var(--text3);"
  }, t.seen), /* @__PURE__ */ createElement("td", {
    class: "r",
    style: t.due > 0 ? "color:var(--accent);font-weight:600;" : "color:var(--text3);"
  }, t.due), /* @__PURE__ */ createElement("td", {
    class: "r",
    style: "color:var(--text3);"
  }, t.ef))))))));
}
function Topics() {
  const byTopic = {};
  for (const c of CARDS)
    byTopic[c.topicId] = (byTopic[c.topicId] || 0) + 1;
  const topics = Object.entries(byTopic).sort((a, b) => b[1] - a[1]);
  return /* @__PURE__ */ createElement("div", {
    class: "shell fade-in"
  }, /* @__PURE__ */ createElement("div", {
    class: "page-wide"
  }, /* @__PURE__ */ createElement("div", {
    class: "nav"
  }, /* @__PURE__ */ createElement("div", {
    style: "display:flex;align-items:center;gap:12px;"
  }, /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    onclick: () => go("dashboard")
  }, /* @__PURE__ */ createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2.5"
  }, /* @__PURE__ */ createElement("line", {
    x1: "19",
    y1: "12",
    x2: "5",
    y2: "12"
  }), /* @__PURE__ */ createElement("polyline", {
    points: "12 19 5 12 12 5"
  })), "Back"), /* @__PURE__ */ createElement("span", {
    class: "title",
    style: "font-size:1.25rem;"
  }, "Topics ", /* @__PURE__ */ createElement("span", {
    style: "color:var(--text3);font-size:0.875rem;font-weight:400;"
  }, "(", topics.length, ")")))), /* @__PURE__ */ createElement("div", {
    class: "topic-grid"
  }, topics.map(([tid, count]) => /* @__PURE__ */ createElement("div", {
    class: "topic-chip"
  }, /* @__PURE__ */ createElement("span", {
    class: "tid"
  }, tid), /* @__PURE__ */ createElement("span", {
    class: "cnt"
  }, count))))));
}
function Config() {
  const cfg = loadCfg();
  let examEl, minsEl, newEl;
  return /* @__PURE__ */ createElement("div", {
    class: "shell fade-in"
  }, /* @__PURE__ */ createElement("div", {
    class: "page",
    style: "max-width:520px;"
  }, /* @__PURE__ */ createElement("div", {
    class: "nav"
  }, /* @__PURE__ */ createElement("div", {
    style: "display:flex;align-items:center;gap:12px;"
  }, /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    onclick: () => go("dashboard")
  }, /* @__PURE__ */ createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2.5"
  }, /* @__PURE__ */ createElement("line", {
    x1: "19",
    y1: "12",
    x2: "5",
    y2: "12"
  }), /* @__PURE__ */ createElement("polyline", {
    points: "12 19 5 12 12 5"
  })), "Back"), /* @__PURE__ */ createElement("span", {
    class: "title",
    style: "font-size:1.25rem;"
  }, "Settings"))), /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1.5rem;margin-bottom:16px;"
  }, /* @__PURE__ */ createElement("div", {
    style: "display:flex;flex-direction:column;gap:16px;"
  }, /* @__PURE__ */ createElement("div", {
    class: "field"
  }, /* @__PURE__ */ createElement("label", null, "Exam Date"), /* @__PURE__ */ createElement("input", {
    type: "date",
    value: cfg.examDate,
    ref: (e) => examEl = e
  })), /* @__PURE__ */ createElement("div", {
    class: "field"
  }, /* @__PURE__ */ createElement("label", null, "New Cards Per Day ", /* @__PURE__ */ createElement("span", {
    style: "font-weight:400;color:var(--text3);"
  }, "(0 = auto from deadline)")), /* @__PURE__ */ createElement("input", {
    type: "number",
    min: "0",
    max: "500",
    value: String(cfg.newCardsPerDay),
    ref: (e) => newEl = e
  })), /* @__PURE__ */ createElement("div", {
    class: "field"
  }, /* @__PURE__ */ createElement("label", null, "Daily Study Minutes"), /* @__PURE__ */ createElement("input", {
    type: "number",
    min: "10",
    max: "360",
    value: String(cfg.dailyStudyMinutes),
    ref: (e) => minsEl = e
  }))), /* @__PURE__ */ createElement("div", {
    style: "display:flex;gap:10px;margin-top:20px;"
  }, /* @__PURE__ */ createElement("button", {
    class: "btn-study",
    style: "flex:1;justify-content:center;padding:0.75rem;",
    onclick: () => {
      saveCfg({ ...cfg, examDate: examEl.value || cfg.examDate, newCardsPerDay: parseInt(newEl.value) || cfg.newCardsPerDay, dailyStudyMinutes: parseInt(minsEl.value) || cfg.dailyStudyMinutes });
      go("dashboard");
    }
  }, "Save Settings"), /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    style: "color:#f87171;border-color:rgba(239,68,68,0.25);",
    onclick: () => {
      if (confirm("Reset all SRS progress? This cannot be undone.")) {
        localStorage.removeItem(SK);
        go("dashboard");
      }
    }
  }, "Reset"))), /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1.25rem;"
  }, /* @__PURE__ */ createElement("div", {
    style: "font-size:0.8125rem;font-weight:600;margin-bottom:8px;"
  }, "Data Storage"), /* @__PURE__ */ createElement("div", {
    style: "font-size:0.8125rem;color:var(--text2);line-height:1.6;margin-bottom:10px;"
  }, "All SRS progress is stored in your browser's localStorage. No account or server required. Your data never leaves your device."), /* @__PURE__ */ createElement("div", {
    style: "display:flex;gap:16px;"
  }, /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("div", {
    style: "font-size:1.125rem;font-weight:700;"
  }, CARDS.length.toLocaleString()), /* @__PURE__ */ createElement("div", {
    class: "label-xs"
  }, "Cards loaded")), /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("div", {
    style: "font-size:1.125rem;font-weight:700;"
  }, Object.keys(loadStates()).length.toLocaleString()), /* @__PURE__ */ createElement("div", {
    class: "label-xs"
  }, "States tracked"))))));
}
var SESSION_SIZE = 25;
function buildPrompt(cards, cfg, sessionIndex = 0) {
  const states = loadStates();
  const due = getDue(cards);
  const dr = daysLeft(cfg);
  const { perDay, auto } = calcNewPerDay(cards, states, cfg);
  const reviews = due.filter((c) => isSeen(states, c.id));
  const newCards = due.filter((c) => !isSeen(states, c.id));
  const totalSessions = Math.ceil(due.length / SESSION_SIZE);
  const sessionCards = due.slice(sessionIndex * SESSION_SIZE, (sessionIndex + 1) * SESSION_SIZE);
  const byTopic = {};
  sessionCards.forEach((c) => {
    const t = c.topicId || c.tags?.[0] || "general";
    byTopic[t] = byTopic[t] || [];
    byTopic[t].push(c);
  });
  const topicSummary = Object.entries(byTopic).map(([t, cs]) => `- ${t}: ${cs.length} cards`).join(`
`);
  const cardsJson = JSON.stringify(sessionCards.map((c) => ({ id: c.id, question: c.question, answer: c.answer, difficulty: c.difficulty, tags: c.tags, bloomLevel: c.bloomLevel, explanation: c.explanation })), null, 2);
  return `# MCCQE1 Study Session ${sessionIndex + 1} of ${totalSessions} today

You are an expert medical education tutor preparing a student for the MCCQE Part 1 exam on ${cfg.examDate}. There are ${dr} days remaining. The student must master ${cards.length.toLocaleString()} flashcards total, doing ~${perDay} new cards/day to finish on time.

## This Session: ${sessionCards.length} cards (session ${sessionIndex + 1}/${totalSessions} for today — ${due.length} total due)

### Topics Today
${topicSummary}

## Your Teaching Approach

### Phase 1: Knowledge Discovery (first 5-10 minutes)
Before teaching anything, PROBE the student's existing knowledge on today's topics:
- Ask open-ended questions: "What do you know about [topic]?" or "Walk me through how you'd approach a patient with [symptom]"
- Listen for misconceptions, gaps, and strengths
- Identify their baseline for each topic area
- Note which concepts they can explain vs. which they only recognize

### Phase 2: Conversational Teaching (main session)
For each card/topic cluster, use this Socratic progression:

1. **Anchor** — Connect to something they already know: "You mentioned X earlier — this builds on that..."
2. **Probe** — Ask them the card question conversationally (don't just read it). Let them reason through it.
3. **If correct** — Deepen: ask WHY, ask for the mechanism, ask what would change if a variable shifted. Cement all the factors that affect this concept.
4. **If wrong/uncertain** — Teach comprehensively:
   - Explain the core concept in 2-3 clear sentences
   - Give the mechanism/pathophysiology
   - Provide a clinical scenario that illustrates it
   - Explain the key differentiating factors from similar conditions
   - Connect it to related concepts they'll see on the exam
5. **Cement** — After teaching, re-test with a slightly different angle to confirm understanding

### Phase 3: Integration & Wrap-up
- Connect today's topics across systems (e.g., how a renal condition affects cardiac management)
- Give 2-3 "exam-day tips" for today's weak areas
- Summarize what they nailed and what needs review

## Pacing Rules
- Spend more time on topics where the student shows gaps
- If they ace a topic quickly, move on — don't belabor strong areas
- For new cards, teach thoroughly. For review cards, test quickly and only re-teach if they've forgotten.
- Target: finish all ${sessionCards.length} cards within 45-60 minutes

## Today's Cards (JSON)

Each card has: id, question, answer, difficulty (1-5), tags, bloomLevel (recall/apply/analyze), explanation.

\`\`\`json
${cardsJson}
\`\`\`

## End-of-Session Output

When the session is complete (all cards covered OR student ends early), your FINAL message must contain ONLY the output block below — no other text, no commentary, no summary. This makes it easy for the student to copy your entire last message and paste it into their app.

Tell the student: "We're done — copy my next message and paste it into your SRS app." Then send a new message containing ONLY this:

<!-- SRS_SCORES -->
card-id: score
card-id: score
(one line per card, exact IDs from the JSON above)
<!-- SRS_META -->
weakAreas: topic1, topic2
strongAreas: topic3, topic4
avgScore: 3.5
recommendation: one-line focus for next session
difficulty: increase|maintain|decrease

Scoring guide:
- 5 = instant correct, high confidence
- 4 = correct with minor hesitation
- 3 = got it after a hint
- 2 = partially correct, needed help
- 1 = didn't know, had to be taught

Include ALL ${sessionCards.length} cards. Score un-reached cards as 1. The entire message must be ONLY the block above — no prose, no markdown, no explanation. The student's app will parse it automatically.

## Begin

Start by greeting the student and asking what they remember about today's topics. Discover their knowledge first, then teach conversationally.`;
}
function Prompt() {
  const cfg = loadCfg(), due = getDue(CARDS);
  const states = loadStates();
  const dr = daysLeft(cfg);
  const { perDay } = calcNewPerDay(CARDS, states, cfg);
  const reviews = due.filter((c) => isSeen(states, c.id));
  const newCards = due.filter((c) => !isSeen(states, c.id));
  const totalSessions = Math.ceil(due.length / SESSION_SIZE);
  const sessionIdx = ctx.sessionIdx || 0;
  const filled = buildPrompt(CARDS, cfg, sessionIdx);
  return /* @__PURE__ */ createElement("div", {
    class: "shell fade-in"
  }, /* @__PURE__ */ createElement("div", {
    class: "page"
  }, /* @__PURE__ */ createElement("div", {
    class: "nav"
  }, /* @__PURE__ */ createElement("div", {
    style: "display:flex;align-items:center;gap:12px;"
  }, /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    onclick: () => go("dashboard")
  }, /* @__PURE__ */ createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2.5"
  }, /* @__PURE__ */ createElement("line", {
    x1: "19",
    y1: "12",
    x2: "5",
    y2: "12"
  }), /* @__PURE__ */ createElement("polyline", {
    points: "12 19 5 12 12 5"
  })), "Back"), /* @__PURE__ */ createElement("span", {
    class: "title",
    style: "font-size:1.25rem;"
  }, "Daily Prompt")), /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    onclick: () => go("dashboard")
  }, "Dashboard")), /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1rem;margin-bottom:16px;"
  }, /* @__PURE__ */ createElement("div", {
    style: "display:flex;flex-wrap:wrap;gap:16px;"
  }, /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("div", {
    class: "label-xs"
  }, "Today's Load"), /* @__PURE__ */ createElement("div", {
    style: "font-size:1.25rem;font-weight:700;"
  }, due.length, " cards")), /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("div", {
    class: "label-xs"
  }, "Sessions"), /* @__PURE__ */ createElement("div", {
    style: "font-size:1.25rem;font-weight:700;"
  }, totalSessions, " × ", SESSION_SIZE)), /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("div", {
    class: "label-xs"
  }, "Days to Exam"), /* @__PURE__ */ createElement("div", {
    style: "font-size:1.25rem;font-weight:700;"
  }, dr)), /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("div", {
    class: "label-xs"
  }, "Pace"), /* @__PURE__ */ createElement("div", {
    style: "font-size:1.25rem;font-weight:700;"
  }, perDay, " new/day"))), /* @__PURE__ */ createElement("div", {
    style: "font-size:0.75rem;color:var(--text3);margin-top:8px;"
  }, calcNewPerDay(CARDS, states, cfg).unseen.toLocaleString(), " unseen of ", CARDS.length.toLocaleString(), " · ", calcNewPerDay(CARDS, states, cfg).deadline, " study days · ", reviews.length, " reviews + ", newCards.length, " new today")), /* @__PURE__ */ createElement("div", {
    style: "display:flex;align-items:center;gap:10px;margin-bottom:16px;"
  }, /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    style: sessionIdx === 0 ? "opacity:0.3;pointer-events:none;" : "",
    onclick: () => {
      ctx.sessionIdx = sessionIdx - 1;
      ctx.copied = false;
      render();
    }
  }, "← Prev"), /* @__PURE__ */ createElement("div", {
    style: "flex:1;text-align:center;"
  }, /* @__PURE__ */ createElement("span", {
    style: "font-size:0.9375rem;font-weight:600;"
  }, "Session ", sessionIdx + 1, " of ", totalSessions), /* @__PURE__ */ createElement("span", {
    style: "font-size:0.75rem;color:var(--text3);margin-left:8px;"
  }, "(", Math.min(SESSION_SIZE, due.length - sessionIdx * SESSION_SIZE), " cards)")), /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    style: sessionIdx >= totalSessions - 1 ? "opacity:0.3;pointer-events:none;" : "",
    onclick: () => {
      ctx.sessionIdx = sessionIdx + 1;
      ctx.copied = false;
      render();
    }
  }, "Next →")), /* @__PURE__ */ createElement("div", {
    style: "display:flex;gap:10px;margin-bottom:16px;"
  }, /* @__PURE__ */ createElement("button", {
    class: "btn-study",
    style: "flex:1;justify-content:center;padding:0.75rem;",
    onclick: () => {
      if (navigator.share) {
        navigator.share({ text: filled }).then(() => {
          ctx.copied = true;
          render();
        }).catch(() => {
          navigator.clipboard.writeText(filled);
          ctx.copied = true;
          render();
        });
      } else {
        navigator.clipboard.writeText(filled).then(() => {
          ctx.copied = true;
          render();
          window.open("https://chatgpt.com/", "_blank");
        });
      }
    }
  }, ctx.copied ? "✓ Copied — paste into ChatGPT!" : "Copy & Open ChatGPT")), /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1rem;margin-bottom:16px;"
  }, /* @__PURE__ */ createElement("div", {
    class: "label-xs",
    style: "margin-bottom:6px;"
  }, "How it works"), /* @__PURE__ */ createElement("ol", {
    style: "font-size:0.8125rem;color:var(--text2);line-height:1.7;margin:0;padding-left:1.25rem;"
  }, /* @__PURE__ */ createElement("li", null, /* @__PURE__ */ createElement("strong", null, "Send"), " the prompt to ChatGPT (share sheet on mobile, clipboard on desktop)"), /* @__PURE__ */ createElement("li", null, /* @__PURE__ */ createElement("strong", null, "Study"), " — the AI teaches and quizzes you on ", Math.min(SESSION_SIZE, due.length - sessionIdx * SESSION_SIZE), " cards"), /* @__PURE__ */ createElement("li", null, /* @__PURE__ */ createElement("strong", null, "Return here"), " → paste the scores ChatGPT gives you, or rate each card manually"))), /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1.25rem;"
  }, /* @__PURE__ */ createElement("div", {
    class: "label-xs",
    style: "margin-bottom:8px;"
  }, "Generated Prompt (paste into your AI)"), /* @__PURE__ */ createElement("pre", {
    style: "font-size:0.7rem;line-height:1.5;color:var(--text2);white-space:pre-wrap;word-break:break-word;max-height:500px;overflow-y:auto;"
  }, filled))));
}
function Assess() {
  const sessionIdx = ctx.assessSessionIdx || ctx.sessionIdx || 0;
  const due = getDue(CARDS);
  const sessionCards = due.slice(sessionIdx * SESSION_SIZE, (sessionIdx + 1) * SESSION_SIZE);
  const totalSessions = Math.ceil(due.length / SESSION_SIZE);
  if (!ctx.assessScores)
    ctx.assessScores = {};
  const scores = ctx.assessScores;
  const scored = sessionCards.filter((c) => scores[c.id] != null).length;
  const allScored = scored === sessionCards.length;
  const scoreLabels = ["", "Blank", "Wrong", "Hard", "Good", "Easy"];
  const scoreCls = ["", "s1", "s2", "s3", "s4", "s5"];
  const scoreColors = ["", "#f87171", "#fb923c", "#fbbf24", "#4ade80", "#60a5fa"];
  const parseMeta = (text) => {
    const meta = {};
    const metaMatch = text.match(/<!--\s*SRS_META\s*-->([\s\S]*?)(?:<!--|```|###|$)/i);
    if (!metaMatch)
      return meta;
    const lines = metaMatch[1].trim().split(`
`);
    for (const line of lines) {
      const m = line.match(/^(\w+)\s*:\s*(.+)/);
      if (m)
        meta[m[1]] = m[2].trim();
    }
    return meta;
  };
  const doSave = () => {
    const states = loadStates();
    sessionCards.forEach((c) => {
      const score = scores[c.id] ?? 1;
      const prev = states[c.id] || defState();
      const next = calcSM2(prev, score);
      states[c.id] = { ...next, dueDate: addDays(next.interval), lastScore: score, introducedOn: prev.introducedOn || today() };
    });
    saveStates(states);
    if (ctx.assessMeta) {
      const cfg = loadCfg();
      if (ctx.assessMeta.weakAreas)
        cfg.lastWeakAreas = ctx.assessMeta.weakAreas;
      if (ctx.assessMeta.strongAreas)
        cfg.lastStrongAreas = ctx.assessMeta.strongAreas;
      if (ctx.assessMeta.recommendation)
        cfg.lastRecommendation = ctx.assessMeta.recommendation;
      if (ctx.assessMeta.difficulty)
        cfg.lastDifficulty = ctx.assessMeta.difficulty;
      if (ctx.assessMeta.avgScore)
        cfg.lastAvgScore = ctx.assessMeta.avgScore;
      cfg.lastSessionDate = today();
      saveCfg(cfg);
    }
    ctx.assessSaved = true;
    render();
  };
  if (ctx.assessSaved) {
    const avg = sessionCards.length ? (sessionCards.reduce((s, c) => s + (scores[c.id] || 1), 0) / sessionCards.length).toFixed(1) : "0";
    const correct = sessionCards.filter((c) => (scores[c.id] || 0) >= 4).length;
    const meta = ctx.assessMeta;
    return /* @__PURE__ */ createElement("div", {
      class: "shell",
      style: "display:flex;align-items:center;justify-content:center;min-height:100vh;"
    }, /* @__PURE__ */ createElement("div", {
      class: "gcard fade-in",
      style: "padding:2.5rem;max-width:440px;width:100%;text-align:center;"
    }, /* @__PURE__ */ createElement("div", {
      style: "font-size:2.5rem;margin-bottom:12px;"
    }, "✓"), /* @__PURE__ */ createElement("div", {
      style: "font-size:1.375rem;font-weight:700;margin-bottom:6px;"
    }, "Session ", sessionIdx + 1, " Saved"), /* @__PURE__ */ createElement("div", {
      style: "font-size:0.875rem;color:var(--text2);margin-bottom:1rem;"
    }, correct, "/", sessionCards.length, " correct · avg ", avg, "/5"), meta && (meta.weakAreas || meta.recommendation) && /* @__PURE__ */ createElement("div", {
      style: "text-align:left;background:var(--bg-card2);border-radius:12px;padding:1rem;margin-bottom:1rem;font-size:0.8125rem;"
    }, meta.weakAreas && /* @__PURE__ */ createElement("div", {
      style: "margin-bottom:6px;"
    }, /* @__PURE__ */ createElement("span", {
      style: "color:var(--danger);font-weight:600;"
    }, "Weak: "), /* @__PURE__ */ createElement("span", {
      style: "color:var(--text2);"
    }, meta.weakAreas)), meta.strongAreas && /* @__PURE__ */ createElement("div", {
      style: "margin-bottom:6px;"
    }, /* @__PURE__ */ createElement("span", {
      style: "color:var(--success);font-weight:600;"
    }, "Strong: "), /* @__PURE__ */ createElement("span", {
      style: "color:var(--text2);"
    }, meta.strongAreas)), meta.recommendation && /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("span", {
      style: "color:var(--accent);font-weight:600;"
    }, "Next: "), /* @__PURE__ */ createElement("span", {
      style: "color:var(--text2);"
    }, meta.recommendation))), /* @__PURE__ */ createElement("div", {
      style: "display:flex;gap:10px;"
    }, /* @__PURE__ */ createElement("button", {
      class: "btn-study",
      style: "flex:1;justify-content:center;",
      onclick: () => {
        delete ctx.assessScores;
        delete ctx.assessSaved;
        delete ctx.assessMeta;
        ctx.sessionIdx = sessionIdx + 1;
        ctx.assessSessionIdx = sessionIdx + 1;
        go("assess");
      }
    }, sessionIdx < totalSessions - 1 ? `Score Session ${sessionIdx + 2}` : "All Sessions Done"), /* @__PURE__ */ createElement("button", {
      class: "btn-ghost",
      onclick: () => {
        delete ctx.assessScores;
        delete ctx.assessSaved;
        go("dashboard");
      }
    }, "Dashboard"))));
  }
  const parseScores = (text) => {
    const parsed = {};
    const blockMatch = text.match(/<!--\s*SRS_SCORES\s*-->([\s\S]*?)(?:<!--|```|$)/i);
    const searchText = blockMatch ? blockMatch[1] : text;
    const linePattern = /\b(card-[a-z0-9-]+)\s*[:=|]\s*([1-5])\b/gi;
    let m;
    while ((m = linePattern.exec(searchText)) !== null)
      parsed[m[1]] = parseInt(m[2]);
    if (Object.keys(parsed).length === 0) {
      const jsonMatch = text.match(/\[[\s\S]*?\]/);
      if (jsonMatch)
        try {
          JSON.parse(jsonMatch[0]).forEach((item) => {
            if (item.id && item.score >= 1 && item.score <= 5)
              parsed[item.id] = item.score;
          });
        } catch {}
    }
    return parsed;
  };
  const doPaste = (text) => {
    const parsed = parseScores(text);
    const matched = sessionCards.filter((c) => parsed[c.id] != null).length;
    if (matched === 0) {
      ctx.pasteError = "No matching card scores found. Score manually below.";
      render();
      return;
    }
    sessionCards.forEach((c) => {
      if (parsed[c.id] != null)
        scores[c.id] = parsed[c.id];
    });
    ctx.assessMeta = parseMeta(text);
    ctx.pasteError = null;
    ctx.pasteSuccess = matched + "/" + sessionCards.length + " cards auto-scored" + (matched < sessionCards.length ? " — score the rest manually" : "");
    render();
  };
  return /* @__PURE__ */ createElement("div", {
    class: "shell fade-in"
  }, /* @__PURE__ */ createElement("div", {
    class: "page"
  }, /* @__PURE__ */ createElement("div", {
    class: "nav"
  }, /* @__PURE__ */ createElement("div", {
    style: "display:flex;align-items:center;gap:12px;"
  }, /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    onclick: () => {
      delete ctx.assessScores;
      delete ctx.pasteError;
      delete ctx.pasteSuccess;
      go("dashboard");
    }
  }, /* @__PURE__ */ createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2.5"
  }, /* @__PURE__ */ createElement("line", {
    x1: "19",
    y1: "12",
    x2: "5",
    y2: "12"
  }), /* @__PURE__ */ createElement("polyline", {
    points: "12 19 5 12 12 5"
  })), "Back"), /* @__PURE__ */ createElement("span", {
    class: "title",
    style: "font-size:1.25rem;"
  }, "Score Session ", sessionIdx + 1, "/", totalSessions)), /* @__PURE__ */ createElement("span", {
    style: "font-size:0.8125rem;color:var(--text2);"
  }, scored, "/", sessionCards.length)), /* @__PURE__ */ createElement("div", {
    class: "prog-track thin",
    style: "margin-bottom:16px;"
  }, /* @__PURE__ */ createElement("div", {
    class: "prog-fill",
    style: "width:" + (sessionCards.length ? Math.round(scored / sessionCards.length * 100) : 0) + "%"
  })), /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1rem;margin-bottom:16px;"
  }, /* @__PURE__ */ createElement("div", {
    class: "label-xs",
    style: "margin-bottom:8px;"
  }, "Paste scores from ChatGPT"), /* @__PURE__ */ createElement("div", {
    style: "display:flex;gap:8px;"
  }, /* @__PURE__ */ createElement("textarea", {
    style: "flex:1;min-height:48px;max-height:120px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:10px;padding:0.625rem;color:var(--text1);font-family:monospace;font-size:0.8rem;resize:vertical;",
    placeholder: "Paste the score block from ChatGPT here...",
    ref: (el) => {
      if (el)
        el.onpaste = () => setTimeout(() => doPaste(el.value), 0);
    }
  }), /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    style: "align-self:flex-end;padding:0.625rem 1rem;",
    onclick: (e) => {
      const ta = e.target.closest(".gcard").querySelector("textarea");
      if (ta?.value)
        doPaste(ta.value);
    }
  }, "Import")), ctx.pasteError && /* @__PURE__ */ createElement("div", {
    style: "font-size:0.75rem;color:var(--danger);margin-top:6px;"
  }, ctx.pasteError), ctx.pasteSuccess && /* @__PURE__ */ createElement("div", {
    style: "font-size:0.75rem;color:var(--success);margin-top:6px;"
  }, ctx.pasteSuccess)), /* @__PURE__ */ createElement("div", {
    style: "font-size:0.75rem;color:var(--text3);margin-bottom:12px;text-align:center;"
  }, "Or score each card manually: 1=blank · 2=wrong · 3=hard · 4=good · 5=easy"), /* @__PURE__ */ createElement("div", {
    style: "display:flex;flex-direction:column;gap:8px;margin-bottom:16px;"
  }, sessionCards.map((c, i) => {
    const s = scores[c.id];
    return /* @__PURE__ */ createElement("div", {
      class: "gcard",
      style: "padding:0.75rem 1rem;"
    }, /* @__PURE__ */ createElement("div", {
      style: "display:flex;flex-direction:column;gap:8px;"
    }, /* @__PURE__ */ createElement("div", {
      style: "min-width:0;"
    }, /* @__PURE__ */ createElement("div", {
      style: "font-size:0.75rem;color:var(--text3);margin-bottom:2px;"
    }, c.topicId || c.tags?.[0] || ""), /* @__PURE__ */ createElement("div", {
      style: "font-size:0.8125rem;color:var(--text1);line-height:1.4;"
    }, c.question.length > 100 ? c.question.slice(0, 100) + "…" : c.question)), /* @__PURE__ */ createElement("div", {
      style: "display:flex;gap:4px;"
    }, [1, 2, 3, 4, 5].map((score) => /* @__PURE__ */ createElement("button", {
      style: "flex:1;height:44px;border-radius:8px;border:1px solid " + (s === score ? scoreColors[score] : "var(--border)") + ";background:" + (s === score ? scoreColors[score] + "22" : "transparent") + ";color:" + (s === score ? scoreColors[score] : "var(--text3)") + ";font-size:0.875rem;font-weight:600;cursor:pointer;",
      onclick: () => {
        scores[c.id] = score;
        render();
      }
    }, score)))));
  })), /* @__PURE__ */ createElement("div", {
    style: "position:sticky;bottom:0;padding:12px 0;background:var(--bg-deep);"
  }, /* @__PURE__ */ createElement("div", {
    style: "display:flex;gap:10px;"
  }, /* @__PURE__ */ createElement("button", {
    class: "btn-study" + (!allScored ? " disabled" : ""),
    style: "flex:1;justify-content:center;",
    onclick: () => allScored && doSave()
  }, allScored ? "Save Scores to SRS" : `Score all ${sessionCards.length} cards first`)), !allScored && /* @__PURE__ */ createElement("div", {
    style: "display:flex;gap:8px;margin-top:8px;"
  }, /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    style: "flex:1;padding:0.625rem;",
    onclick: () => {
      sessionCards.forEach((c) => {
        if (scores[c.id] == null)
          scores[c.id] = 3;
      });
      render();
    }
  }, "Rest → Hard (3)"), /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    style: "flex:1;padding:0.625rem;",
    onclick: () => {
      sessionCards.forEach((c) => {
        if (scores[c.id] == null)
          scores[c.id] = 1;
      });
      render();
    }
  }, "Rest → Blank (1)")))));
}
function render() {
  const node = view === "loading" ? Loading() : view === "session" || view === "session_complete" ? Session() : view === "stats" ? Stats() : view === "topics" ? Topics() : view === "config" ? Config() : view === "prompt" ? Prompt() : view === "assess" || view === "assess_results" ? Assess() : Dashboard();
  applyDiff(root, /* @__PURE__ */ createElement("div", null, node));
}
render();
fetch("cards.json").then((r) => r.json()).then((cards) => {
  CARDS = cards;
  go("dashboard");
}).catch((err) => {
  applyDiff(root, /* @__PURE__ */ createElement("div", {
    class: "shell",
    style: "display:flex;align-items:center;justify-content:center;min-height:100vh;"
  }, /* @__PURE__ */ createElement("div", {
    class: "gcard fade-in",
    style: "padding:2rem;max-width:380px;text-align:center;"
  }, /* @__PURE__ */ createElement("div", {
    style: "font-size:2rem;margin-bottom:12px;"
  }, "⚠️"), /* @__PURE__ */ createElement("div", {
    style: "font-size:1.125rem;font-weight:600;margin-bottom:8px;"
  }, "Failed to load cards"), /* @__PURE__ */ createElement("div", {
    style: "font-size:0.875rem;color:var(--text2);margin-bottom:6px;"
  }, err.message), /* @__PURE__ */ createElement("div", {
    style: "font-size:0.75rem;color:var(--text3);"
  }, "Must be served over HTTP — not opened as a file://"))));
});
