import { useCallback, useEffect, useId, useRef, useState, type DragEvent, type WheelEvent } from 'react';
import { useEscapeKey } from '../../../../shared/hooks';
import { Host } from '../../../../shared/host';
import './admin-display-order-modal.scss';

export interface DisplayOrderItem {
  id: string;
}

const DRAG_SCROLL_EDGE = 56;
const DRAG_SCROLL_MAX_SPEED = 14;

interface AdminDisplayOrderModalProps<T extends DisplayOrderItem> {
  open: boolean;
  items: T[];
  itemLabel: (item: T) => string;
  heading?: string;
  emptyMessage: string;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (ids: string[]) => void;
}

export function AdminDisplayOrderModal<T extends DisplayOrderItem>(props: AdminDisplayOrderModalProps<T>) {
  // Remounting on every open re-seeds the working list from the current items.
  return props.open ? <OpenModal {...props} /> : <Host tag="app-admin-display-order-modal"></Host>;
}

function OpenModal<T extends DisplayOrderItem>({
  items,
  itemLabel,
  heading = 'Manage display order',
  emptyMessage,
  saving = false,
  error = null,
  onClose,
  onSave,
}: AdminDisplayOrderModalProps<T>) {
  const titleId = `display-order-title-${useId()}`;
  const [workingList, setWorkingList] = useState<T[]>(items);
  const [initialOrder] = useState(() => items.map((item) => item.id).join(','));
  const [draggedItem, setDraggedItem] = useState<T | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollMaximum, setScrollMaximum] = useState(0);
  const [listHeight, setListHeight] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const autoScrollFrameRef = useRef<number | null>(null);
  const pointerYRef = useRef<number | null>(null);

  const hasChanged = workingList.map((item) => item.id).join(',') !== initialOrder;

  const captureScroll = useCallback((element = listRef.current) => {
    if (!element) {
      return;
    }
    setScrollPosition(element.scrollTop);
    setScrollMaximum(Math.max(0, element.scrollHeight - element.clientHeight));
    setListHeight(element.clientHeight);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current !== null) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
    pointerYRef.current = null;
  }, []);

  useEffect(() => stopAutoScroll, [stopAutoScroll]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => captureScroll());
    return () => cancelAnimationFrame(frame);
  }, [workingList, captureScroll]);

  const requestClose = () => {
    setDraggedItem(null);
    stopAutoScroll();
    onClose();
  };

  useEscapeKey(() => {
    if (!saving) {
      requestClose();
    }
  });

  const runAutoScrollStep = () => {
    const container = listRef.current;
    const pointerY = pointerYRef.current;
    if (!container || pointerY === null) {
      return;
    }

    const rect = container.getBoundingClientRect();
    let delta = 0;
    if (pointerY < rect.top + DRAG_SCROLL_EDGE) {
      const intensity = Math.min(1, (rect.top + DRAG_SCROLL_EDGE - pointerY) / DRAG_SCROLL_EDGE);
      delta = -Math.ceil(intensity * DRAG_SCROLL_MAX_SPEED);
    } else if (pointerY > rect.bottom - DRAG_SCROLL_EDGE) {
      const intensity = Math.min(1, (pointerY - (rect.bottom - DRAG_SCROLL_EDGE)) / DRAG_SCROLL_EDGE);
      delta = Math.ceil(intensity * DRAG_SCROLL_MAX_SPEED);
    }
    if (delta === 0) {
      return;
    }

    const maxScrollTop = container.scrollHeight - container.clientHeight;
    const next = Math.min(maxScrollTop, Math.max(0, container.scrollTop + delta));
    if (next !== container.scrollTop) {
      container.scrollTop = next;
      captureScroll(container);
    }
  };

  const startAutoScroll = () => {
    stopAutoScroll();
    const step = () => {
      runAutoScrollStep();
      autoScrollFrameRef.current = requestAnimationFrame(step);
    };
    autoScrollFrameRef.current = requestAnimationFrame(step);
  };

  const onDragStart = (event: DragEvent, item: T) => {
    setDraggedItem(item);
    event.dataTransfer.effectAllowed = 'move';
    startAutoScroll();
  };

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    pointerYRef.current = event.clientY;
  };

  const onDrop = (event: DragEvent, target: T) => {
    event.preventDefault();
    if (!draggedItem || draggedItem.id === target.id) {
      return;
    }
    const list = [...workingList];
    const draggedIndex = list.findIndex((item) => item.id === draggedItem.id);
    const targetIndex = list.findIndex((item) => item.id === target.id);
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [moved] = list.splice(draggedIndex, 1);
      list.splice(targetIndex, 0, moved);
      setWorkingList(list);
    }
  };

  const onDragEnd = () => {
    setDraggedItem(null);
    stopAutoScroll();
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    const container = listRef.current;
    if (!draggedItem || !container) {
      return;
    }
    const maxScrollTop = container.scrollHeight - container.clientHeight;
    const next = Math.min(maxScrollTop, Math.max(0, container.scrollTop + event.deltaY));
    if (next !== container.scrollTop) {
      container.scrollTop = next;
      captureScroll(container);
    }
  };

  const requestSave = () => {
    if (saving || workingList.length === 0 || !hasChanged) {
      return;
    }
    onSave(workingList.map((item) => item.id));
  };

  return (
    <Host tag="app-admin-display-order-modal">
      <div className="confirmation-backdrop">
        <section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <div className="modal-header">
            <h2 id={titleId}>{heading}</h2>
            <button type="button" className="modal-close" onClick={requestClose} aria-label="Close">
              ×
            </button>
          </div>

          <div className="modal-content">
            {workingList.length === 0 ? (
              <p className="modal-message">{emptyMessage}</p>
            ) : (
              <>
                <p className="drag-list-help">Drag items to set their display order</p>
                <div className="drag-list-region">
                  <div
                    className="drag-list"
                    ref={listRef}
                    onScroll={(event) => captureScroll(event.currentTarget)}
                    onWheel={onWheel}
                  >
                    {workingList.map((item) => (
                      <div
                        key={item.id}
                        className={`drag-item${draggedItem?.id === item.id ? ' dragging' : ''}`}
                        draggable
                        onDragStart={(event) => onDragStart(event, item)}
                        onDragOver={onDragOver}
                        onDrop={(event) => onDrop(event, item)}
                        onDragEnd={onDragEnd}
                      >
                        <span className="drag-handle" aria-hidden="true">
                          ⋮⋮
                        </span>
                        <span className="drag-item-label">{itemLabel(item)}</span>
                      </div>
                    ))}
                  </div>

                  <input
                    className="drag-list-scrollbar"
                    type="range"
                    min="0"
                    max={scrollMaximum}
                    value={scrollPosition}
                    disabled={scrollMaximum === 0}
                    style={{ width: `${listHeight}px` }}
                    aria-label="Scroll display order list"
                    onChange={(event) => {
                      const position = Number(event.currentTarget.value);
                      if (listRef.current) {
                        listRef.current.scrollTop = position;
                      }
                      setScrollPosition(position);
                    }}
                  />
                </div>
              </>
            )}

            {error && (
              <p className="modal-error" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="confirmation-cancel" disabled={saving} onClick={requestClose}>
              Cancel
            </button>
            <div className="modal-save-action">
              <button
                type="button"
                className="confirmation-submit"
                disabled={saving || workingList.length === 0 || !hasChanged}
                onClick={requestSave}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              {!hasChanged && workingList.length > 0 && <small>Make changes to enable save</small>}
            </div>
          </div>
        </section>
      </div>
    </Host>
  );
}
