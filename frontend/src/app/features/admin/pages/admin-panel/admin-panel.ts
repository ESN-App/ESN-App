import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, ElementRef, HostListener, inject, signal, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CancelledBadge, DraftBadge, LoadingSpinner, PublishedBadge } from '../../../../shared';
import type { EventDetailsDto } from '../../../events/data-access/events.models';
import { createEventSlug } from '../../../events/utils/event-url';
import type { NewsItemDto } from '../../../home/data-access/news.models';
import type { InfoArticleDto } from '../../../info/data-access/info-api';
import type { PartnerDto } from '../../../partners/data-access/partners.models';
import { createPartnerSlug } from '../../../partners/utils/partner-url';
import { AdminApi, AdminUserDto } from '../../data-access/admin-api';

type AdminSection = 'events' | 'news' | 'partners' | 'info' | 'admins';
type SortField = 'title' | 'date' | 'status';
type ActiveSortField = SortField | 'default';
type SortDirection = 'ascending' | 'descending';
type EventStatusValue = 0 | 1 | 2 | 3 | 4;
type PartnerStatusValue = 0 | 1 | 2;
type AnyStatusValue = EventStatusValue | PartnerStatusValue;

interface EventStatusOption {
  value: EventStatusValue;
  label: string;
}

interface PartnerStatusOption {
  value: PartnerStatusValue;
  label: string;
}

interface SectionOption {
  id: AdminSection;
  label: string;
}

@Component({
  selector: 'app-admin-panel',
  imports: [CurrencyPipe, DatePipe, MatButtonModule, RouterLink, CancelledBadge, DraftBadge, PublishedBadge, LoadingSpinner],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss',
})
export class AdminPanel {
  private readonly api = inject(AdminApi);

  readonly sections: SectionOption[] = [
    { id: 'events', label: 'Events' },
    { id: 'news', label: 'News' },
    { id: 'partners', label: 'Partners' },
    { id: 'info', label: 'Info' },
    { id: 'admins', label: 'Admins' },
  ];
  readonly activeSection = signal<AdminSection>('events');
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly pageSizeOptions = [10, 20, 50];
  readonly sortField = signal<ActiveSortField>('default');
  readonly sortDirection = signal<SortDirection>('ascending');
  readonly selectedIds = signal(new Set<string>());
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly publishingIds = signal(new Set<string>());
  readonly eventPendingDelete = signal<EventDetailsDto | null>(null);
  readonly deletingEvent = signal(false);
  readonly partnerPendingDelete = signal<PartnerDto | null>(null);
  readonly deletingPartner = signal(false);
  readonly deleteError = signal<string | null>(null);
  readonly bulkDeletePending = signal(false);
  readonly bulkStatusPending = signal(false);
  readonly selectedBulkStatus = signal<AnyStatusValue>(1);
  readonly applyingBulkAction = signal(false);
  readonly bulkActionError = signal<string | null>(null);
  readonly displayOrderModalOpen = signal(false);
  readonly savingDisplayOrder = signal(false);
  readonly displayOrderError = signal<string | null>(null);
  readonly activePartnersList = signal<PartnerDto[]>([]);
  readonly draggedPartner = signal<PartnerDto | null>(null);
  readonly tableScrollPosition = signal(0);
  readonly tableScrollMaximum = signal(0);
  @ViewChild('tableScroll') private tableScroll?: ElementRef<HTMLElement>;
  readonly events = signal<EventDetailsDto[]>([]);
  readonly news = signal<NewsItemDto[]>([]);
  readonly partners = signal<PartnerDto[]>([]);
  readonly info = signal<InfoArticleDto[]>([]);
  readonly admins = signal<AdminUserDto[]>([]);

  private readonly normalizedSearchTerm = computed(() =>
    this.searchTerm().trim().toLocaleLowerCase(),
  );

  readonly filteredEvents = computed(() =>
    this.events().filter((item) =>
      this.matchesSearch(
        item.title,
        item.shortDescription,
        item.description,
        item.location,
        this.eventStatus(item.status),
      ),
    ),
  );
  readonly filteredNews = computed(() =>
    this.news().filter((item) =>
      this.matchesSearch(
        item.title,
        item.description,
        item.status === 0 ? 'Draft' : 'Published',
      ),
    ),
  );
  readonly filteredPartners = computed(() =>
    this.partners().filter((item) =>
      this.matchesSearch(
        item.name,
        item.shortDescription,
        item.description,
        item.category,
        item.address,
        item.websiteUrl,
        this.partnerStatus(item.status),
      ),
    ),
  );
  readonly filteredInfo = computed(() =>
    this.info().filter((item) =>
      this.matchesSearch(
        item.title,
        item.slug,
        item.category,
        item.content,
        item.status === 0 ? 'Draft' : 'Published',
      ),
    ),
  );
  readonly filteredAdmins = computed(() =>
    this.admins().filter((item) => this.matchesSearch(item.email, 'Active')),
  );

  readonly sortedEvents = computed(() => {
    const events = this.filteredEvents();
    if (this.sortField() === 'default') {
      return this.sortEventsFromCurrentMonth(events);
    }

    return this.sortItems(events, {
      title: (item) => item.title,
      date: (item) => Date.parse(item.startsAt),
      status: (item) => item.status,
    });
  });
  readonly sortedNews = computed(() =>
    this.sortItems(this.filteredNews(), {
      title: (item) => item.title,
      date: (item) => Date.parse(item.createdAt),
      status: (item) => item.status,
    }),
  );
  readonly sortedPartners = computed(() =>
    this.sortItems(this.filteredPartners(), {
      title: (item) => item.name,
      date: (item) => Date.parse(item.createdAt),
      status: (item) => item.status,
    }),
  );
  readonly sortedInfo = computed(() =>
    this.sortItems(this.filteredInfo(), {
      title: (item) => item.title,
      date: (item) => Date.parse(item.createdAt),
      status: (item) => item.status,
    }),
  );
  readonly sortedAdmins = computed(() =>
    this.sortItems(this.filteredAdmins(), {
      title: (item) => item.email,
      date: (item) => Date.parse(item.createdAt),
      status: () => 'Active',
    }),
  );
  readonly pagedEvents = computed(() => this.paginate(this.sortedEvents()));
  readonly pagedNews = computed(() => this.paginate(this.sortedNews()));
  readonly pagedPartners = computed(() => this.paginate(this.sortedPartners()));
  readonly pagedInfo = computed(() => this.paginate(this.sortedInfo()));
  readonly pagedAdmins = computed(() => this.paginate(this.sortedAdmins()));

  readonly activeCount = computed(() => {
    switch (this.activeSection()) {
      case 'events':
        return this.filteredEvents().length;
      case 'news':
        return this.filteredNews().length;
      case 'partners':
        return this.filteredPartners().length;
      case 'info':
        return this.filteredInfo().length;
      case 'admins':
        return this.filteredAdmins().length;
    }
  });
  readonly activeTotalCount = computed(() => {
    switch (this.activeSection()) {
      case 'events':
        return this.events().length;
      case 'news':
        return this.news().length;
      case 'partners':
        return this.partners().length;
      case 'info':
        return this.info().length;
      case 'admins':
        return this.admins().length;
    }
  });
  readonly activeLabel = computed(
    () => this.sections.find((section) => section.id === this.activeSection())?.label ?? '',
  );
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.activeCount() / this.pageSize())),
  );
  readonly activePage = computed(() => Math.min(this.currentPage(), this.totalPages()));
  readonly paginationStart = computed(() =>
    this.activeCount() === 0 ? 0 : (this.activePage() - 1) * this.pageSize() + 1,
  );
  readonly paginationEnd = computed(() =>
    Math.min(this.activePage() * this.pageSize(), this.activeCount()),
  );
  readonly activePagedIds = computed(() => {
    switch (this.activeSection()) {
      case 'events':
        return this.pagedEvents().map((item) => item.id);
      case 'news':
        return this.pagedNews().map((item) => item.id);
      case 'partners':
        return this.pagedPartners().map((item) => item.id);
      case 'info':
        return this.pagedInfo().map((item) => item.id);
      case 'admins':
        return this.pagedAdmins().map((item) => item.id);
    }
  });
  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly selectedEvents = computed(() => {
    const selectedIds = this.selectedIds();
    return this.events().filter((item) => selectedIds.has(item.id));
  });
  readonly selectedPartners = computed(() => {
    const selectedIds = this.selectedIds();
    return this.partners().filter((item) => selectedIds.has(item.id));
  });
  readonly eventStatusOptions: EventStatusOption[] = [
    { value: 0, label: 'Draft' },
    { value: 1, label: 'Published' },
    { value: 2, label: 'Cancelled' },
  ];
  readonly partnerStatusOptions: PartnerStatusOption[] = [
    { value: 0, label: 'Draft' },
    { value: 1, label: 'Active' },
    { value: 2, label: 'Inactive' },
  ];
  readonly allVisibleSelected = computed(() => {
    const ids = this.activePagedIds();
    return ids.length > 0 && ids.every((id) => this.selectedIds().has(id));
  });

  constructor() {
    this.loadData();
  }

  setSection(section: AdminSection): void {
    this.activeSection.set(section);
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.selectedIds.set(new Set());
    this.sortField.set(section === 'events' ? 'default' : 'date');
    this.sortDirection.set('ascending');
  }

  updateSearch(event: Event): void {
    const page = this.activePage();
    this.searchTerm.set((event.currentTarget as HTMLInputElement).value);
    this.currentPage.set(Math.min(page, this.totalPages()));
  }

  clearSearch(): void {
    const page = this.activePage();
    this.searchTerm.set('');
    this.currentPage.set(Math.min(page, this.totalPages()));
  }

  goToPage(page: number): void {
    this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages()));
  }

  setPageSize(event: Event): void {
    this.pageSize.set(Number((event.currentTarget as HTMLSelectElement).value));
    this.currentPage.set(1);
  }

  setSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDirection.update((direction) =>
        direction === 'ascending' ? 'descending' : 'ascending',
      );
    } else {
      this.sortField.set(field);
      this.sortDirection.set(field === 'title' ? 'ascending' : 'descending');
    }
    this.currentPage.set(1);
  }

  sortState(field: SortField): 'inactive' | SortDirection {
    if (this.sortField() !== field) {
      return 'inactive';
    }

    return this.sortDirection();
  }

  toggleSelection(id: string): void {
    this.selectedIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleVisibleSelection(): void {
    const visibleIds = this.activePagedIds();
    const remove = this.allVisibleSelected();
    this.selectedIds.update((ids) => {
      const next = new Set(ids);
      visibleIds.forEach((id) => (remove ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  eventDetailsLink(item: EventDetailsDto): string[] {
    return ['/events', createEventSlug(item.title, item.id)];
  }

  partnerDetailsLink(item: PartnerDto): string[] {
    return ['/partners', item.slug || createPartnerSlug(item.name)];
  }

  partnerSlug(name: string): string {
    return createPartnerSlug(name);
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      events: this.api.getEvents(),
      news: this.api.getNews(),
      partners: this.api.getPartners(),
      info: this.api.getInfo(),
      admins: this.api.getAdmins(),
    }).subscribe({
      next: ({ events, news, partners, info, admins }) => {
        this.events.set(
          [...events].sort(
            (left, right) => Date.parse(right.startsAt) - Date.parse(left.startsAt),
          ),
        );
        this.news.set(
          [...news].sort(
            (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
          ),
        );
        this.partners.set(
          [...partners].sort((left, right) => left.name.localeCompare(right.name)),
        );
        this.info.set([...info].sort((left, right) => left.title.localeCompare(right.title)));
        this.admins.set(
          [...admins].sort(
            (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
          ),
        );
        this.loading.set(false);
      },
      error: () => {
        this.error.set('The admin data could not be loaded. Please try again.');
        this.loading.set(false);
      },
    });
  }

  eventStatus(status: number): string {
    return ['Draft', 'Published', 'Cancelled', 'Completed', 'Archived'][status] ?? 'Unknown';
  }

  partnerStatus(status: number): string {
    return ['Draft', 'Active', 'Inactive'][status] ?? 'Unknown';
  }

  requestEventDelete(item: EventDetailsDto): void {
    this.deleteError.set(null);
    this.eventPendingDelete.set(item);
  }

  requestBulkDelete(): void {
    if (this.selectedCount() === 0) {
      return;
    }
    this.bulkActionError.set(null);
    this.bulkDeletePending.set(true);
  }

  cancelBulkDelete(): void {
    if (!this.applyingBulkAction()) {
      this.bulkDeletePending.set(false);
      this.bulkActionError.set(null);
    }
  }

  confirmBulkDelete(): void {
    if (this.applyingBulkAction()) {
      return;
    }

    const section = this.activeSection();
    const itemsToDelete = section === 'events' ? this.selectedEvents() : section === 'partners' ? this.selectedPartners() : [];

    if (itemsToDelete.length === 0) {
      return;
    }

    this.applyingBulkAction.set(true);
    this.bulkActionError.set(null);

    const deleteObservables = itemsToDelete.map((item) =>
      section === 'events' ? this.api.deleteEvent(item.id) : this.api.deletePartner(item.id)
    );

    forkJoin(deleteObservables).subscribe({
      next: () => {
        const deletedIds = new Set(itemsToDelete.map((item) => item.id));
        if (section === 'events') {
          this.events.update((items) => items.filter((item) => !deletedIds.has(item.id)));
        } else if (section === 'partners') {
          this.partners.update((items) => items.filter((item) => !deletedIds.has(item.id)));
        }
        this.selectedIds.set(new Set());
        this.applyingBulkAction.set(false);
        this.bulkDeletePending.set(false);
      },
      error: () => {
        const itemName = section === 'events' ? 'events' : section === 'partners' ? 'partners' : 'items';
        this.bulkActionError.set(`The selected ${itemName} could not be deleted. Please try again.`);
        this.applyingBulkAction.set(false);
      },
    });
  }

  openBulkStatusDialog(): void {
    if (this.selectedCount() === 0) {
      return;
    }
    const statusOptions = this.activeSection() === 'partners' ? this.partnerStatusOptions : this.eventStatusOptions;
    const firstEligible = statusOptions.find(
      (option) => this.bulkStatusEligibleCount(option.value) > 0,
    );
    if (firstEligible) {
      this.selectedBulkStatus.set(firstEligible.value);
    }
    this.bulkActionError.set(null);
    this.bulkStatusPending.set(true);
  }

  cancelBulkStatus(): void {
    if (!this.applyingBulkAction()) {
      this.bulkStatusPending.set(false);
      this.bulkActionError.set(null);
    }
  }

  setBulkStatus(event: Event): void {
    this.selectedBulkStatus.set(Number((event.currentTarget as HTMLSelectElement).value) as AnyStatusValue);
  }

  bulkStatusEligibleCount(status: AnyStatusValue): number {
    const section = this.activeSection();
    const items = section === 'events' ? this.selectedEvents() : section === 'partners' ? this.selectedPartners() : [];
    return items.filter((item) => item.status !== status).length;
  }

  confirmBulkStatus(): void {
    const status = this.selectedBulkStatus() as number;
    const section = this.activeSection();

    if (section === 'events') {
      const events = this.selectedEvents().filter((item) => item.status !== status);
      if (events.length === 0 || this.applyingBulkAction()) {
        return;
      }

      this.applyingBulkAction.set(true);
      this.bulkActionError.set(null);
      forkJoin(events.map((item) => this.api.updateEventStatus(item.id, status))).subscribe({
        next: (updatedEvents) => {
          const updatedById = new Map(updatedEvents.map((item) => [item.id, item]));
          this.events.update((items) => items.map((item) => updatedById.get(item.id) ?? item));
          this.selectedIds.set(new Set());
          this.applyingBulkAction.set(false);
          this.bulkStatusPending.set(false);
        },
        error: () => {
          this.bulkActionError.set('The selected event statuses could not be changed. Please try again.');
          this.applyingBulkAction.set(false);
        },
      });
    } else if (section === 'partners') {
      const partners = this.selectedPartners().filter((item) => item.status !== status);
      if (partners.length === 0 || this.applyingBulkAction()) {
        return;
      }

      this.applyingBulkAction.set(true);
      this.bulkActionError.set(null);
      forkJoin(partners.map((item) => this.api.updatePartnerStatus(item.id, status))).subscribe({
        next: (updatedPartners) => {
          const updatedById = new Map(updatedPartners.map((item) => [item.id, item]));
          this.partners.update((items) => items.map((item) => updatedById.get(item.id) ?? item));
          this.selectedIds.set(new Set());
          this.applyingBulkAction.set(false);
          this.bulkStatusPending.set(false);
        },
        error: () => {
          this.bulkActionError.set('The selected partner statuses could not be changed. Please try again.');
          this.applyingBulkAction.set(false);
        },
      });
    }
  }

  cancelEventDelete(): void {
    if (!this.deletingEvent()) {
      this.eventPendingDelete.set(null);
      this.deleteError.set(null);
    }
  }

  confirmEventDelete(): void {
    const item = this.eventPendingDelete();
    if (!item || this.deletingEvent()) {
      return;
    }

    this.deletingEvent.set(true);
    this.deleteError.set(null);
    this.api.deleteEvent(item.id).subscribe({
      next: () => {
        this.events.update((items) => items.filter((current) => current.id !== item.id));
        this.selectedIds.update((ids) => {
          const next = new Set(ids);
          next.delete(item.id);
          return next;
        });
        this.deletingEvent.set(false);
        this.eventPendingDelete.set(null);
      },
      error: () => {
        this.deleteError.set('The event could not be deleted. Please try again.');
        this.deletingEvent.set(false);
      },
    });
  }

  requestPartnerDelete(item: PartnerDto): void {
    this.deleteError.set(null);
    this.partnerPendingDelete.set(item);
  }

  cancelPartnerDelete(): void {
    if (!this.deletingPartner()) {
      this.partnerPendingDelete.set(null);
      this.deleteError.set(null);
    }
  }

  confirmPartnerDelete(): void {
    const item = this.partnerPendingDelete();
    if (!item || this.deletingPartner()) {
      return;
    }

    this.deletingPartner.set(true);
    this.deleteError.set(null);
    this.api.deletePartner(item.id).subscribe({
      next: () => {
        this.partners.update((items) => items.filter((current) => current.id !== item.id));
        this.selectedIds.update((ids) => {
          const next = new Set(ids);
          next.delete(item.id);
          return next;
        });
        this.deletingPartner.set(false);
        this.partnerPendingDelete.set(null);
      },
      error: () => {
        this.deleteError.set('The partner could not be deleted. Please try again.');
        this.deletingPartner.set(false);
      },
    });
  }

  @HostListener('document:keydown.escape')
  closeDeleteConfirmationOnEscape(): void {
    this.cancelEventDelete();
    this.cancelPartnerDelete();
    this.cancelBulkDelete();
    this.cancelBulkStatus();
  }

  updateNewsStatus(item: NewsItemDto, status: number): void {
    this.updateStatus(item.id, this.api.updateNewsStatus(item.id, status), (updated) =>
      this.news.update((items) => items.map((current) => (current.id === updated.id ? updated : current))),
    );
  }

  updatePartnerStatus(item: PartnerDto, status: number): void {
    this.updateStatus(item.id, this.api.updatePartnerStatus(item.id, status), (updated) =>
      this.partners.update((items) => items.map((current) => (current.id === updated.id ? updated : current))),
    );
  }

  updateInfoStatus(item: InfoArticleDto, status: number): void {
    this.updateStatus(item.id, this.api.updateInfoStatus(item.id, status), (updated) =>
      this.info.update((items) => items.map((current) => (current.id === updated.id ? updated : current))),
    );
  }

  private updateStatus<T>(id: string, request: import('rxjs').Observable<T>, update: (item: T) => void): void {
    this.publishingIds.update((ids) => new Set(ids).add(id));

    request.subscribe({
      next: (item) => {
        update(item);
        this.removePublishingId(id);
      },
      error: () => {
        this.error.set('The item status could not be changed. Please try again.');
        this.removePublishingId(id);
      },
    });
  }

  private removePublishingId(id: string): void {
    this.publishingIds.update((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }

  private matchesSearch(...values: (string | number | null | undefined)[]): boolean {
    const query = this.normalizedSearchTerm();

    if (!query) {
      return true;
    }

    return values.some((value) => String(value ?? '').toLocaleLowerCase().includes(query));
  }

  private sortItems<T>(
    items: T[],
    selectors: Record<SortField, (item: T) => string | number>,
  ): T[] {
    const selector = selectors[this.sortField() as SortField];
    const multiplier = this.sortDirection() === 'ascending' ? 1 : -1;

    return [...items].sort((left, right) => {
      const leftValue = selector(left);
      const rightValue = selector(right);
      const comparison =
        typeof leftValue === 'number' && typeof rightValue === 'number'
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue));

      return comparison * multiplier;
    });
  }

  private sortEventsFromCurrentMonth(items: EventDetailsDto[]): EventDetailsDto[] {
    const currentMonth = new Date().getMonth();

    return [...items].sort((left, right) => {
      const leftDate = new Date(left.startsAt);
      const rightDate = new Date(right.startsAt);
      const leftMonthDistance = (leftDate.getMonth() - currentMonth + 12) % 12;
      const rightMonthDistance = (rightDate.getMonth() - currentMonth + 12) % 12;

      if (leftMonthDistance !== rightMonthDistance) {
        return leftMonthDistance - rightMonthDistance;
      }

      return leftDate.getTime() - rightDate.getTime();
    });
  }

  private paginate<T>(items: T[]): T[] {
    const start = (this.activePage() - 1) * this.pageSize();
    return items.slice(start, start + this.pageSize());
  }

  openDisplayOrderModal(): void {
    this.displayOrderModalOpen.set(true);
    this.displayOrderError.set(null);

    const activePartners = this.partners()
      .filter((p) => p.status === 1)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    this.activePartnersList.set(activePartners);
  }

  closeDisplayOrderModal(): void {
    this.displayOrderModalOpen.set(false);
    this.displayOrderError.set(null);
    this.draggedPartner.set(null);
  }

  onDragStart(event: DragEvent, partner: PartnerDto): void {
    this.draggedPartner.set(partner);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDrop(event: DragEvent, targetPartner: PartnerDto): void {
    event.preventDefault();
    const dragged = this.draggedPartner();
    if (!dragged || dragged.id === targetPartner.id) {
      return;
    }

    const list = [...this.activePartnersList()];
    const draggedIndex = list.findIndex((p) => p.id === dragged.id);
    const targetIndex = list.findIndex((p) => p.id === targetPartner.id);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [movedItem] = list.splice(draggedIndex, 1);
      list.splice(targetIndex, 0, movedItem);
      this.activePartnersList.set(list);
    }
  }

  onDragEnd(): void {
    this.draggedPartner.set(null);
  }

  saveDisplayOrder(): void {
    if (this.savingDisplayOrder() || this.activePartnersList().length === 0) {
      return;
    }

    this.savingDisplayOrder.set(true);
    this.displayOrderError.set(null);

    const reorderedIds = this.activePartnersList().map((partner) => partner.id);

    this.api.reorderPartners(reorderedIds).subscribe({
      next: (updatedPartners) => {
        const updatedById = new Map(updatedPartners.map((p) => [p.id, p]));
        this.partners.update((items) =>
          items.map((p) => updatedById.get(p.id) ?? p),
        );
        this.savingDisplayOrder.set(false);
        this.closeDisplayOrderModal();
      },
      error: () => {
        this.displayOrderError.set('Failed to save display order. Please try again.');
        this.savingDisplayOrder.set(false);
      },
    });
  }

  updateTableScroll(event: Event): void {
    const element = event.currentTarget as HTMLElement;
    this.tableScrollPosition.set(element.scrollTop);
    this.tableScrollMaximum.set(Math.max(0, element.scrollHeight - element.clientHeight));
  }

  scrollTable(event: Event): void {
    const position = Number((event.currentTarget as HTMLInputElement).value);
    if (this.tableScroll) {
      this.tableScroll.nativeElement.scrollTop = position;
    }
  }
}
