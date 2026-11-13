import { createElement, type HTMLAttributes, type ReactNode, type Ref } from 'react';

interface HostProps extends HTMLAttributes<HTMLElement> {
  /** Custom element name, e.g. `app-events-list`. Component stylesheets are scoped to it. */
  tag: `app-${string}` | `mat-${string}`;
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
  /**
   * Content-projecting wrappers (layouts, title rows) pass `transparent` so the parent's
   * styles keep reaching the children they wrap, like Angular's <ng-content>.
   */
  transparent?: boolean;
  [attribute: `data-${string}`]: string | undefined;
}

/**
 * Renders a component's host element. Each component stylesheet is wrapped in
 * `@scope (<tag>) to (:scope [data-ng-host] > *)`, so styles apply inside this element but
 * stop at nested component hosts — the same isolation Angular's emulated encapsulation gave.
 */
export function Host({ tag, transparent = false, children, ...attributes }: HostProps) {
  return createElement(
    tag,
    { ...attributes, ...(transparent ? {} : { 'data-ng-host': '' }) },
    children,
  );
}
