import { useRef, useState } from "react";
import type { DragEvent, KeyboardEvent, ReactNode } from "react";
import type { UploadFileStatus, UploadVariant } from "../../contract.ts";
import { Progress } from "../progress/index.ts";
import { useLabels } from "../../locales/use-labels.ts";

export interface UploadFile {
  /** Unique id chosen by the consumer; passed to `onRemove` / `onRetry`. */
  id: string;
  name: string;
  /** Size in bytes, used to display the size. */
  size?: number;
  status: UploadFileStatus;
  /** Upload progress, 0 to 100. */
  progress?: number;
  /** Reason shown when status is error. */
  error?: ReactNode;
}

export interface UploadProps {
  /**
   * Files that are selected / uploading / uploaded, maintained by the consumer; each row's `status` is uploading / done / error.
   * @default []
   */
  files?: UploadFile[];
  /** Called after files are selected or dropped in; the component does not upload, the consumer takes the File, sends the request itself and updates files. */
  onFilesAdded?: (files: File[]) => void;
  /** Click the remove button of a file row; files being uploaded can be cancelled the same way. */
  onRemove?: (id: string) => void;
  /** Click the retry button of a failed file; if omitted, retry is not shown. */
  onRetry?: (id: string) => void;
  /**
   * dropzone is a drag-and-drop area, button is just a button.
   * @default "dropzone"
   */
  variant?: UploadVariant;
  /** Native accept, e.g. ".png,.jpg" or "image/*". */
  accept?: string;
  /**
   * Allow selecting / dropping several files at once; otherwise only the first is passed to `onFilesAdded`.
   * @default false
   */
  multiple?: boolean;
  /**
   * Disables selecting and dropping files.
   * @default false
   */
  disabled?: boolean;
  /** Main text of the trigger area, dropzone defaults to "Click or drag files here", button defaults to "Select file". */
  title?: ReactNode;
  /** Description under the main text, e.g. format and size limits. */
  hint?: ReactNode;
  /** Icon of the trigger area; the built-in upload icon if omitted. */
  icon?: ReactNode;
  /** Accessible text of the remove button in a file row, default "Remove". */
  removeLabel?: string;
  /** Accessible text of the retry button in a failed file row, default "Retry". */
  retryLabel?: string;
  /** Accessible name, when there is no visible label. */
  "aria-label"?: string;
}

const UploadIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 16V4m0 0 4 4m-4-4L8 8M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);

const FileIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5" />
  </svg>
);

const CrossIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

const RetryIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" />
  </svg>
);

/** File extension (lowercase, at most 4 characters), or an empty string if none; the theme style uses it to draw the file type badge. */
function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
  return /^[a-z0-9]{1,4}$/.test(ext) ? ext : "";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

/**
 * Upload: a file picker (a button, or a drag-and-drop `variant="dropzone"`) plus the list of files with progress and errors.
 * It does not upload anything itself: `onFilesAdded` hands you the chosen files, you upload them and pass their state
 * back in `files` (status, progress, error); `onRemove` / `onRetry` act on one file. `accept` / `multiple` filter the choice.
 */
export function Upload({
  files = [],
  onFilesAdded,
  onRemove,
  onRetry,
  variant = "dropzone",
  accept,
  multiple = false,
  disabled = false,
  title,
  hint,
  icon,
  removeLabel: removeLabelProp,
  retryLabel: retryLabelProp,
  "aria-label": ariaLabel,
}: UploadProps) {
  const t = useLabels("upload");
  const c = useLabels("common");
  const retryLabel = retryLabelProp ?? c.retry;
  const removeLabel = removeLabelProp ?? c.remove;
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const open = () => {
    if (!disabled) input.current?.click();
  };
  const add = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const picked = Array.from(list);
    onFilesAdded?.(multiple ? picked : picked.slice(0, 1));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  };
  const onDragOver = (event: DragEvent<HTMLElement>) => {
    if (disabled) return;
    event.preventDefault();
    setDragging(true);
  };
  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!disabled) add(event.dataTransfer.files);
  };

  const heading = title ?? (variant === "dropzone" ? t.dropzone : t.select);

  return (
    <div
      data-slot="upload"
      data-variant={variant}
      data-disabled={disabled ? "" : undefined}
      data-dragging={dragging ? "" : undefined}
    >
      <input
        ref={input}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        onChange={(event) => {
          add(event.target.files);
          event.target.value = "";
        }}
      />
      {variant === "dropzone" ? (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={ariaLabel}
          aria-disabled={disabled || undefined}
          data-slot="upload-trigger"
          onClick={open}
          onKeyDown={onKeyDown}
          onDragOver={onDragOver}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <span data-slot="upload-icon">{icon ?? <UploadIcon />}</span>
          <span data-slot="upload-title">{heading}</span>
          {hint ? <span data-slot="upload-hint">{hint}</span> : null}
        </div>
      ) : (
        <button
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          data-slot="upload-trigger"
          onClick={open}
        >
          <span data-slot="upload-icon">{icon ?? <UploadIcon />}</span>
          <span data-slot="upload-title">{heading}</span>
        </button>
      )}
      {variant === "button" && hint ? <span data-slot="upload-hint">{hint}</span> : null}
      {files.length > 0 ? (
        <ul data-slot="upload-list">
          {files.map((file) => (
            <li key={file.id} data-slot="upload-item" data-status={file.status}>
              <span data-slot="upload-item-icon">
                <FileIcon />
                {extensionOf(file.name) ? (
                  <span data-slot="upload-item-ext" data-ext={extensionOf(file.name)}>
                    {extensionOf(file.name)}
                  </span>
                ) : null}
              </span>
              <span data-slot="upload-item-name">{file.name}</span>
              <span data-slot="upload-item-meta">
                {file.size != null ? formatBytes(file.size) : null}
                {file.status === "uploading" && file.progress != null
                  ? ` · ${Math.round(file.progress)}%`
                  : null}
              </span>
              {file.status === "error" && onRetry ? (
                <button
                  type="button"
                  data-slot="upload-item-action"
                  data-action="retry"
                  aria-label={retryLabel}
                  onClick={() => onRetry(file.id)}
                >
                  <RetryIcon />
                </button>
              ) : null}
              {onRemove ? (
                <button
                  type="button"
                  data-slot="upload-item-action"
                  data-action="remove"
                  aria-label={removeLabel}
                  onClick={() => onRemove(file.id)}
                >
                  <CrossIcon />
                </button>
              ) : null}
              {file.status === "uploading" ? (
                <span data-slot="upload-item-progress">
                  <Progress
                    size="sm"
                    value={file.progress ?? null}
                    color="primary"
                    aria-label={file.name}
                  />
                </span>
              ) : null}
              {file.status === "error" && file.error ? (
                <span data-slot="upload-item-error">{file.error}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
