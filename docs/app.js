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
var loadCfg = () => ({ examDate: "2026-06-15", dailyStudyMinutes: 60, newCardsPerDay: 20, targetGrade: "pass", ...JSON.parse(localStorage.getItem(CK) || "{}") });
var saveCfg = (c) => localStorage.setItem(CK, JSON.stringify(c));
var daysLeft = (cfg) => cfg.examDate ? Math.max(0, Math.ceil((new Date(cfg.examDate) - new Date) / 86400000)) : 999;
var isSeen = (states, id) => !!states[id]?.lastScore;
var isReviewDue = (states, id) => isSeen(states, id) && states[id].dueDate <= today();
function getNewCardsToday(cards, states, cfg) {
  const perDay = cfg.newCardsPerDay || 20;
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
    style: "display:flex;flex-wrap:wrap;gap:10px;align-items:center;"
  }, /* @__PURE__ */ createElement("button", {
    class: "btn-study" + (stats.due === 0 ? " disabled" : ""),
    onclick: () => stats.due > 0 && startSession()
  }, /* @__PURE__ */ createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2.5"
  }, /* @__PURE__ */ createElement("polygon", {
    points: "5 3 19 12 5 21 5 3"
  })), stats.due > 0 ? `Study Now — ${stats.reviews} review${stats.reviews === 1 ? "" : "s"} + ${stats.newToday} new` : "All Caught Up"), /* @__PURE__ */ createElement("div", {
    style: "display:flex;gap:8px;margin-left:auto;"
  }, [["Prompt", "prompt"], ["Assess", "assess"], ["Stats", "stats"], ["Topics", "topics"], ["Config", "config"]].map(([l, v]) => /* @__PURE__ */ createElement("button", {
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
  }, /* @__PURE__ */ createElement("label", null, "New Cards Per Day"), /* @__PURE__ */ createElement("input", {
    type: "number",
    min: "5",
    max: "200",
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
function Prompt() {
  const cfg = loadCfg(), due = getDue(CARDS);
  const dr = daysLeft(cfg);
  const dailyTarget = Math.ceil(CARDS.length / Math.max(dr, 1));
  const sessionCards = due.slice(0, Math.min(due.length, 20));
  const cardsJson = JSON.stringify(sessionCards.map((c) => ({ id: c.id, question: c.question, answer: c.answer, difficulty: c.difficulty, tags: c.tags, bloomLevel: c.bloomLevel, explanation: c.explanation })), null, 2);
  const studyPlan = `Day ${Math.max(1, 67 - dr)} of 67 | ${dr} days remaining | ${due.length} cards due | Target: ${dailyTarget} cards/day | Session: ${sessionCards.length} cards`;
  let promptText = "";
  fetch("clipboard_prompt.md").then((r) => r.text()).then((t) => {
    promptText = t;
    render();
  }).catch(() => {});
  const filled = (ctx.promptText || promptText || "(Loading prompt template...)").replace("{{STUDY_PLAN}}", studyPlan).replace("{{CARDS_JSON}}", cardsJson);
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
    class: "btn-study",
    style: "padding:0.5rem 1rem;font-size:0.875rem;",
    onclick: () => {
      navigator.clipboard.writeText(filled);
      ctx.copied = true;
      render();
    }
  }, ctx.copied ? "Copied!" : "Copy Prompt")), /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1rem;margin-bottom:16px;"
  }, /* @__PURE__ */ createElement("div", {
    style: "display:flex;flex-wrap:wrap;gap:12px;"
  }, /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("div", {
    class: "label-xs"
  }, "Cards Due"), /* @__PURE__ */ createElement("div", {
    style: "font-size:1.25rem;font-weight:700;color:var(--accent);"
  }, due.length)), /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("div", {
    class: "label-xs"
  }, "Session Size"), /* @__PURE__ */ createElement("div", {
    style: "font-size:1.25rem;font-weight:700;"
  }, sessionCards.length)), /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("div", {
    class: "label-xs"
  }, "Days Left"), /* @__PURE__ */ createElement("div", {
    style: "font-size:1.25rem;font-weight:700;"
  }, dr)), /* @__PURE__ */ createElement("div", null, /* @__PURE__ */ createElement("div", {
    class: "label-xs"
  }, "Daily Target"), /* @__PURE__ */ createElement("div", {
    style: "font-size:1.25rem;font-weight:700;"
  }, dailyTarget)))), /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1.25rem;"
  }, /* @__PURE__ */ createElement("div", {
    class: "label-xs",
    style: "margin-bottom:8px;"
  }, "Clipboard Prompt (paste into your AI agent)"), /* @__PURE__ */ createElement("pre", {
    style: "font-size:0.75rem;line-height:1.5;color:var(--text2);white-space:pre-wrap;word-break:break-word;max-height:600px;overflow-y:auto;"
  }, filled))));
}
function Assess() {
  let textareaEl;
  const doProcess = () => {
    try {
      const raw = textareaEl.value;
      const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/\{[\s\S]*\}/);
      const json = jsonMatch ? jsonMatch[1] || jsonMatch[0] : raw;
      const data = JSON.parse(json);
      const cards = data.cardsReviewed || data.cards || data;
      if (!Array.isArray(cards) || !cards.length)
        throw new Error("No cards found");
      const n = cards.length;
      const correct = cards.filter((c) => c.score >= 4).length;
      const avg = cards.reduce((s, c) => s + c.score, 0) / n;
      go("assess_results", { assessData: { cards, summary: data.sessionSummary || { totalCards: n, correctCount: correct, avgScore: avg, weakAreas: [], strongAreas: [] }, recommendations: data.recommendations || {}, masteryEstimate: data.masteryEstimate || Math.round(correct / n * 100) } });
    } catch (e) {
      alert("Invalid JSON: " + e.message);
    }
  };
  if (ctx.assessData)
    return AssessResults();
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
  }, "Assessment Form"))), /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1.25rem;margin-bottom:16px;"
  }, /* @__PURE__ */ createElement("div", {
    class: "label-xs",
    style: "margin-bottom:8px;"
  }, "Paste session JSON from your AI agent"), /* @__PURE__ */ createElement("textarea", {
    ref: (e) => textareaEl = e,
    style: "width:100%;height:200px;background:var(--bg-card2);color:var(--text1);border:1px solid var(--border);border-radius:8px;padding:0.75rem;font-family:monospace;font-size:0.8125rem;resize:vertical;",
    placeholder: "Paste the JSON block from your study session here..."
  })), /* @__PURE__ */ createElement("button", {
    class: "btn-study",
    style: "width:100%;justify-content:center;",
    onclick: doProcess
  }, "Process Results")));
}
function AssessResults() {
  const { assessData } = ctx;
  const { cards, summary, recommendations, masteryEstimate } = assessData;
  const pct = Math.round(summary.correctCount / summary.totalCards * 100) || masteryEstimate;
  const doSave = () => {
    const states = loadStates();
    cards.forEach((c) => {
      const prev = states[c.id] || defState();
      const next = calcSM2(prev, c.score);
      states[c.id] = { ...next, dueDate: addDays(next.interval), lastScore: c.score };
    });
    saveStates(states);
    ctx.saved = true;
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
      delete ctx.assessData;
      delete ctx.saved;
      go("assess");
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
  }, "Results"))), /* @__PURE__ */ createElement("div", {
    class: "stat-grid",
    style: "margin-bottom:16px;"
  }, [
    { key: "Cards", val: summary.totalCards, hi: false },
    { key: "Correct", val: summary.correctCount, hi: true },
    { key: "Avg Score", val: summary.avgScore?.toFixed?.(1) || summary.avgScore, hi: false },
    { key: "Mastery", val: masteryEstimate + "%", hi: masteryEstimate >= 90 }
  ].map(({ key, val, hi }) => /* @__PURE__ */ createElement("div", {
    class: "stat-tile" + (hi ? " hi" : "")
  }, /* @__PURE__ */ createElement("div", {
    class: "val"
  }, String(val)), /* @__PURE__ */ createElement("div", {
    class: "key"
  }, key)))), /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1rem;margin-bottom:16px;"
  }, /* @__PURE__ */ createElement("div", {
    class: "label-xs",
    style: "margin-bottom:8px;"
  }, "Mastery Progress"), /* @__PURE__ */ createElement("div", {
    class: "prog-track"
  }, /* @__PURE__ */ createElement("div", {
    class: "prog-fill",
    style: "width:" + pct + "%"
  })), /* @__PURE__ */ createElement("div", {
    style: "text-align:right;font-size:0.75rem;color:var(--text2);margin-top:4px;"
  }, pct, "% — target 95%")), summary.weakAreas?.length > 0 && /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1rem;margin-bottom:12px;"
  }, /* @__PURE__ */ createElement("div", {
    class: "label-xs",
    style: "margin-bottom:6px;color:var(--danger);"
  }, "Weak Areas"), /* @__PURE__ */ createElement("div", {
    style: "display:flex;flex-wrap:wrap;gap:4px;"
  }, summary.weakAreas.map((a) => /* @__PURE__ */ createElement("span", {
    class: "badge-topic",
    style: "background:rgba(239,68,68,0.15);color:#f87171;border-color:rgba(239,68,68,0.3);"
  }, a)))), summary.strongAreas?.length > 0 && /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1rem;margin-bottom:12px;"
  }, /* @__PURE__ */ createElement("div", {
    class: "label-xs",
    style: "margin-bottom:6px;color:var(--success);"
  }, "Strong Areas"), /* @__PURE__ */ createElement("div", {
    style: "display:flex;flex-wrap:wrap;gap:4px;"
  }, summary.strongAreas.map((a) => /* @__PURE__ */ createElement("span", {
    class: "badge-topic",
    style: "background:rgba(34,197,94,0.15);color:#4ade80;border-color:rgba(34,197,94,0.3);"
  }, a)))), recommendations.nextSessionFocus && /* @__PURE__ */ createElement("div", {
    class: "gcard",
    style: "padding:1rem;margin-bottom:16px;"
  }, /* @__PURE__ */ createElement("div", {
    class: "label-xs",
    style: "margin-bottom:6px;"
  }, "Next Session"), /* @__PURE__ */ createElement("div", {
    style: "font-size:0.875rem;color:var(--text2);"
  }, recommendations.nextSessionFocus)), /* @__PURE__ */ createElement("div", {
    style: "display:flex;gap:10px;"
  }, /* @__PURE__ */ createElement("button", {
    class: "btn-study" + (ctx.saved ? " disabled" : ""),
    style: "flex:1;justify-content:center;",
    onclick: doSave
  }, ctx.saved ? "Saved to SRS" : "Save to SRS"), /* @__PURE__ */ createElement("button", {
    class: "btn-ghost",
    onclick: () => go("dashboard")
  }, "Dashboard"))));
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
