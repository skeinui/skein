import type { ComponentPropsWithoutRef } from "react";
import type { AttachmentKind, AttachmentMediaType } from "../../contract.ts";
import { useLabels } from "../../locales/use-labels.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface AttachmentProps {
  /** File name; also the attachment's accessible name (`role=group`). */
  name: string;
  /** File size (bytes), shown formatted (12 B / 3.4 KB / 1.2 MB); not shown if not passed. */
  size?: number;
  /** MIME type, used to determine the media type and icon. */
  mimeType?: string;
  /** Media type; when not passed it is inferred from `mimeType`, then from the file extension. */
  mediaType?: AttachmentMediaType;
  /** Preview URL for image / video (when not passed it is shown as a file card). */
  src?: string;
  /** When passed, an extra remove button appears at the top right / end. */
  onRemove?: () => void;
  /** Name of the remove button, default "Remove <file name>". */
  removeLabel?: string;
}

const EXTENSIONS: Record<string, AttachmentKind> = {
  pdf: "pdf",
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
  xls: "sheet",
  xlsx: "sheet",
  csv: "sheet",
  tsv: "sheet",
  doc: "doc",
  docx: "doc",
  txt: "doc",
  md: "doc",
  rtf: "doc",
  js: "code",
  jsx: "code",
  ts: "code",
  tsx: "code",
  json: "code",
  py: "code",
  go: "code",
  rs: "code",
  java: "code",
  css: "code",
  html: "code",
  sh: "code",
  sql: "code",
  yml: "code",
  yaml: "code",
  mp3: "audio",
  wav: "audio",
  m4a: "audio",
  ogg: "audio",
  mp4: "video",
  mov: "video",
  webm: "video",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
};

const extensionOf = (name: string) => {
  const dot = name.lastIndexOf(".");
  return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1).toLowerCase() : "";
};

/** File kind (decides the icon color): MIME first, then the extension. */
export function attachmentKind(name: string, mimeType?: string): AttachmentKind {
  const mime = mimeType?.toLowerCase() ?? "";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  if (/zip|compressed|tar|rar/.test(mime)) return "archive";
  if (/spreadsheet|excel|csv/.test(mime)) return "sheet";
  if (/json|javascript|typescript|xml|x-sh|html|css/.test(mime)) return "code";
  if (/word|document|text\/(plain|markdown)|rtf/.test(mime)) return "doc";
  return EXTENSIONS[extensionOf(name)] ?? "file";
}

const MEDIA: Record<AttachmentKind, AttachmentMediaType> = {
  image: "image",
  video: "video",
  audio: "audio",
  pdf: "document",
  archive: "document",
  sheet: "document",
  doc: "document",
  code: "document",
  file: "unknown",
};

/** Bytes → "12 B / 3.4 KB / 1.2 MB". */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value >= 100 || Number.isInteger(value) ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

/**
 * Attachment in chat: an image / video with a preview URL is a thumbnail tile (file name and size overlay it on hover),
 * otherwise a horizontal file card (colored icon with extension, file name, size). Pass `onRemove` to add a remove button.
 * File kind (pdf / archive / spreadsheet / document / code / audio...) is inferred from MIME and extension and only affects the icon color.
 */
export function Attachment({
  name,
  size,
  mimeType,
  mediaType,
  src,
  onRemove,
  removeLabel,
}: AttachmentProps) {
  const t = useLabels("attachment");
  const kind = attachmentKind(name, mimeType);
  const media = mediaType ?? MEDIA[kind];
  const preview = src && (media === "image" || media === "video") ? media : null;
  const sizeText = size === undefined ? "" : formatFileSize(size);
  const extension = extensionOf(name).slice(0, 4).toUpperCase();
  return (
    <div
      data-slot="attachment"
      data-variant={preview ? "media" : "file"}
      data-kind={kind}
      role="group"
      aria-label={name}
    >
      <div data-slot="attachment-preview">
        {preview === "image" ? (
          <img data-slot="attachment-image" src={src} alt="" />
        ) : preview === "video" ? (
          <video
            data-slot="attachment-video"
            src={src}
            muted
            preload="metadata"
            aria-hidden="true"
          />
        ) : (
          <span data-slot="attachment-icon" aria-hidden="true">
            {extension || "FILE"}
          </span>
        )}
      </div>
      <div data-slot="attachment-info">
        <span data-slot="attachment-name">{name}</span>
        {sizeText ? <span data-slot="attachment-size">{sizeText}</span> : null}
      </div>
      {onRemove ? (
        <button
          type="button"
          data-slot="attachment-remove"
          aria-label={removeLabel ?? t.remove(name)}
          onClick={onRemove}
        >
          <CloseIcon />
        </button>
      ) : null}
    </div>
  );
}

export interface AttachmentGroupProps extends Without<ComponentPropsWithoutRef<"div">> {
  /** Name of this group of attachments, for screen readers, default "Attachments". */
  "aria-label"?: string;
}

/** A row of attachments: wraps automatically. */
export function AttachmentGroup({ "aria-label": labelProp, ...rest }: AttachmentGroupProps) {
  const t = useLabels("attachment");
  const label = labelProp ?? t.group;
  return <div {...rest} role="group" aria-label={label} data-slot="attachment-group" />;
}
