import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent, ReactNode } from "react";
import type { UIColor, UISize } from "../../contract.ts";
import { Checkbox } from "../checkbox/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

/** Node state passed to the icon function, used to swap icons on expand / collapse and selection (e.g. open and closed folders). */
export interface TreeNodeState {
  expanded: boolean;
  selected: boolean;
  /** Has no child nodes. */
  leaf: boolean;
}

export interface TreeNode {
  /** Unique id across the whole tree; used by selection, expansion and callbacks. */
  id: string;
  /** Content of the node's row. */
  label: ReactNode;
  /** Icon before the label, not rendered if omitted; pass a function to swap the icon by node state. */
  icon?: ReactNode | ((state: TreeNodeState) => ReactNode);
  children?: TreeNode[];
  /** Has child nodes that are not loaded yet: shows the expand arrow and calls onLoadChildren on first expand. */
  lazy?: boolean;
  disabled?: boolean;
}

/** Result of one drag: put node id before, after or inside targetId (becoming its last child). */
export interface TreeMove {
  id: string;
  targetId: string;
  position: "before" | "after" | "inside";
}

export interface TreeProps {
  /** The tree data: top-level nodes, each nesting its `children`. */
  nodes: TreeNode[];
  /** @default "md" */
  size?: UISize;
  /** @default "primary" */
  color?: UIColor;
  /**
   * Draws connecting lines between parents and children (like a directory structure); the expand arrow becomes a boxed plus / minus in the theme style.
   * @default false
   */
  lines?: boolean;
  /**
   * The selected and hover background fills the whole row; if omitted it is decided by the theme style (antd by default only wraps the text).
   * @default false
   */
  block?: boolean;
  /**
   * Clicking a row with children also expands / collapses it (like a file manager); set to false to expand only via the arrow.
   * @default true
   */
  expandOnClick?: boolean;
  /**
   * Called when expanding a lazy node that has no children yet. If it returns a Promise, the node shows a loading indicator while loading;
   * the consumer updates nodes after getting the data (fill in children, or remove lazy if there are no children).
   */
  onLoadChildren?: (id: string) => void | Promise<void>;
  /** Ids of expanded nodes. */
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (ids: string[]) => void;
  /** Id of the currently selected node (single selection). */
  selected?: string | null;
  defaultSelected?: string | null;
  onSelectedChange?: (id: string | null) => void;
  /**
   * Show a checkbox before each node; checking a parent also checks all available descendants, and when all descendants are checked the parent is checked automatically.
   * @default false
   */
  checkable?: boolean;
  /** Ids of checked nodes (including parents). */
  checked?: string[];
  defaultChecked?: string[];
  onCheckedChange?: (ids: string[]) => void;
  /**
   * Search term: when non-empty only matching nodes remain (along with their ancestors and the descendants of matching nodes), and it auto-expands to the matches;
   * cleared, it is restored. The expanded state is not rewritten, and nodes the user manually collapsed during the search stay collapsed until the search term changes.
   */
  filter?: string;
  /** Custom match rule; if omitted it is a case-insensitive contains match (compares the label when the node label is a string, otherwise the id) and highlights the matching part of the text. */
  filterNode?: (node: TreeNode, query: string) => boolean;
  /**
   * hide (default) hides non-matching nodes; highlight keeps all of them, only expanding to the matches and marking them.
   * @default "hide"
   */
  filterMode?: "hide" | "highlight";
  /** Content shown when the search has no matches; by default the locale's "No results". */
  emptyText?: ReactNode;
  /**
   * Allow dragging nodes to rearrange them (HTML5 drag and drop; on the keyboard use Alt + ↑ / ↓ to move one position among siblings).
   * @default false
   */
  draggable?: boolean;
  /** Called on drop; Tree itself does not change nodes, use moveTreeNode(nodes, move) to get the new data and set it back. */
  onMove?: (move: TreeMove) => void;
  /** Filter whether it can be dropped here; positions that cannot be dropped on show no drop hint and do not trigger onMove. */
  allowDrop?: (move: TreeMove) => boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

const Chevron = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.47 13.03a.75.75 0 0 1 0-1.06L9.44 8 5.47 4.03a.75.75 0 0 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0"
    />
  </svg>
);

const Spinner = () => (
  <svg data-slot="tree-spinner" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.25" />
    <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/** Controlled / uncontrolled, pick one: if value is passed it takes precedence, otherwise internal state is used. */
function useControlled<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = useState(defaultValue);
  const current = value !== undefined ? value : inner;
  const set = useCallback(
    (next: T) => {
      if (value === undefined) setInner(next);
      onChange?.(next);
    },
    [value, onChange],
  );
  return [current, set] as const;
}

function descendants(node: TreeNode): TreeNode[] {
  return (node.children ?? []).flatMap((c) => [c, ...descendants(c)]);
}

function isDescendantOf(
  index: Map<string, { parent: string | null }>,
  id: string,
  ancestorId: string,
) {
  for (let cur = index.get(id)?.parent ?? null; cur; cur = index.get(cur)?.parent ?? null) {
    if (cur === ancestorId) return true;
  }
  return false;
}

/**
 * Produces new nodes from the result of one drag (without modifying the original data): takes id off and puts it before / after / inside targetId.
 * Returns unchanged if dropped onto itself or its own descendants.
 */
export function moveTreeNode(nodes: TreeNode[], move: TreeMove): TreeNode[] {
  const { id, targetId, position } = move;
  if (id === targetId) return nodes;
  let moving: TreeNode | null = null;
  const remove = (list: TreeNode[]): TreeNode[] => {
    const out: TreeNode[] = [];
    for (const node of list) {
      if (node.id === id) {
        moving = node;
        continue;
      }
      out.push(node.children ? { ...node, children: remove(node.children) } : node);
    }
    return out;
  };
  const without = remove(nodes);
  const dragged = moving as TreeNode | null;
  if (!dragged) return nodes;
  // The target is among the dragged node's descendants (cannot be found after removal): do nothing
  let found = false;
  const insert = (list: TreeNode[]): TreeNode[] => {
    const out: TreeNode[] = [];
    for (const node of list) {
      if (node.id === targetId) {
        found = true;
        if (position === "before") out.push(dragged, node);
        else if (position === "after") out.push(node, dragged);
        else out.push({ ...node, children: [...(node.children ?? []), dragged] });
        continue;
      }
      out.push(node.children ? { ...node, children: insert(node.children) } : node);
    }
    return out;
  };
  const result = insert(without);
  return found ? result : nodes;
}

const EMPTY_SET: ReadonlySet<string> = new Set();

const labelOf = (node: TreeNode) => (typeof node.label === "string" ? node.label : node.id);

const defaultMatch = (node: TreeNode, query: string) =>
  labelOf(node).toLowerCase().includes(query.toLowerCase());

/** Wraps the part of the label that matches the search term in <mark>; used only with the default rule when the label is a string. */
function highlight(label: string, query: string): ReactNode {
  const at = label.toLowerCase().indexOf(query.toLowerCase());
  if (at < 0) return label;
  return (
    <>
      {label.slice(0, at)}
      <mark data-slot="tree-match">{label.slice(at, at + query.length)}</mark>
      {label.slice(at + query.length)}
    </>
  );
}

/**
 * Tree: a hierarchy of `nodes` (`{ id, label, children }`) that expand and collapse, for folders, categories or org charts.
 * Expanded / selected / checked are id arrays, controlled (`expanded`, `selected`, `checked` with their `on…Change`) or not;
 * `checkable` adds checkboxes, `draggable` + `onMove` reorder (see `moveTreeNode`), `onLoadChildren` loads lazily, `filter` searches.
 * Keyboard navigation follows the WAI-ARIA tree conventions. To pick a node in a form field use TreeSelect.
 */
export function Tree({
  nodes,
  size = "md",
  color = "primary",
  lines = false,
  block = false,
  expandOnClick = true,
  onLoadChildren,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selected: selectedProp,
  defaultSelected = null,
  onSelectedChange,
  checkable = false,
  checked: checkedProp,
  defaultChecked = [],
  onCheckedChange,
  filter = "",
  filterNode,
  filterMode = "hide",
  emptyText: emptyTextProp,
  draggable = false,
  onMove,
  allowDrop,
  ...aria
}: TreeProps) {
  const c = useLabels("common");
  const emptyText = emptyTextProp ?? c.noResults;
  const [expanded, setExpanded] = useControlled(expandedProp, defaultExpanded, onExpandedChange);
  const [selected, setSelected] = useControlled(selectedProp, defaultSelected, onSelectedChange);
  const [checked, setChecked] = useControlled(checkedProp, defaultChecked, onCheckedChange);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [loading, setLoading] = useState<ReadonlySet<string>>(new Set());

  const index = useMemo(() => {
    const byId = new Map<string, { node: TreeNode; parent: string | null; level: number }>();
    const walk = (list: TreeNode[], parent: string | null, level: number) => {
      for (const node of list) {
        byId.set(node.id, { node, parent, level });
        if (node.children) walk(node.children, node.id, level + 1);
      }
    };
    walk(nodes, null, 1);
    return byId;
  }, [nodes]);

  const expandedSet = useMemo(() => new Set(expanded), [expanded]);
  const query = filter.trim();

  // Search: matching nodes, nodes that need to be shown (hide mode), nodes that need auto-expanding (with matching descendants)
  const found = useMemo(() => {
    if (!query) return null;
    const test = filterNode ?? defaultMatch;
    const matches = new Set<string>();
    const shown = new Set<string>();
    const reveal = new Set<string>();
    const walk = (list: TreeNode[], inMatched: boolean): boolean => {
      let any = false;
      for (const node of list) {
        const hit = test(node, query);
        const sub = node.children ? walk(node.children, inMatched || hit) : false;
        if (hit) matches.add(node.id);
        if (sub) reveal.add(node.id);
        if (hit || sub || inMatched) shown.add(node.id);
        if (hit || sub) any = true;
      }
      return any;
    };
    walk(nodes, false);
    return { matches, shown, reveal };
  }, [nodes, query, filterNode]);

  // Nodes the user manually collapsed during the search; invalidated as soon as the search term changes
  const [collapsed, setCollapsed] = useState<{ query: string; ids: ReadonlySet<string> }>({
    query: "",
    ids: new Set(),
  });
  const forcedClosed = collapsed.query === query ? collapsed.ids : EMPTY_SET;
  const openSet = useMemo(() => {
    if (!found) return expandedSet;
    const next = new Set(expandedSet);
    for (const id of found.reveal) if (!forcedClosed.has(id)) next.add(id);
    for (const id of forcedClosed) next.delete(id);
    return next;
  }, [found, expandedSet, forcedClosed]);
  const hidden = (id: string) => !!found && filterMode === "hide" && !found.shown.has(id);

  const checkedSet = useMemo(() => new Set(checked), [checked]);

  /** Ids of currently visible nodes (all ancestors expanded), in display order. */
  const visible = useMemo(() => {
    const out: string[] = [];
    const walk = (list: TreeNode[]) => {
      for (const node of list) {
        if (hidden(node.id)) continue;
        out.push(node.id);
        if (node.children?.length && openSet.has(node.id)) walk(node.children);
      }
    };
    walk(nodes);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, openSet, found, filterMode]);

  const tabStop =
    focusId && visible.includes(focusId)
      ? focusId
      : selected && visible.includes(selected)
        ? selected
        : (visible[0] ?? null);

  const load = (id: string) => {
    const result = onLoadChildren?.(id);
    if (!result || typeof result.then !== "function") return;
    setLoading((prev) => new Set(prev).add(id));
    const done = () =>
      setLoading((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    result.then(done, done);
  };

  const toggleExpand = (id: string) => {
    const opening = !openSet.has(id);
    setExpanded(opening ? [...expanded, id] : expanded.filter((x) => x !== id));
    if (found) {
      const ids = new Set(forcedClosed);
      if (opening) ids.delete(id);
      else ids.add(id);
      setCollapsed({ query, ids });
    }
    const node = index.get(id)?.node;
    if (opening && node?.lazy && !node.children?.length && !loading.has(id)) load(id);
  };

  const toggleCheck = (node: TreeNode, on: boolean) => {
    const next = new Set(checkedSet);
    const targets = [node, ...descendants(node)].filter((n) => !n.disabled);
    for (const n of targets) {
      if (on) next.add(n.id);
      else next.delete(n.id);
    }
    // Recompute upwards: a parent counts as checked only if all descendants are checked
    let parentId = index.get(node.id)?.parent ?? null;
    while (parentId) {
      const parent = index.get(parentId)!.node;
      const all = descendants(parent)
        .filter((n) => !n.disabled)
        .every((n) => next.has(n.id));
      if (all) next.add(parentId);
      else next.delete(parentId);
      parentId = index.get(parentId)!.parent;
    }
    setChecked([...next]);
  };

  const checkState = (node: TreeNode): { checked: boolean; indeterminate: boolean } => {
    const own = checkedSet.has(node.id);
    if (!node.children?.length) return { checked: own, indeterminate: false };
    const subs = descendants(node).filter((n) => !n.children?.length);
    const some = subs.some((n) => checkedSet.has(n.id));
    const all = subs.every((n) => checkedSet.has(n.id) || n.disabled);
    return { checked: own || (all && some), indeterminate: some && !all };
  };

  // Drag and drop: dragId is the node being dragged, drop is the drop position currently pointed at
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<TreeMove | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  const canDrop = (move: TreeMove) =>
    move.id !== move.targetId &&
    !isDescendantOf(index, move.targetId, move.id) &&
    !index.get(move.targetId)?.node.disabled &&
    (allowDrop ? allowDrop(move) : true);

  const finishMove = (move: TreeMove) => {
    onMove?.(move);
    // Expand a node when dropping inside it, so the node just dropped is not hidden
    if (move.position === "inside" && !openSet.has(move.targetId)) {
      setExpanded([...expanded, move.targetId]);
    }
  };

  const endDrag = () => {
    clearTimeout(hoverTimer.current);
    setDragId(null);
    setDrop(null);
  };

  const dropPosition = (event: DragEvent<HTMLElement>): TreeMove["position"] => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientY - rect.top) / (rect.height || 1);
    return ratio < 0.25 ? "before" : ratio > 0.75 ? "after" : "inside";
  };

  const focusRow = (id: string | null, root: HTMLElement) => {
    if (!id) return;
    setFocusId(id);
    root.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(id)}"]`)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>, id: string) => {
    const root = event.currentTarget.closest<HTMLElement>('[data-slot="tree"]')!;
    const entry = index.get(id)!;
    const node = entry.node;
    const pos = visible.indexOf(id);
    const hasChildren = !!node.children?.length || !!node.lazy;
    const handled = () => {
      event.preventDefault();
      event.stopPropagation();
    };
    // Alt + ↑ / ↓: move one position among siblings (keyboard alternative to drag and drop)
    if (draggable && event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
      handled();
      const siblings = entry.parent ? (index.get(entry.parent)!.node.children ?? []) : nodes;
      const at = siblings.findIndex((n) => n.id === id);
      const neighbour = siblings[at + (event.key === "ArrowUp" ? -1 : 1)];
      if (!node.disabled && neighbour) {
        const move: TreeMove = {
          id,
          targetId: neighbour.id,
          position: event.key === "ArrowUp" ? "before" : "after",
        };
        if (canDrop(move)) finishMove(move);
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        handled();
        focusRow(visible[Math.min(pos + 1, visible.length - 1)] ?? null, root);
        break;
      case "ArrowUp":
        handled();
        focusRow(visible[Math.max(pos - 1, 0)] ?? null, root);
        break;
      case "Home":
        handled();
        focusRow(visible[0] ?? null, root);
        break;
      case "End":
        handled();
        focusRow(visible[visible.length - 1] ?? null, root);
        break;
      case "ArrowRight":
        handled();
        if (hasChildren && !openSet.has(id)) toggleExpand(id);
        else if (node.children?.length) focusRow(node.children[0]!.id, root);
        break;
      case "ArrowLeft":
        handled();
        if (hasChildren && openSet.has(id)) toggleExpand(id);
        else if (entry.parent) focusRow(entry.parent, root);
        break;
      case "Enter":
        handled();
        if (!node.disabled) setSelected(id);
        break;
      case " ":
        handled();
        if (node.disabled) break;
        if (checkable) toggleCheck(node, !checkState(node).checked);
        else setSelected(id);
        break;
    }
  };

  const renderNode = (node: TreeNode): ReactNode => {
    if (hidden(node.id)) return null;
    const entry = index.get(node.id)!;
    const hasChildren = !!node.children?.length || !!node.lazy;
    const isExpanded = hasChildren && openSet.has(node.id);
    const isLoading = loading.has(node.id);
    const isSelected = selected === node.id;
    const state = checkable ? checkState(node) : null;
    const icon =
      typeof node.icon === "function"
        ? node.icon({ expanded: isExpanded, selected: isSelected, leaf: !hasChildren })
        : node.icon;
    return (
      <li
        key={node.id}
        role="treeitem"
        data-slot="tree-item"
        data-leaf={hasChildren ? undefined : ""}
        data-expanded={isExpanded ? "" : undefined}
        data-selected={isSelected ? "" : undefined}
        data-loading={isLoading ? "" : undefined}
        data-disabled={node.disabled ? "" : undefined}
        data-dragging={dragId === node.id ? "" : undefined}
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-busy={isLoading || undefined}
        aria-selected={isSelected}
        aria-disabled={node.disabled || undefined}
        aria-level={entry.level}
      >
        <div
          data-slot="tree-row"
          data-node-id={node.id}
          data-match={found?.matches.has(node.id) ? "" : undefined}
          data-drop={drop?.targetId === node.id ? drop.position : undefined}
          draggable={draggable && !node.disabled ? true : undefined}
          onDragStart={
            draggable && !node.disabled
              ? (e) => {
                  e.dataTransfer?.setData("text/plain", node.id);
                  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
                  setDragId(node.id);
                }
              : undefined
          }
          onDragOver={
            draggable
              ? (e) => {
                  if (!dragId) return;
                  const move: TreeMove = {
                    id: dragId,
                    targetId: node.id,
                    position: dropPosition(e),
                  };
                  if (!canDrop(move)) {
                    if (drop) setDrop(null);
                    return;
                  }
                  e.preventDefault();
                  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
                  if (drop?.targetId !== move.targetId || drop.position !== move.position) {
                    setDrop(move);
                  }
                  // Hovering over a collapsed node for a moment expands it automatically, making it easy to drop deep inside
                  if (move.position === "inside" && hasChildren && !isExpanded) {
                    if (drop?.targetId !== node.id) {
                      clearTimeout(hoverTimer.current);
                      hoverTimer.current = setTimeout(() => toggleExpand(node.id), 700);
                    }
                  } else clearTimeout(hoverTimer.current);
                }
              : undefined
          }
          onDragLeave={
            draggable
              ? (e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    clearTimeout(hoverTimer.current);
                    if (drop?.targetId === node.id) setDrop(null);
                  }
                }
              : undefined
          }
          onDrop={
            draggable
              ? (e) => {
                  if (!dragId) return;
                  const move: TreeMove = {
                    id: dragId,
                    targetId: node.id,
                    position: dropPosition(e),
                  };
                  const ok = canDrop(move);
                  endDrag();
                  if (!ok) return;
                  e.preventDefault();
                  finishMove(move);
                }
              : undefined
          }
          onDragEnd={draggable ? endDrag : undefined}
          tabIndex={tabStop === node.id ? 0 : -1}
          onFocus={() => setFocusId(node.id)}
          onClick={() => {
            if (node.disabled) return;
            setSelected(node.id);
            if (expandOnClick && hasChildren) toggleExpand(node.id);
          }}
          onKeyDown={(e) => onKeyDown(e, node.id)}
        >
          <span
            data-slot="tree-toggle"
            data-empty={hasChildren ? undefined : ""}
            aria-hidden="true"
            onClick={(e) => {
              if (!hasChildren || node.disabled) return;
              e.stopPropagation();
              toggleExpand(node.id);
            }}
          >
            {isLoading ? <Spinner /> : hasChildren ? <Chevron /> : null}
          </span>
          {state ? (
            <span data-slot="tree-checkbox" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={state.checked}
                indeterminate={state.indeterminate}
                disabled={node.disabled}
                tabIndex={-1}
                aria-label={typeof node.label === "string" ? node.label : node.id}
                onCheckedChange={(on) => toggleCheck(node, on)}
              />
            </span>
          ) : null}
          {icon ? <span data-slot="tree-icon">{icon}</span> : null}
          <span data-slot="tree-label">
            {query && !filterNode && typeof node.label === "string"
              ? highlight(node.label, query)
              : node.label}
          </span>
        </div>
        {isExpanded && node.children?.length ? (
          <ul role="group" data-slot="tree-group">
            {node.children.map(renderNode)}
          </ul>
        ) : null}
      </li>
    );
  };

  return (
    <ul
      role="tree"
      data-slot="tree"
      data-size={size}
      data-color={color}
      data-lines={lines ? "" : undefined}
      data-block={block ? "" : undefined}
      data-filtering={query ? "" : undefined}
      data-dragging={dragId ? "" : undefined}
      aria-multiselectable={checkable || undefined}
      {...aria}
    >
      {nodes.map(renderNode)}
      {found && filterMode === "hide" && found.shown.size === 0 ? (
        <li role="none" data-slot="tree-empty">
          {emptyText}
        </li>
      ) : null}
    </ul>
  );
}
