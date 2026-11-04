import type { ComponentPropsWithoutRef } from "react";
import type { UISize } from "../../contract.ts";

type Without<T> = Omit<T, "className" | "style">;

export interface KbdProps extends Without<ComponentPropsWithoutRef<"kbd">> {
  /** @default "md" */
  size?: UISize;
}

/** Keyboard key hint, such as ⌘ K. */
function KbdRoot({ size = "md", ...rest }: KbdProps) {
  return <kbd {...rest} data-slot="kbd" data-size={size} />;
}

export interface KbdGroupProps extends Without<ComponentPropsWithoutRef<"span">> {
  /** @default "md" */
  size?: UISize;
}

/** A group of keys with spacing between them: <Kbd.Group><Kbd>⌘</Kbd><Kbd>K</Kbd></Kbd.Group>. */
function KbdGroup({ size = "md", ...rest }: KbdGroupProps) {
  return <span {...rest} data-slot="kbd-group" data-size={size} />;
}

export const Kbd = Object.assign(KbdRoot, { Group: KbdGroup });
