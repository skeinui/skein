import type { ChatTurnLabels } from "../components/chat-turn/index.ts";
import type { ComposerLabels } from "../components/composer/index.ts";
import type { ContextMeterLabels } from "../components/context-meter/index.ts";
import type { DiffViewLabels } from "../components/diff-view/index.ts";
import type { FeedbackLabels } from "../components/feedback/index.ts";
import type { ImageGridLabels } from "../components/image-grid/index.ts";
import type { PasswordInputLabels, SearchInputLabels } from "../components/input/index.ts";
import type { KanbanLabels } from "../components/kanban/index.ts";
import type {
  AdminLayoutLabels,
  AdminLayoutSettingsLabels,
} from "../components/admin-layout/index.ts";
import type { PageTabsLabels } from "../components/page-tabs/index.ts";
import type { MarkdownLabels } from "../components/markdown/index.ts";
import type { MermaidLabels } from "../components/mermaid-block/index.ts";
import type { PlanLabels } from "../components/plan/index.ts";
import type { QueueLabels } from "../components/queue/index.ts";
import type { QuoteLabels } from "../components/quote/index.ts";
import type { TerminalLabels } from "../components/terminal/index.ts";
import type { ToolCallLabels } from "../components/tool-call/index.ts";
import type { WebPreviewLabels } from "../components/web-preview/index.ts";
import type { AgendaLabels } from "../components/agenda/index.ts";
import type { CarouselLabels } from "../components/carousel/index.ts";
import type { ImageLabels } from "../components/image/index.ts";
import type { MarqueeLabels } from "../components/marquee/index.ts";
import type { PaginationLabels } from "../components/pagination/index.ts";
import type { QRCodeLabels } from "../components/qrcode/index.ts";
import type { SortableLabels } from "../components/sortable/index.ts";
import type { TimePickerLabels } from "../components/time-picker/index.ts";
import type { TourLabels } from "../components/tour/index.ts";
import type { TypographyLabels } from "../components/typography/index.ts";

/** Words shared by components: close, clear, loading, no data... A component's own props such as `placeholder` / `emptyText` take precedence over them. */
export interface CommonLabels {
  close: string;
  clear: string;
  loading: string;
  remove: string;
  retry: string;
  cancel: string;
  confirm: string;
  ok: string;
  search: string;
  select: string;
  noData: string;
  noResults: string;
}
export interface SidebarLabels {
  sidebar: string;
  toggle: string;
}
export interface SplitButtonLabels {
  more: string;
}
export interface TreeSelectLabels {
  options: string;
}
export interface CascaderLabels {
  options: string;
  results: string;
  level: (n: number) => string;
}
export interface TransferLabels {
  selectAll: string;
}
export interface CalendarLabels {
  previousMonth: string;
  nextMonth: string;
  previousYear: string;
  nextYear: string;
  previousDecade: string;
  nextDecade: string;
}
/** Date picker: hints and popup names for each granularity (the `placeholder` prop takes precedence). */
export interface DatePickerLabels {
  placeholders: { date: string; week: string; month: string; quarter: string; year: string };
  choose: { date: string; week: string; month: string; quarter: string; year: string };
}
export interface CodeBlockLabels {
  copy: string;
  copied: string;
  code: (language: string) => string;
}
export interface NumberFieldLabels {
  decrease: string;
  increase: string;
}
export interface SplitterLabels {
  resize: string;
}
export interface MentionsLabels {
  suggestions: string;
}
export interface ChatThreadLabels {
  conversation: string;
  scrollToBottom: string;
}
export interface ComboboxLabels {
  open: string;
}
export interface TypingLabels {
  typing: string;
}
export interface ModelPickerLabels {
  placeholder: string;
  label: string;
}
export interface TableLabels {
  resizeColumn: string;
  expandRow: string;
  collapseRow: string;
}
export interface ArtifactLabels {
  actions: string;
  views: string;
  content: string;
}
export interface SuggestionsLabels {
  label: string;
}
export interface CommandLabels {
  placeholder: string;
  empty: string;
  commands: string;
  title: string;
}
export interface BreadcrumbLabels {
  navigation: string;
}
export interface ColorPickerLabels {
  color: string;
  saturation: string;
  hue: string;
  alpha: string;
  format: string;
  hex: string;
  presets: string;
}
export interface FloatButtonLabels {
  backToTop: string;
}
export interface CitationLabels {
  source: string;
  numbered: (index: number) => string;
  named: (index: number, label: string) => string;
}
export interface FormLabels {
  submit: string;
}
export interface ListLabels {
  empty: string;
}
export interface UploadLabels {
  dropzone: string;
  select: string;
}
export interface OtpFieldLabels {
  code: string;
  digit: (n: number) => string;
}
export interface TagInputLabels {
  remove: (tag: string) => string;
}
export interface AttachmentLabels {
  group: string;
  remove: (name: string) => string;
}
export interface ThreadListLabels {
  label: string;
}

/**
 * The key of each text-bearing component in ConfigProvider `labels` and its text type.
 * When a new component has text to translate, add an entry here, then fill it in `en.ts` and `zh-CN.ts`;
 * `tests/locales.test.ts` checks whether any language is missing something.
 */
export interface LabelTypes {
  agenda: AgendaLabels;
  artifact: ArtifactLabels;
  attachment: AttachmentLabels;
  breadcrumb: BreadcrumbLabels;
  calendar: CalendarLabels;
  cascader: CascaderLabels;
  chatThread: ChatThreadLabels;
  citation: CitationLabels;
  codeBlock: CodeBlockLabels;
  colorPicker: ColorPickerLabels;
  combobox: ComboboxLabels;
  command: CommandLabels;
  common: CommonLabels;
  datePicker: DatePickerLabels;
  floatButton: FloatButtonLabels;
  form: FormLabels;
  list: ListLabels;
  mentions: MentionsLabels;
  modelPicker: ModelPickerLabels;
  numberField: NumberFieldLabels;
  otpField: OtpFieldLabels;
  sidebar: SidebarLabels;
  splitButton: SplitButtonLabels;
  splitter: SplitterLabels;
  suggestions: SuggestionsLabels;
  table: TableLabels;
  tagInput: TagInputLabels;
  threadList: ThreadListLabels;
  transfer: TransferLabels;
  treeSelect: TreeSelectLabels;
  typing: TypingLabels;
  upload: UploadLabels;
  carousel: CarouselLabels;
  chatTurn: ChatTurnLabels;
  composer: ComposerLabels;
  contextMeter: ContextMeterLabels;
  diffView: DiffViewLabels;
  feedback: FeedbackLabels;
  image: ImageLabels;
  imageGrid: ImageGridLabels;
  kanban: KanbanLabels;
  pageTabs: PageTabsLabels;
  adminLayout: AdminLayoutLabels;
  adminLayoutSettings: AdminLayoutSettingsLabels;
  markdown: MarkdownLabels;
  marquee: MarqueeLabels;
  mermaidBlock: MermaidLabels;
  pagination: PaginationLabels;
  passwordInput: PasswordInputLabels;
  plan: PlanLabels;
  qrcode: QRCodeLabels;
  queue: QueueLabels;
  quote: QuoteLabels;
  searchInput: SearchInputLabels;
  sortable: SortableLabels;
  terminal: TerminalLabels;
  timePicker: TimePickerLabels;
  toolCall: ToolCallLabels;
  tour: TourLabels;
  typography: TypographyLabels;
  webPreview: WebPreviewLabels;
}

type Complete<T> = { [K in keyof T]-?: T[K] };

/** Complete text of one language: `locale` is for date components, `labels` has one entry per component and every entry must be fully written. */
export interface Messages {
  locale: string;
  labels: { [K in keyof LabelTypes]: Complete<LabelTypes[K]> };
}

/** Text passed to ConfigProvider: for each component and each entry, you can write only what you want to change. */
export type ConfigLabels = { [K in keyof LabelTypes]?: Partial<LabelTypes[K]> };
