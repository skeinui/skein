import {
  Button,
  Checkbox,
  CheckboxGroup,
  DatePicker,
  Flex,
  Input,
  NumberField,
  Popover,
  Segmented,
  Select,
  Tag,
} from "@skeinui/ui";
import { Plus, Trash2 } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { isGroup, str } from "@/lib/list-query";
import type { Capabilities, Condition, Filter, Group, Op } from "@/lib/list-query";
import { useQueryBuilderTranslation } from "./locales";

export interface QueryField {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "enum" | "boolean";
  /** For `enum`: the values and their texts. */
  options?: { value: string; label: string }[];
  /** Overrides the operators the type offers. */
  ops?: readonly Op[];
}

const OPS_OF: Record<QueryField["type"], readonly Op[]> = {
  text: ["contains", "eq", "ne", "startsWith", "endsWith", "blank", "notBlank"],
  number: ["eq", "ne", "gt", "gte", "lt", "lte", "between"],
  date: ["eq", "gte", "lte", "between"],
  enum: ["eq", "ne", "in"],
  boolean: ["eq"],
};

const opsOf = (field: QueryField) => field.ops ?? OPS_OF[field.type];

// The draft of an edit: the filter with an id on every node, so React keeps a row's editor while the others change
type CNode = Condition & { id: number };
type GNode = { id: number; logic: "and" | "or"; items: Node[] };
type Node = CNode | GNode;
const isG = (n: Node): n is GNode => "logic" in n;

let lastId = 0;
const nextId = () => ++lastId;

const toNode = (f: Filter): Node =>
  isGroup(f)
    ? { id: nextId(), logic: f.logic, items: f.items.map(toNode) }
    : { id: nextId(), ...f };
const newCondition = (fields: QueryField[], used: ReadonlySet<string> = new Set()): CNode => {
  const f = fields.find((x) => !used.has(x.name)) ?? fields[0];
  return { id: nextId(), field: f.name, op: opsOf(f)[0] };
};
/** A group of one empty condition: what "Filter" starts from. */
const newGroup = (fields: QueryField[], used?: ReadonlySet<string>): GNode => ({
  id: nextId(),
  logic: "and",
  items: [newCondition(fields, used)],
});
/** A filter as an editable group: a condition becomes a group of one, which can then take more. */
const draftOf = (filter: Filter): GNode => {
  const node = toNode(filter);
  return isG(node) ? node : { id: nextId(), logic: "and", items: [node] };
};

const complete = (c: Condition) =>
  c.op === "blank" ||
  c.op === "notBlank" ||
  (c.op === "between"
    ? Array.isArray(c.value) && c.value.some((v) => v !== undefined && v !== "" && v !== null)
    : c.op === "in"
      ? Array.isArray(c.value) && c.value.length > 0
      : c.value !== undefined && c.value !== "" && c.value !== null);

/**
 * A draft as a filter: incomplete conditions and empty groups are dropped. A group the user built stays a group, even
 * with one condition left; only the editor's own wrapper (`root`) with one row is that row itself.
 */
function prune(n: Node, root = false): Filter | undefined {
  if (!isG(n)) {
    if (!complete(n)) return undefined;
    const { id: _id, ...c } = n;
    return c;
  }
  const items = n.items.flatMap((x) => prune(x) ?? []);
  if (items.length === 0) return undefined;
  return root && items.length === 1 ? items[0] : ({ logic: n.logic, items } satisfies Group);
}

/**
 * What an edit made: the filter, and whether it is the editor's own wrapper (two or more rows, which are just more
 * chips when they join like the list does) or one thing the user built (a condition, or a group that stays a chip).
 */
function result(draft: GNode, root = true): { filter: Filter | undefined; wrapper: boolean } {
  return {
    filter: prune(draft, root),
    wrapper: draft.items.filter((x) => prune(x)).length > 1,
  };
}

/**
 * What the backend can do (`capabilities`) and which fields the rest of the filter already uses: the editors offer
 * only that: no "any of" or groups when it takes none, a field once when it has one parameter for it.
 */
interface Rules {
  groups: boolean;
  or: boolean;
  unique: boolean;
  used: ReadonlySet<string>;
}
const RulesContext = createContext<Rules>({
  groups: true,
  or: true,
  unique: false,
  used: new Set(),
});
const rulesOf = (c?: Capabilities) => ({
  groups: !c || c.nested,
  or: !c || c.or,
  unique: Boolean(c?.uniqueFields),
});
const fieldsOfFilter = (f: Filter): string[] =>
  isGroup(f) ? f.items.flatMap(fieldsOfFilter) : [f.field];
const fieldsOfNode = (n: Node): string[] => (isG(n) ? n.items.flatMap(fieldsOfNode) : [n.field]);

/** The root of a filter as a list of chips and the logic joining them. */
function rootOf(filter: Filter | undefined): Group {
  if (!filter) return { logic: "and", items: [] };
  return isGroup(filter) ? filter : { logic: "and", items: [filter] };
}

export interface QueryBuilderProps {
  fields: QueryField[];
  /** The filter in use. */
  value?: Filter;
  /** A condition or group was added, changed or removed (a new filter, or none). */
  onChange: (filter: Filter | undefined) => void;
  /** What the backend can do (`QueryAdapter.capabilities`): the editors offer no more than that. */
  capabilities?: Capabilities;
}

/**
 * The conditions of a list as chips on one line; a chip opens a popover to change it, "Filter" adds a condition and
 * "Group" a group (all of / any of, nested as deep as needed). Builds the `Filter` of a `ListQuery`.
 */
export function QueryBuilder({ fields, value, onChange, capabilities }: QueryBuilderProps) {
  const { t } = useQueryBuilderTranslation();
  const root = rootOf(value);
  const rules = rulesOf(capabilities);
  /** The fields the filter uses, but for the chip being changed. */
  const taken = (except?: number) =>
    new Set(root.items.flatMap((item, i) => (i === except ? [] : fieldsOfFilter(item))));
  const commit = (items: Filter[], logic = root.logic) =>
    onChange(
      items.length === 0
        ? undefined
        : // One chip is the filter itself, except a group: that stays a group of one, or it would fall apart into chips
          items.length === 1 && !isGroup(items[0])
          ? items[0]
          : ({ logic, items } satisfies Group),
    );
  /** The wrapper of an edit that joins like the list does is just more chips; anything else stays one chip. */
  const spread = (f: Filter, wrapper: boolean): Filter[] =>
    wrapper && isGroup(f) && f.logic === root.logic ? f.items : [f];
  const replace = (index: number, next: Filter | undefined, wrapper: boolean) =>
    commit(
      root.items.flatMap((item, i) => (i !== index ? [item] : next ? spread(next, wrapper) : [])),
    );

  return (
    <div className="qb">
      {root.items.length > 1 && rules.or ? (
        <Segmented
          size="sm"
          aria-label={t("and")}
          value={root.logic}
          onValueChange={(logic) => commit(root.items, logic as "and" | "or")}
          options={[
            { value: "and", label: t("and") },
            { value: "or", label: t("or") },
          ]}
        />
      ) : null}
      {root.items.map((item, i) => (
        <Chip
          // The position is the identity: a chip has no other
          key={i}
          fields={fields}
          filter={item}
          rules={rules}
          taken={taken(i)}
          onChange={(next, wrapper) => replace(i, next, wrapper)}
        />
      ))}
      <Adder
        label={t("addCondition")}
        make={() => newGroup(fields, rules.unique ? taken() : undefined)}
        fields={fields}
        rules={rules}
        taken={taken()}
        onAdd={(f, wrapper) => commit([...root.items, ...spread(f, wrapper)])}
      />
    </div>
  );
}

/** What a condition says, in words: "Status is one of Paid, Shipped". */
function summary(filter: Filter, fields: QueryField[], t: (key: string) => string): string {
  if (isGroup(filter))
    return `(${filter.items.map((f) => summary(f, fields, t)).join(` ${t(filter.logic === "and" ? "andShort" : "orShort")} `)})`;
  const field = fields.find((f) => f.name === filter.field);
  const show = (v: unknown) =>
    field?.options?.find((o) => o.value === String(v))?.label ??
    (typeof v === "boolean" ? t(`bool.${v}`) : str(v));
  const value = Array.isArray(filter.value)
    ? filter.op === "between"
      ? filter.value.map(show).join(" – ")
      : filter.value.map(show).join(", ")
    : filter.op === "blank" || filter.op === "notBlank"
      ? ""
      : show(filter.value);
  return `${field?.label ?? filter.field} ${t(`ops.${filter.op}`)} ${value}`.trim();
}

function Chip({
  fields,
  filter,
  rules,
  taken,
  onChange,
}: {
  fields: QueryField[];
  filter: Filter;
  rules: Omit<Rules, "used">;
  /** The fields the other chips use. */
  taken: ReadonlySet<string>;
  onChange: (next: Filter | undefined, wrapper: boolean) => void;
}) {
  const { t } = useQueryBuilderTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<GNode>(() => draftOf(filter));
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // Opening starts from what is in use, closing without "OK" drops the edit
        if (next) setDraft(draftOf(filter));
        setOpen(next);
      }}
    >
      <Tag
        variant="soft"
        color="primary"
        removeLabel={t("removeCondition")}
        onRemove={() => onChange(undefined, false)}
      >
        <Popover.Trigger render={<button type="button" className="qb-chip" />}>
          {summary(filter, fields, t)}
        </Popover.Trigger>
      </Tag>
      <Popover.Content align="start">
        <Editor
          fields={fields}
          rules={rules}
          taken={taken}
          draft={draft}
          onDraft={setDraft}
          onOk={() => {
            const { filter: next, wrapper } = result(draft, !isGroup(filter));
            // Editing a group edits that group: it stays one chip. A condition that got more rows is just more chips.
            onChange(next, isGroup(filter) ? false : wrapper);
            setOpen(false);
          }}
        />
      </Popover.Content>
    </Popover>
  );
}

/** "Filter" / "Group": the same editor on a new condition or group, added on "OK". */
function Adder({
  label,
  make,
  fields,
  rules,
  taken,
  onAdd,
}: {
  label: string;
  make: () => GNode;
  fields: QueryField[];
  rules: Omit<Rules, "used">;
  /** The fields the chips use. */
  taken: ReadonlySet<string>;
  onAdd: (filter: Filter, wrapper: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<GNode>(make);
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(make());
        setOpen(next);
      }}
    >
      <Popover.Trigger
        render={
          <Button
            variant="ghost"
            size="sm"
            startContent={<Plus size={14} />}
            // Every field has its condition already, and a field is in the filter once
            disabled={rules.unique && fields.every((f) => taken.has(f.name))}
          />
        }
      >
        {label}
      </Popover.Trigger>
      <Popover.Content align="start">
        <Editor
          fields={fields}
          rules={rules}
          taken={taken}
          draft={draft}
          onDraft={setDraft}
          onOk={() => {
            const { filter, wrapper } = result(draft);
            if (filter) onAdd(filter, wrapper);
            setOpen(false);
          }}
        />
      </Popover.Content>
    </Popover>
  );
}

/** The rows (and groups) of a filter being edited, with its "OK": one row is a plain condition, more are a group. */
function Editor({
  fields,
  rules,
  taken,
  draft,
  onDraft,
  onOk,
}: {
  fields: QueryField[];
  rules: Omit<Rules, "used">;
  taken: ReadonlySet<string>;
  draft: GNode;
  onDraft: (next: GNode) => void;
  onOk: () => void;
}) {
  const { t } = useQueryBuilderTranslation();
  const used = new Set([...taken, ...fieldsOfNode(draft)]);
  return (
    <RulesContext.Provider value={{ ...rules, used }}>
      <div className="qb-editor">
        <GroupEditor fields={fields} group={draft} onChange={onDraft} />
        <Flex justify="end">
          <Button color="primary" size="sm" onClick={onOk}>
            {t("ok")}
          </Button>
        </Flex>
      </div>
    </RulesContext.Provider>
  );
}

function GroupEditor({
  fields,
  group,
  onChange,
  onRemove,
}: {
  fields: QueryField[];
  group: GNode;
  onChange: (next: GNode) => void;
  onRemove?: () => void;
}) {
  const { t } = useQueryBuilderTranslation();
  const { groups, or, unique, used } = useContext(RulesContext);
  const set = (items: Node[]) => onChange({ ...group, items });
  return (
    <div className="qb-group" data-nested={onRemove ? "" : undefined}>
      <div className="qb-group-head">
        {or && (group.items.length > 1 || onRemove) ? (
          <span className="qb-lead">
            {t("matchLead")}
            <Segmented
              size="sm"
              aria-label={t("matchLead")}
              value={group.logic}
              onValueChange={(logic) => onChange({ ...group, logic: logic as "and" | "or" })}
              options={[
                { value: "and", label: t("all") },
                { value: "or", label: t("any") },
              ]}
            />
            {t("matchTail")}
          </span>
        ) : (
          <span />
        )}
        <Flex gap="xs">
          <Button
            variant="ghost"
            size="sm"
            startContent={<Plus size={14} />}
            disabled={unique && fields.every((f) => used.has(f.name))}
            onClick={() => set([...group.items, newCondition(fields, unique ? used : undefined)])}
          >
            {t("addInner")}
          </Button>
          {groups ? (
            <Button
              variant="ghost"
              size="sm"
              startContent={<Plus size={14} />}
              onClick={() => set([...group.items, newGroup(fields, unique ? used : undefined)])}
            >
              {t("addSubgroup")}
            </Button>
          ) : null}
          {onRemove ? (
            <Button
              variant="ghost"
              color="danger"
              size="sm"
              iconOnly
              aria-label={t("removeGroup")}
              onClick={onRemove}
            >
              <Trash2 size={14} />
            </Button>
          ) : null}
        </Flex>
      </div>
      {group.items.length === 0 ? <p className="qb-empty">{t("empty")}</p> : null}
      {group.items.map((n) =>
        isG(n) ? (
          <GroupEditor
            key={n.id}
            fields={fields}
            group={n}
            onChange={(next) => set(group.items.map((x) => (x.id === n.id ? next : x)))}
            onRemove={() => set(group.items.filter((x) => x.id !== n.id))}
          />
        ) : (
          <ConditionRow
            key={n.id}
            fields={fields}
            condition={n}
            onChange={(next) => set(group.items.map((x) => (x.id === n.id ? next : x)))}
            onRemove={() => set(group.items.filter((x) => x.id !== n.id))}
          />
        ),
      )}
    </div>
  );
}

function ConditionRow({
  fields,
  condition,
  onChange,
  onRemove,
}: {
  fields: QueryField[];
  condition: CNode;
  onChange: (c: CNode) => void;
  onRemove?: () => void;
}) {
  const { t } = useQueryBuilderTranslation();
  const { unique, used } = useContext(RulesContext);
  const field = fields.find((f) => f.name === condition.field) ?? fields[0];
  const ops = opsOf(field);
  const set = (value: unknown) => onChange({ ...condition, value });

  return (
    <div className="qb-row">
      <Select
        size="sm"
        aria-label={t("field")}
        value={field.name}
        options={fields.map((f) => ({
          value: f.name,
          label: f.label,
          // A field is in the filter once when the backend has one parameter for it
          disabled: unique && used.has(f.name) && f.name !== field.name,
        }))}
        onValueChange={(name) => {
          const next = fields.find((f) => f.name === name) ?? field;
          // The operator stays when the new field has it; the value never carries over
          onChange({
            id: condition.id,
            field: next.name,
            op: opsOf(next).includes(condition.op) ? condition.op : opsOf(next)[0],
          });
        }}
      />
      <Select
        size="sm"
        aria-label={t("operator")}
        value={condition.op}
        options={ops.map((op) => ({ value: op, label: t(`ops.${op}`) }))}
        onValueChange={(op) => {
          const next = op as Op;
          // A single value becomes a list (or a range) and back without asking again
          const was = condition.value;
          const value =
            next === "in" || next === "between"
              ? Array.isArray(was)
                ? was
                : was === undefined
                  ? undefined
                  : [was]
              : Array.isArray(was)
                ? was[0]
                : was;
          onChange({ id: condition.id, field: condition.field, op: next, value });
        }}
      />
      <div className="qb-value">
        <ValueEditor field={field} condition={condition} onChange={set} />
      </div>
      {onRemove ? (
        <Button
          variant="ghost"
          color="danger"
          size="sm"
          iconOnly
          aria-label={t("removeCondition")}
          onClick={onRemove}
        >
          <Trash2 size={14} />
        </Button>
      ) : null}
    </div>
  );
}

function ValueEditor({
  field,
  condition,
  onChange,
}: {
  field: QueryField;
  condition: CNode;
  onChange: (value: unknown) => void;
}) {
  const { t } = useQueryBuilderTranslation();
  const { op, value } = condition;
  if (op === "blank" || op === "notBlank") return null;

  const range = Array.isArray(value) ? value : [];
  const setEnd = (i: 0 | 1, v: unknown) => {
    const next = [range[0], range[1]];
    next[i] = v;
    onChange(next);
  };

  if (field.type === "enum") {
    if (op === "in")
      return (
        <CheckboxGroup
          value={Array.isArray(value) ? (value as string[]) : []}
          onValueChange={(v) => onChange(v)}
          aria-label={t("value")}
        >
          {field.options?.map((o) => (
            <Checkbox key={o.value} value={o.value}>
              {o.label}
            </Checkbox>
          ))}
        </CheckboxGroup>
      );
    return (
      <Select
        size="sm"
        aria-label={t("value")}
        placeholder={t("value")}
        value={typeof value === "string" ? value : ""}
        options={field.options ?? []}
        onValueChange={(v) => onChange(v ?? undefined)}
      />
    );
  }
  if (field.type === "boolean")
    return (
      <Select
        size="sm"
        aria-label={t("value")}
        placeholder={t("value")}
        value={typeof value === "boolean" ? String(value) : ""}
        options={[
          { value: "true", label: t("bool.true") },
          { value: "false", label: t("bool.false") },
        ]}
        onValueChange={(v) => onChange(v === null ? undefined : v === "true")}
      />
    );
  if (field.type === "number") {
    const one = (v: unknown, set: (n: number | null) => void, label: string) => (
      <NumberField
        size="sm"
        stepper={false}
        aria-label={label}
        placeholder={label}
        value={typeof v === "number" ? v : null}
        onValueChange={(n) => set(n)}
      />
    );
    return op === "between" ? (
      <Flex gap="xs" align="center">
        {one(range[0], (n) => setEnd(0, n ?? undefined), t("from"))}
        <span>–</span>
        {one(range[1], (n) => setEnd(1, n ?? undefined), t("to"))}
      </Flex>
    ) : (
      one(value, (n) => onChange(n ?? undefined), t("value"))
    );
  }
  if (field.type === "date") {
    const one = (v: unknown, set: (d: string | null) => void, label: string) => (
      <DatePicker
        size="sm"
        editable
        aria-label={label}
        placeholder={label}
        value={typeof v === "string" ? v : undefined}
        onValueChange={((d: string | null) => set(d)) as never}
      />
    );
    return op === "between" ? (
      <Flex gap="xs" align="center">
        {one(range[0], (d) => setEnd(0, d ?? undefined), t("from"))}
        <span>–</span>
        {one(range[1], (d) => setEnd(1, d ?? undefined), t("to"))}
      </Flex>
    ) : (
      one(value, (d) => onChange(d ?? undefined), t("value"))
    );
  }
  return (
    <Input
      size="sm"
      aria-label={t("value")}
      placeholder={t("value")}
      value={typeof value === "string" ? value : ""}
      onValueChange={(v) => onChange(v)}
    />
  );
}
