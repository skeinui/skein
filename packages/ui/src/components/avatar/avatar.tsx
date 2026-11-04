import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { Children, createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { UIColor, UIRadius, UISize } from "../../contract.ts";

export interface AvatarProps extends Omit<
  BaseAvatar.Root.Props,
  "className" | "style" | "children" | "render"
> {
  /** Image URL; the fallback is shown when loading fails or it is not passed. */
  src?: string;
  /** Alternative text for the image (the person's name); empty by default, which marks the image as decorative. */
  alt?: string;
  /** Fallback content, usually the initials of a name; left empty when not passed. */
  fallback?: ReactNode;
  /** @default "md" */
  size?: UISize;
  /**
   * Background colour of the fallback (not visible while the image shows).
   * @default "neutral"
   */
  color?: UIColor;
  /** Corner radius step; when not passed the theme style's size step decides it (square in HeroUI, round in Ant Design). */
  radius?: UIRadius;
}

/** AvatarGroup passes default size / color / radius down to the avatars inside; an avatar's own props win. */
const GroupContext = createContext<{ size?: UISize; color?: UIColor; radius?: UIRadius } | null>(
  null,
);

/**
 * Round (or `radius`-shaped) picture of a user or entity, with a text fallback such as initials.
 * Pass `src` and `alt`; `fallback` is shown while there is no image or when it fails to load. `size` / `color` / `radius` set the look,
 * and inside an AvatarGroup the ones not passed take the group's values. To stack several avatars with a "+N" overflow use AvatarGroup.
 *
 * Theme style: image loading state is handled by Base UI, and it switches to the fallback automatically when the image fails.
 */
export function Avatar({
  src,
  alt = "",
  fallback,
  size: sizeProp,
  color: colorProp,
  radius: radiusProp,
  ...rest
}: AvatarProps) {
  const group = useContext(GroupContext);
  const size = sizeProp ?? group?.size ?? "md";
  const color = colorProp ?? group?.color ?? "neutral";
  const radius = radiusProp ?? group?.radius;
  return (
    <BaseAvatar.Root
      {...rest}
      data-slot="avatar"
      data-size={size}
      data-color={color}
      data-radius={radius}
    >
      {src ? <BaseAvatar.Image data-slot="avatar-image" src={src} alt={alt} /> : null}
      <BaseAvatar.Fallback data-slot="avatar-fallback">{fallback}</BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}

export interface AvatarGroupProps {
  /** A group of Avatars. */
  children?: ReactNode;
  /** Maximum number shown; the rest collapse into "+N". All are shown if not given. */
  max?: number;
  /** Default size / color / radius for the avatars in the group; an avatar's own props win. */
  size?: UISize;
  /** Default colour for the avatars in the group. */
  color?: UIColor;
  /** Default corner radius step for the avatars in the group. */
  radius?: UIRadius;
  /** Name of this group, for screen readers (e.g. "Project members"). */
  "aria-label"?: string;
  /** Screen reader name of "+N", default `N more`. */
  overflowLabel?: (hidden: number) => string;
}

/**
 * Avatar group: avatars are stacked, and those beyond `max` collapse into "+N". The stacking spacing and each avatar's outline ring are decided by the theme style (varies with the size step).
 * The group is `role="group"` and "+N" is a named `role="img"`, so screen readers know how many more people there are.
 */
export function AvatarGroup({
  children,
  max,
  size,
  color,
  radius,
  "aria-label": ariaLabel,
  overflowLabel = (n) => `${n} more`,
}: AvatarGroupProps) {
  const items = Children.toArray(children);
  const limit = max !== undefined ? Math.max(0, Math.floor(max)) : items.length;
  const shown = items.slice(0, limit);
  const hidden = items.length - shown.length;
  return (
    <GroupContext.Provider value={{ size, color, radius }}>
      <div role="group" aria-label={ariaLabel} data-slot="avatar-group">
        {shown}
        {hidden > 0 ? (
          <Avatar
            fallback={`+${hidden}`}
            role="img"
            aria-label={overflowLabel(hidden)}
            data-overflow=""
          />
        ) : null}
      </div>
    </GroupContext.Provider>
  );
}
