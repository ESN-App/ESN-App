import { Component, computed, effect, ElementRef, HostListener, input, OnDestroy, output, signal, untracked, ViewChild } from '@angular/core';

export interface DisplayOrderItem {
  id: string;
}

@Component({
  selector: 'app-admin-display-order-modal',
  templateUrl: './admin-display-order-modal.html',
  styleUrl: './admin-display-order-modal.scss',
})
export class AdminDisplayOrderModal<T extends DisplayOrderItem> implements OnDestroy {
  private static readonly DRAG_SCROLL_EDGE = 56;
  private static readonly DRAG_SCROLL_MAX_SPEED = 14;
  private static instanceCount = 0;
  readonly titleId = `display-order-title-${AdminDisplayOrderModal.instanceCount++}`;
  private dragAutoScrollRafId: number | null = null;
  private dragPointerY: number | null = null;

  readonly open = input.required<boolean>();
  readonly items = input.required<T[]>();
  readonly itemLabel = input.required<(item: T) => string>();
  readonly heading = input('Manage display order');
  readonly emptyMessage = input.required<string>();
  readonly saving = input(false);
  readonly error = input<string | null>(null);

  readonly closeModal = output<void>();
  readonly save = output<string[]>();

  readonly workingList = signal<T[]>([]);
  readonly initialOrder = signal<string[]>([]);
  readonly draggedItem = signal<T | null>(null);
  readonly dragListScrollPosition = signal(0);
  readonly dragListScrollMaximum = signal(0);
  readonly dragListHeight = signal(0);
  @ViewChild('dragListScroll') private dragListScroll?: ElementRef<HTMLElement>;

  readonly hasChanged = computed(() => {
    const current = this.workingList().map((item) => item.id).join(',');
    const initial = this.initialOrder().join(',');
    return current !== initial;
  });

  private readonly seedOnOpen = effect(() => {
    const isOpen = this.open();
    if (!isOpen) {
      return;
    }

    const initial = untracked(() => this.items());
    this.workingList.set(initial);
    this.initialOrder.set(initial.map((item) => item.id));
  });

  private readonly refreshDragListScrollbar = effect(() => {
    this.workingList();
    if (!this.open()) {
      return;
    }

    requestAnimationFrame(() => this.captureDragListScroll());
  });

  ngOnDestroy(): void {
    this.stopDragAutoScroll();
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    if (this.open() && !this.saving()) {
      this.requestClose();
    }
  }

  requestClose(): void {
    this.draggedItem.set(null);
    this.stopDragAutoScroll();
    this.closeModal.emit();
  }

  requestSave(): void {
    if (this.saving() || this.workingList().length === 0 || !this.hasChanged()) {
      return;
    }

    this.save.emit(this.workingList().map((item) => item.id));
  }

  onDragStart(event: DragEvent, item: T): void {
    this.draggedItem.set(item);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
    this.startDragAutoScroll();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragPointerY = event.clientY;
  }

  onDrop(event: DragEvent, targetItem: T): void {
    event.preventDefault();
    const dragged = this.draggedItem();
    if (!dragged || dragged.id === targetItem.id) {
      return;
    }

    const list = [...this.workingList()];
    const draggedIndex = list.findIndex((item) => item.id === dragged.id);
    const targetIndex = list.findIndex((item) => item.id === targetItem.id);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [movedItem] = list.splice(draggedIndex, 1);
      list.splice(targetIndex, 0, movedItem);
      this.workingList.set(list);
    }
  }

  onDragEnd(): void {
    this.draggedItem.set(null);
    this.stopDragAutoScroll();
  }

  updateDragListScroll(event: Event): void {
    this.captureDragListScroll(event.currentTarget as HTMLElement);
  }

  scrollDragList(event: Event): void {
    const position = Number((event.currentTarget as HTMLInputElement).value);
    if (this.dragListScroll) {
      this.dragListScroll.nativeElement.scrollTop = position;
    }
  }

  onDragListWheel(event: WheelEvent): void {
    if (!this.draggedItem()) {
      return;
    }

    const container = this.dragListScroll?.nativeElement;
    if (!container) {
      return;
    }

    event.preventDefault();

    const maxScrollTop = container.scrollHeight - container.clientHeight;
    const nextScrollTop = Math.min(maxScrollTop, Math.max(0, container.scrollTop + event.deltaY));
    if (nextScrollTop !== container.scrollTop) {
      container.scrollTop = nextScrollTop;
      this.captureDragListScroll(container);
    }
  }

  private startDragAutoScroll(): void {
    this.stopDragAutoScroll();
    const step = () => {
      this.runDragAutoScrollStep();
      this.dragAutoScrollRafId = requestAnimationFrame(step);
    };
    this.dragAutoScrollRafId = requestAnimationFrame(step);
  }

  private stopDragAutoScroll(): void {
    if (this.dragAutoScrollRafId !== null) {
      cancelAnimationFrame(this.dragAutoScrollRafId);
      this.dragAutoScrollRafId = null;
    }
    this.dragPointerY = null;
  }

  private runDragAutoScrollStep(): void {
    const container = this.dragListScroll?.nativeElement;
    if (!container || this.dragPointerY === null) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const edge = AdminDisplayOrderModal.DRAG_SCROLL_EDGE;
    const pointerY = this.dragPointerY;

    let delta = 0;
    if (pointerY < rect.top + edge) {
      const intensity = Math.min(1, (rect.top + edge - pointerY) / edge);
      delta = -Math.ceil(intensity * AdminDisplayOrderModal.DRAG_SCROLL_MAX_SPEED);
    } else if (pointerY > rect.bottom - edge) {
      const intensity = Math.min(1, (pointerY - (rect.bottom - edge)) / edge);
      delta = Math.ceil(intensity * AdminDisplayOrderModal.DRAG_SCROLL_MAX_SPEED);
    }

    if (delta === 0) {
      return;
    }

    const maxScrollTop = container.scrollHeight - container.clientHeight;
    const nextScrollTop = Math.min(maxScrollTop, Math.max(0, container.scrollTop + delta));
    if (nextScrollTop !== container.scrollTop) {
      container.scrollTop = nextScrollTop;
      this.captureDragListScroll(container);
    }
  }

  private captureDragListScroll(element = this.dragListScroll?.nativeElement): void {
    if (!element) {
      return;
    }

    this.dragListScrollPosition.set(element.scrollTop);
    this.dragListScrollMaximum.set(Math.max(0, element.scrollHeight - element.clientHeight));
    this.dragListHeight.set(element.clientHeight);
  }
}
