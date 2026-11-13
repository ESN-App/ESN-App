import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAuth } from '../../../../core/auth';
import { CancelledBadge, DraftBadge, LoadingSpinner, PublishedBadge } from '../../../../shared/components';
import { formatDate, formatPrice } from '../../../../shared/format';
import { useEscapeKey } from '../../../../shared/hooks';
import { Host } from '../../../../shared/host';
import type { EventDetailsDto } from '../../../events/data-access/events.models';
import { createEventSlug } from '../../../events/utils/event-url';
import type { NewsItemDto } from '../../../home/data-access/news.models';
import type { InfoArticleDto } from '../../../info/data-access/info-api';
import type { PartnerDto } from '../../../partners/data-access/partners.models';
import { createPartnerSlug } from '../../../partners/utils/partner-url';
import { AdminDisplayOrderModal } from '../../components/admin-display-order-modal/admin-display-order-modal';
import { adminApi, type AdminUserDto } from '../../data-access/admin-api';
import { apiErrorMessage } from '../../utils/form-state';
import './admin-panel.scss';

type AdminSection = 'events' | 'news' | 'partners' | 'info' | 'admins';
type StatusSection = Exclude<AdminSection, 'admins'>;
type SortField = 'title' | 'date' | 'status';
type ActiveSortField = SortField | 'default';
type SortDirection = 'ascending' | 'descending';

interface SectionData {
  events: EventDetailsDto[];
  news: NewsItemDto[];
  partners: PartnerDto[];
  info: InfoArticleDto[];
  admins: AdminUserDto[];
}

interface StatusOption {
  value: number;
  label: string;
}

const SECTIONS: { id: AdminSection; label: string }[] = [
  { id: 'events', label: 'Events' },
  { id: 'news', label: 'News' },
  { id: 'partners', label: 'Partners' },
  { id: 'info', label: 'Info' },
  { id: 'admins', label: 'Admins' },
];
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const STATUS_OPTIONS: Record<StatusSection, StatusOption[]> = {
  events: [
    { value: 0, label: 'Draft' },
    { value: 1, label: 'Published' },
    { value: 2, label: 'Cancelled' },
  ],
  partners: [
    { value: 0, label: 'Draft' },
    { value: 1, label: 'Active' },
    { value: 2, label: 'Inactive' },
  ],
  info: [
    { value: 0, label: 'Draft' },
    { value: 1, label: 'Published' },
  ],
  news: [
    { value: 0, label: 'Draft' },
    { value: 1, label: 'Published' },
  ],
};

/** Singular item label per section, used in dialog copy. */
const ITEM_LABEL: Record<AdminSection, string> = {
  events: 'event',
  news: 'news article',
  partners: 'partner',
  info: 'article',
  admins: 'admin',
};

/** Single-row delete dialog copy per section. */
const DELETE_COPY: Record<AdminSection, { titleId: string; keep: string; confirm: string; error: string }> = {
  events: {
    titleId: 'delete-event-title',
    keep: 'Keep event',
    confirm: 'Yes, delete event',
    error: 'The event could not be deleted. Please try again.',
  },
  partners: {
    titleId: 'delete-partner-title',
    keep: 'Keep partner',
    confirm: 'Yes, delete partner',
    error: 'The partner could not be deleted. Please try again.',
  },
  info: {
    titleId: 'delete-info-title',
    keep: 'Keep article',
    confirm: 'Yes, delete article',
    error: 'The article could not be deleted. Please try again.',
  },
  news: {
    titleId: 'delete-news-title',
    keep: 'Keep news article',
    confirm: 'Yes, delete news article',
    error: 'The news article could not be deleted. Please try again.',
  },
  admins: {
    titleId: 'delete-admin-title',
    keep: 'Keep admin',
    confirm: 'Yes, delete admin',
    error: 'The admin could not be deleted. Please try again.',
  },
};

const BULK_STATUS_NAME: Record<StatusSection, string> = {
  events: 'event statuses',
  partners: 'partner statuses',
  news: 'news article statuses',
  info: 'article statuses',
};

function eventStatusLabel(status: number): string {
  return ['Draft', 'Published', 'Cancelled', 'Completed', 'Archived'][status] ?? 'Unknown';
}

function partnerStatusLabel(status: number): string {
  return ['Draft', 'Active', 'Inactive'][status] ?? 'Unknown';
}

function defaultSortField(section: AdminSection): ActiveSortField {
  if (section === 'events') {
    return 'default';
  }
  return section === 'partners' ? 'title' : 'date';
}

function resolveSection(requested: string | null): AdminSection {
  return SECTIONS.some((section) => section.id === requested) ? (requested as AdminSection) : 'events';
}

function deleteRequest(section: AdminSection, id: string): Promise<void> {
  switch (section) {
    case 'events':
      return adminApi.deleteEvent(id);
    case 'news':
      return adminApi.deleteNews(id);
    case 'partners':
      return adminApi.deletePartner(id);
    case 'info':
      return adminApi.deleteInfo(id);
    case 'admins':
      return adminApi.deleteAdmin(id);
  }
}

function statusRequest(section: StatusSection, id: string, status: number): Promise<{ id: string }> {
  switch (section) {
    case 'events':
      return adminApi.updateEventStatus(id, status);
    case 'news':
      return adminApi.updateNewsStatus(id, status);
    case 'partners':
      return adminApi.updatePartnerStatus(id, status);
    case 'info':
      return adminApi.updateInfoStatus(id, status);
  }
}

/** Runs requests so all of them settle, reporting success or failure per row. */
async function settleAll<T>(ids: string[], request: (id: string) => Promise<T>) {
  return Promise.all(
    ids.map((id) =>
      request(id).then(
        (value) => ({ id, ok: true as const, value }),
        () => ({ id, ok: false as const, value: null }),
      ),
    ),
  );
}

function compareValues(left: string | number, right: string | number): number {
  return typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right));
}

function sortEventsFromCurrentMonth(items: EventDetailsDto[]): EventDetailsDto[] {
  const currentMonth = new Date().getMonth();
  return [...items].sort((left, right) => {
    const leftDate = new Date(left.startsAt);
    const rightDate = new Date(right.startsAt);
    const leftDistance = (leftDate.getMonth() - currentMonth + 12) % 12;
    const rightDistance = (rightDate.getMonth() - currentMonth + 12) % 12;
    if (leftDistance !== rightDistance) {
      return leftDistance - rightDistance;
    }
    return leftDate.getTime() - rightDate.getTime();
  });
}

async function loadSection(section: AdminSection): Promise<SectionData[AdminSection]> {
  switch (section) {
    case 'events':
      return [...(await adminApi.getEvents())].sort((l, r) => Date.parse(r.startsAt) - Date.parse(l.startsAt));
    case 'news':
      return [...(await adminApi.getNews())].sort((l, r) => Date.parse(r.createdAt) - Date.parse(l.createdAt));
    case 'partners':
      return [...(await adminApi.getPartners())].sort((l, r) => l.name.localeCompare(r.name));
    case 'info':
      return [...(await adminApi.getInfo())].sort((l, r) => l.title.localeCompare(r.title));
    case 'admins':
      return [...(await adminApi.getAdmins())].sort((l, r) => Date.parse(r.createdAt) - Date.parse(l.createdAt));
  }
}

interface PendingDelete {
  section: AdminSection;
  id: string;
  label: string;
}

export default function AdminPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const auth = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>(() => resolveSection(searchParams.get('section')));
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<ActiveSortField>(() => defaultSortField(activeSection));
  const [sortDirection, setSortDirection] = useState<SortDirection>('ascending');
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SectionData>({ events: [], news: [], partners: [], info: [], admins: [] });
  const loadedSectionsRef = useRef(new Set<AdminSection>());
  const pendingSectionsRef = useRef(new Set<AdminSection>());
  // Kept in step with activeSection by setSection, so async loads know which section is on screen.
  const activeSectionRef = useRef(activeSection);

  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [openOptionsMenuId, setOpenOptionsMenuId] = useState<string | null>(null);
  const [optionsMenuPosition, setOptionsMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [adminPendingReset, setAdminPendingReset] = useState<AdminUserDto | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetPasswordSent, setResetPasswordSent] = useState<string | null>(null);
  const [bulkPasswordResetPending, setBulkPasswordResetPending] = useState(false);
  const [bulkDeletePending, setBulkDeletePending] = useState(false);
  const [bulkStatusPending, setBulkStatusPending] = useState(false);
  const [selectedBulkStatus, setSelectedBulkStatus] = useState(1);
  const [applyingBulkAction, setApplyingBulkAction] = useState(false);
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  const [displayOrderModalOpen, setDisplayOrderModalOpen] = useState(false);
  const [savingDisplayOrder, setSavingDisplayOrder] = useState(false);
  const [displayOrderError, setDisplayOrderError] = useState<string | null>(null);
  const [infoOrderModalOpen, setInfoOrderModalOpen] = useState(false);
  const [savingInfoOrder, setSavingInfoOrder] = useState(false);
  const [infoOrderError, setInfoOrderError] = useState<string | null>(null);
  const [tableScrollPosition, setTableScrollPosition] = useState(0);
  const [tableScrollMaximum, setTableScrollMaximum] = useState(0);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const activeLabel = SECTIONS.find((section) => section.id === activeSection)?.label ?? '';

  const ensureSectionLoaded = useCallback((section: AdminSection, force = false) => {
    const loaded = loadedSectionsRef.current;
    const pending = pendingSectionsRef.current;
    if (!force && (loaded.has(section) || pending.has(section))) {
      return;
    }
    pending.add(section);
    if (section === activeSectionRef.current) {
      setLoading(true);
      setError(null);
    }
    loadSection(section).then(
      (items) => {
        setData((current) => ({ ...current, [section]: items }));
        loaded.add(section);
        pending.delete(section);
        if (section === activeSectionRef.current) {
          setLoading(false);
        }
      },
      () => {
        pending.delete(section);
        if (section === activeSectionRef.current) {
          setLoading(false);
          const label = SECTIONS.find((item) => item.id === section)?.label ?? '';
          setError(`${label} could not be loaded. Please try again.`);
        }
      },
    );
  }, []);

  useEffect(() => {
    ensureSectionLoaded(activeSectionRef.current);
  }, [ensureSectionLoaded]);

  const setSection = (section: AdminSection) => {
    activeSectionRef.current = section;
    setActiveSection(section);
    setSearchTerm('');
    setCurrentPage(1);
    setSelectedIds(new Set());
    setSortField(defaultSortField(section));
    setSortDirection('ascending');
    setError(null);
    setSearchParams(
      (params) => {
        params.set('section', section);
        return params;
      },
      { replace: true },
    );
    ensureSectionLoaded(section);
  };

  // --- filtering, sorting, paging -------------------------------------------------------------

  const query = searchTerm.trim().toLocaleLowerCase();
  const matches = (...values: (string | number | null | undefined)[]) =>
    !query || values.some((value) => String(value ?? '').toLocaleLowerCase().includes(query));

  const filtered = {
    events: data.events.filter((item) =>
      matches(item.title, item.shortDescription, item.description, item.location, eventStatusLabel(item.status)),
    ),
    news: data.news.filter((item) => matches(item.title, item.description, item.status === 0 ? 'Draft' : 'Published')),
    partners: data.partners.filter((item) =>
      matches(item.name, item.shortDescription, item.description, item.address, item.websiteUrl, partnerStatusLabel(item.status)),
    ),
    info: data.info.filter((item) =>
      matches(item.title, item.slug, item.category, item.content, item.status === 0 ? 'Draft' : 'Published'),
    ),
    admins: data.admins.filter((item) => matches(item.email)),
  };

  const sortItems = <T,>(items: T[], selectors: Record<SortField, (item: T) => string | number>): T[] => {
    const selector = selectors[sortField as SortField];
    const multiplier = sortDirection === 'ascending' ? 1 : -1;
    return [...items].sort((left, right) => compareValues(selector(left), selector(right)) * multiplier);
  };

  const sorted = {
    events:
      sortField === 'default'
        ? sortEventsFromCurrentMonth(filtered.events)
        : sortItems(filtered.events, {
            title: (item) => item.title,
            date: (item) => Date.parse(item.startsAt),
            status: (item) => item.status,
          }),
    news: sortItems(filtered.news, {
      title: (item) => item.title,
      date: (item) => Date.parse(item.createdAt),
      status: (item) => item.status,
    }),
    partners: sortItems(filtered.partners, {
      title: (item) => item.name,
      date: (item) => Date.parse(item.createdAt),
      status: (item) => item.status,
    }),
    info: sortItems(filtered.info, {
      title: (item) => item.title,
      date: (item) => Date.parse(item.createdAt),
      status: (item) => item.status,
    }),
    admins: sortItems(filtered.admins, {
      title: (item) => item.email,
      date: (item) => Date.parse(item.createdAt),
      status: () => '',
    }),
  };

  const activeCount = filtered[activeSection].length;
  const activeTotalCount = data[activeSection].length;
  const totalPages = Math.max(1, Math.ceil(activeCount / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const paginationStart = activeCount === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const paginationEnd = Math.min(activePage * pageSize, activeCount);
  const paginate = <T,>(items: T[]) => items.slice((activePage - 1) * pageSize, activePage * pageSize);

  const paged = {
    events: paginate(sorted.events),
    news: paginate(sorted.news),
    partners: paginate(sorted.partners),
    info: paginate(sorted.info),
    admins: paginate(sorted.admins),
  };

  const isCurrentAdmin = (item: AdminUserDto) => item.email === auth.email;

  const activePagedIds =
    activeSection === 'admins'
      ? paged.admins.filter((item) => !isCurrentAdmin(item)).map((item) => item.id)
      : (paged[activeSection] as { id: string }[]).map((item) => item.id);
  const selectedCount = selectedIds.size;
  const allVisibleSelected = activePagedIds.length > 0 && activePagedIds.every((id) => selectedIds.has(id));

  const selectedItems = (section: AdminSection): { id: string; status?: number }[] =>
    section === 'admins'
      ? data.admins.filter((item) => selectedIds.has(item.id) && !isCurrentAdmin(item))
      : (data[section] as { id: string; status: number }[]).filter((item) => selectedIds.has(item.id));

  const activePartnersForReorder = data.partners
    .filter((partner) => partner.status === 1)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const publishedInfoForReorder = data.info
    .filter((item) => item.status === 1)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const updateSearch = (value: string) => {
    const page = activePage;
    setSearchTerm(value);
    setCurrentPage(page);
  };

  const setSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((direction) => (direction === 'ascending' ? 'descending' : 'ascending'));
    } else {
      setSortField(field);
      setSortDirection(field === 'title' ? 'ascending' : 'descending');
    }
    setCurrentPage(1);
  };

  const sortState = (field: SortField): 'inactive' | SortDirection => (sortField !== field ? 'inactive' : sortDirection);

  const toggleSelection = (id: string) =>
    setSelectedIds((ids) => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const toggleVisibleSelection = () => {
    const remove = allVisibleSelected;
    setSelectedIds((ids) => {
      const next = new Set(ids);
      activePagedIds.forEach((id) => (remove ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const removeFromSelection = (removed: ReadonlySet<string>) =>
    setSelectedIds((ids) => new Set([...ids].filter((id) => !removed.has(id))));

  const removeItems = (section: AdminSection, removed: ReadonlySet<string>) =>
    setData((current) => ({
      ...current,
      [section]: (current[section] as { id: string }[]).filter((item) => !removed.has(item.id)),
    }));

  const replaceItems = (section: AdminSection, updated: ReadonlyMap<string, { id: string }>) =>
    setData((current) => ({
      ...current,
      [section]: (current[section] as { id: string }[]).map((item) => updated.get(item.id) ?? item),
    }));

  // --- single delete --------------------------------------------------------------------------

  const requestDelete = (section: AdminSection, id: string, label: string) => {
    setDeleteError(null);
    setPendingDelete({ section, id, label });
  };

  const cancelDelete = () => {
    if (!deleting) {
      setPendingDelete(null);
      setDeleteError(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) {
      return;
    }
    const { section, id } = pendingDelete;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteRequest(section, id);
      removeItems(section, new Set([id]));
      removeFromSelection(new Set([id]));
      setDeleting(false);
      setPendingDelete(null);
    } catch (err) {
      const fallback = DELETE_COPY[section].error;
      setDeleteError(section === 'admins' ? apiErrorMessage(err, fallback) : fallback);
      setDeleting(false);
    }
  };

  // --- bulk delete ----------------------------------------------------------------------------

  const cancelBulkDelete = () => {
    if (!applyingBulkAction) {
      setBulkDeletePending(false);
      setBulkActionError(null);
    }
  };

  const confirmBulkDelete = async () => {
    if (applyingBulkAction) {
      return;
    }
    const section = activeSection;
    const items = selectedItems(section);
    if (items.length === 0) {
      return;
    }
    setApplyingBulkAction(true);
    setBulkActionError(null);

    const itemName = { events: 'events', news: 'news articles', partners: 'partners', info: 'articles', admins: 'admins' }[
      section
    ];
    // Every request settles, so a failure on one row still lets the rows that did delete
    // disappear from the table instead of lingering until a reload.
    const results = await settleAll(
      items.map((item) => item.id),
      (id) => deleteRequest(section, id),
    );
    const deletedIds = new Set(results.filter((result) => result.ok).map((result) => result.id));
    if (deletedIds.size > 0) {
      removeItems(section, deletedIds);
    }
    // Keep only the rows that failed selected, so retrying retries just those.
    removeFromSelection(deletedIds);
    setApplyingBulkAction(false);

    const failedCount = results.length - deletedIds.size;
    if (failedCount === 0) {
      setBulkDeletePending(false);
      return;
    }
    setBulkActionError(
      failedCount === results.length
        ? `The selected ${itemName} could not be deleted. Please try again.`
        : `${failedCount} of ${results.length} ${itemName} could not be deleted. The rest were deleted.`,
    );
  };

  // --- bulk status ----------------------------------------------------------------------------

  const bulkStatusEligibleCount = (status: number) =>
    activeSection === 'admins' ? 0 : selectedItems(activeSection).filter((item) => item.status !== status).length;

  const openBulkStatusDialog = () => {
    if (selectedCount === 0 || activeSection === 'admins') {
      return;
    }
    const firstEligible = STATUS_OPTIONS[activeSection].find((option) => bulkStatusEligibleCount(option.value) > 0);
    if (firstEligible) {
      setSelectedBulkStatus(firstEligible.value);
    }
    setBulkActionError(null);
    setBulkStatusPending(true);
  };

  const cancelBulkStatus = () => {
    if (!applyingBulkAction) {
      setBulkStatusPending(false);
      setBulkActionError(null);
    }
  };

  const confirmBulkStatus = async () => {
    if (activeSection === 'admins') {
      return;
    }
    const section = activeSection;
    const status = selectedBulkStatus;
    const items = selectedItems(section).filter((item) => item.status !== status);
    if (items.length === 0 || applyingBulkAction) {
      return;
    }
    setApplyingBulkAction(true);
    setBulkActionError(null);

    const results = await settleAll(
      items.map((item) => item.id),
      (id) => statusRequest(section, id, status),
    );
    const updatedById = new Map(
      results.filter((result) => result.ok && result.value !== null).map((result) => [result.id, result.value!]),
    );
    replaceItems(section, updatedById);
    removeFromSelection(new Set(updatedById.keys()));
    setApplyingBulkAction(false);

    const failedCount = results.length - updatedById.size;
    if (failedCount === 0) {
      setBulkStatusPending(false);
      return;
    }
    const itemName = BULK_STATUS_NAME[section];
    setBulkActionError(
      failedCount === results.length
        ? `The selected ${itemName} could not be changed. Please try again.`
        : `${failedCount} of ${results.length} selected ${itemName} could not be changed. The rest were updated.`,
    );
  };

  // --- admin password resets ------------------------------------------------------------------

  const closeOptionsMenu = () => {
    setOpenOptionsMenuId(null);
    setOptionsMenuPosition(null);
  };

  const toggleOptionsMenu = (id: string, trigger: HTMLElement) => {
    if (openOptionsMenuId === id) {
      closeOptionsMenu();
      return;
    }
    const rect = trigger.getBoundingClientRect();
    setOptionsMenuPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setOpenOptionsMenuId(id);
  };

  useEffect(() => {
    if (!openOptionsMenuId) {
      return;
    }
    const onClick = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest('.row-menu')) {
        setOpenOptionsMenuId(null);
        setOptionsMenuPosition(null);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [openOptionsMenuId]);

  const requestAdminPasswordReset = (item: AdminUserDto) => {
    if (isCurrentAdmin(item)) {
      return;
    }
    closeOptionsMenu();
    setDeleteError(null);
    setResetPasswordSent(null);
    setAdminPendingReset(item);
  };

  const cancelAdminPasswordReset = () => {
    if (!resettingPassword) {
      setAdminPendingReset(null);
      setDeleteError(null);
    }
  };

  const confirmAdminPasswordReset = async () => {
    const item = adminPendingReset;
    if (!item || resettingPassword) {
      return;
    }
    setResettingPassword(true);
    setDeleteError(null);
    try {
      await adminApi.requestPasswordReset(item.id);
      setResettingPassword(false);
      setAdminPendingReset(null);
      setResetPasswordSent(`A password reset link has been sent to ${item.email}.`);
    } catch (err) {
      setDeleteError(apiErrorMessage(err, 'The password reset link could not be sent. Please try again.'));
      setResettingPassword(false);
    }
  };

  const cancelBulkPasswordReset = () => {
    if (!applyingBulkAction) {
      setBulkPasswordResetPending(false);
      setBulkActionError(null);
    }
  };

  const confirmBulkPasswordReset = async () => {
    const admins = selectedItems('admins') as AdminUserDto[];
    if (admins.length === 0 || applyingBulkAction) {
      return;
    }
    setApplyingBulkAction(true);
    setBulkActionError(null);

    const results = await settleAll(
      admins.map((item) => item.id),
      (id) => adminApi.requestPasswordReset(id),
    );
    const sentIds = new Set(results.filter((result) => result.ok).map((result) => result.id));
    removeFromSelection(sentIds);
    setApplyingBulkAction(false);

    const failedCount = results.length - sentIds.size;
    if (failedCount > 0) {
      setBulkActionError(
        failedCount === results.length
          ? 'The password reset links could not be sent. Please try again.'
          : `${failedCount} of ${results.length} password reset links could not be sent. The rest were sent.`,
      );
    }
    if (sentIds.size === 0) {
      return;
    }
    setBulkPasswordResetPending(failedCount > 0);
    const sentAdmins = admins.filter((item) => sentIds.has(item.id));
    setResetPasswordSent(
      sentAdmins.length === 1
        ? `A password reset link has been sent to ${sentAdmins[0].email}.`
        : `Password reset links have been sent to ${sentAdmins.length} administrators.`,
    );
  };

  useEscapeKey(() => {
    cancelDelete();
    cancelAdminPasswordReset();
    cancelBulkDelete();
    cancelBulkStatus();
    cancelBulkPasswordReset();
  });

  // --- display order --------------------------------------------------------------------------

  const saveDisplayOrderPartners = async (ids: string[]) => {
    setSavingDisplayOrder(true);
    setDisplayOrderError(null);
    try {
      const updated = await adminApi.reorderPartners(ids);
      replaceItems('partners', new Map(updated.map((partner) => [partner.id, partner])));
      setSavingDisplayOrder(false);
      setDisplayOrderModalOpen(false);
      setDisplayOrderError(null);
    } catch {
      setDisplayOrderError('Failed to save display order. Please try again.');
      setSavingDisplayOrder(false);
    }
  };

  const saveInfoOrder = async (ids: string[]) => {
    setSavingInfoOrder(true);
    setInfoOrderError(null);
    try {
      const updated = await adminApi.reorderInfo(ids);
      replaceItems('info', new Map(updated.map((item) => [item.id, item])));
      setSavingInfoOrder(false);
      setInfoOrderModalOpen(false);
      setInfoOrderError(null);
    } catch {
      setInfoOrderError('Failed to save display order. Please try again.');
      setSavingInfoOrder(false);
    }
  };

  // --- rendering helpers ----------------------------------------------------------------------

  const sortHeader = (field: SortField, label: string) => (
    <button className="header-sort" type="button" onClick={() => setSort(field)}>
      {label} <span className="sort-indicator" data-direction={sortState(field)} aria-hidden="true"></span>
    </button>
  );

  const selectAllCell = (label: string) => (
    <th className="selection">
      <input type="checkbox" aria-label={label} checked={allVisibleSelected} onChange={toggleVisibleSelection} />
    </th>
  );

  const selectCell = (id: string, label: string, disabled = false) => (
    <td className="selection">
      <input
        type="checkbox"
        aria-label={`Select ${label}`}
        checked={selectedIds.has(id)}
        disabled={disabled}
        onChange={() => toggleSelection(id)}
      />
    </td>
  );

  const rowTools = (editLink: string, label: string, onDelete: () => void) => (
    <td className="row-tools">
      <div className="row-tools__buttons">
        <Link className="icon-button icon-button--edit" to={editLink} aria-label={`Edit ${label}`} title="Edit"></Link>
        <button
          type="button"
          className="icon-button icon-button--delete"
          aria-label={`Delete ${label}`}
          title="Delete"
          onClick={onDelete}
        ></button>
      </div>
    </td>
  );

  const rowOptionsHeader = (
    <th className="row-tools">
      <span className="visually-hidden">Row options</span>
    </th>
  );

  const renderTable = (): ReactNode => {
    switch (activeSection) {
      case 'events':
        return (
          <table>
            <thead>
              <tr>
                {selectAllCell('Select all events on this page')}
                <th className="primary-column">{sortHeader('title', 'Event')}</th>
                <th>{sortHeader('date', 'Date')}</th>
                <th>Location</th>
                <th>Price</th>
                <th>{sortHeader('status', 'Status')}</th>
                {rowOptionsHeader}
              </tr>
            </thead>
            <tbody>
              {paged.events.map((item) => (
                <tr key={item.id} className={item.status === 0 ? 'draft-row' : undefined}>
                  {selectCell(item.id, item.title)}
                  <td className="primary-column" data-label="Event">
                    <Link className="details-link" to={`/events/${createEventSlug(item.title, item.id)}`} title={item.title}>
                      {item.title}
                    </Link>
                  </td>
                  <td data-label="Date">
                    <time dateTime={item.startsAt}>{formatDate(item.startsAt, 'd MMM y')}</time>
                  </td>
                  <td data-label="Location">{item.location}</td>
                  <td data-label="Price">{formatPrice(item.price)}</td>
                  <td data-label="Status">
                    {item.status === 0 ? (
                      <DraftBadge />
                    ) : item.status === 1 ? (
                      <PublishedBadge />
                    ) : item.status === 2 ? (
                      <CancelledBadge />
                    ) : (
                      <span className="status-badge">{eventStatusLabel(item.status)}</span>
                    )}
                  </td>
                  {rowTools(`/admin/events/${item.id}/edit`, item.title, () => requestDelete('events', item.id, item.title))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'news':
        return (
          <table className="news-table">
            <thead>
              <tr>
                {selectAllCell('Select all news on this page')}
                <th className="primary-column">{sortHeader('title', 'News item')}</th>
                <th>{sortHeader('date', 'Created')}</th>
                <th>{sortHeader('status', 'Status')}</th>
                {rowOptionsHeader}
              </tr>
            </thead>
            <tbody>
              {paged.news.map((item) => (
                <tr key={item.id} className={item.status === 0 ? 'draft-row' : undefined}>
                  {selectCell(item.id, item.title)}
                  <td className="primary-column" data-label="News item">
                    <Link className="details-link" to={`/news/${item.id}`} title={item.title}>
                      {item.title}
                    </Link>
                  </td>
                  <td data-label="Created">{formatDate(item.createdAt, 'd MMM y')}</td>
                  <td data-label="Status">
                    <span className={`status-badge${item.status === 0 ? ' draft-badge' : ''}`}>
                      {item.status === 0 ? 'Draft' : 'Published'}
                    </span>
                  </td>
                  {rowTools(`/admin/news/${item.id}/edit`, item.title, () => requestDelete('news', item.id, item.title))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'partners':
        return (
          <table>
            <thead>
              <tr>
                {selectAllCell('Select all partners on this page')}
                <th className="primary-column">{sortHeader('title', 'Partner')}</th>
                <th>Address</th>
                <th>Website</th>
                <th>{sortHeader('date', 'Created')}</th>
                <th>{sortHeader('status', 'Status')}</th>
                {rowOptionsHeader}
              </tr>
            </thead>
            <tbody>
              {paged.partners.map((item) => {
                const badgeClasses = ['status-badge'];
                if (item.status === 0) badgeClasses.push('draft-badge');
                if (item.status === 2) badgeClasses.push('inactive-badge');
                return (
                  <tr key={item.id} className={item.status === 0 ? 'draft-row' : undefined}>
                    {selectCell(item.id, item.name)}
                    <td className="primary-column" data-label="Partner">
                      <Link
                        className="details-link"
                        to={`/partners/${item.slug || createPartnerSlug(item.name)}`}
                        title={item.name}
                      >
                        {item.name}
                      </Link>
                    </td>
                    <td data-label="Address">{item.address || '—'}</td>
                    <td data-label="Website">
                      {item.websiteUrl ? (
                        <a className="website-link" href={item.websiteUrl} target="_blank" rel="noopener noreferrer">
                          {item.name} website
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td data-label="Created">{formatDate(item.createdAt, 'd MMM y')}</td>
                    <td data-label="Status">
                      <span className={badgeClasses.join(' ')}>{partnerStatusLabel(item.status)}</span>
                    </td>
                    {rowTools(`/admin/partners/${createPartnerSlug(item.name)}/edit`, item.name, () =>
                      requestDelete('partners', item.id, item.name),
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      case 'info':
        return (
          <table>
            <thead>
              <tr>
                {selectAllCell('Select all info articles on this page')}
                <th className="primary-column">{sortHeader('title', 'Article')}</th>
                <th>Category</th>
                <th>{sortHeader('date', 'Created')}</th>
                <th>{sortHeader('status', 'Status')}</th>
                {rowOptionsHeader}
              </tr>
            </thead>
            <tbody>
              {paged.info.map((item) => (
                <tr key={item.id} className={item.status === 0 ? 'draft-row' : undefined}>
                  {selectCell(item.id, item.title)}
                  <td className="primary-column" data-label="Article">
                    <Link className="details-link" to={`/info/${item.slug}`} title={item.title}>
                      {item.title}
                    </Link>
                  </td>
                  <td data-label="Category">{item.category}</td>
                  <td data-label="Created">{formatDate(item.createdAt, 'd MMM y')}</td>
                  <td data-label="Status">
                    <span className={`status-badge${item.status === 0 ? ' draft-badge' : ''}`}>
                      {item.status === 0 ? 'Draft' : 'Published'}
                    </span>
                  </td>
                  {rowTools(`/admin/info/${item.id}/edit`, item.title, () => requestDelete('info', item.id, item.title))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'admins':
        return (
          <table className="admins-table">
            <thead>
              <tr>
                {selectAllCell('Select all administrators on this page')}
                <th className="primary-column">{sortHeader('title', 'Administrator')}</th>
                <th>{sortHeader('date', 'Created')}</th>
                {rowOptionsHeader}
              </tr>
            </thead>
            <tbody>
              {paged.admins.map((item) => {
                const current = isCurrentAdmin(item);
                return (
                  <tr key={item.id}>
                    {selectCell(item.id, item.email, current)}
                    <td className="primary-column" data-label="Administrator">
                      <strong title={item.email}>
                        {item.email}
                        {current && (
                          <>
                            {' '}
                            <small>(you)</small>
                          </>
                        )}
                      </strong>
                    </td>
                    <td data-label="Created">{formatDate(item.createdAt, 'd MMM y')}</td>
                    <td className="row-tools">
                      <div className="row-tools__buttons">
                        <button
                          type="button"
                          className="icon-button icon-button--delete"
                          aria-label={`Delete ${item.email}`}
                          title="Delete"
                          disabled={current}
                          onClick={() => !current && requestDelete('admins', item.id, item.email)}
                        ></button>
                        <div className="row-menu">
                          <button
                            type="button"
                            className="icon-button icon-button--menu"
                            aria-label={`Options for ${item.email}`}
                            title="Options"
                            onClick={(event) => toggleOptionsMenu(item.id, event.currentTarget)}
                          ></button>
                          {openOptionsMenuId === item.id && optionsMenuPosition && (
                            <div
                              className="row-menu__dropdown"
                              role="menu"
                              style={{ top: `${optionsMenuPosition.top}px`, right: `${optionsMenuPosition.right}px` }}
                            >
                              <button
                                type="button"
                                role="menuitem"
                                disabled={current}
                                title={current ? 'You cannot reset your own password this way' : ''}
                                onClick={() => requestAdminPasswordReset(item)}
                              >
                                Reset password
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
    }
  };

  const itemLabel = ITEM_LABEL[activeSection];
  const itemLabelPlural = selectedCount === 1 ? itemLabel : `${itemLabel}s`;

  return (
    <Host tag="app-admin-panel">
      <section className="admin-page">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>Admin panel</h1>
            <p className="intro">Manage the content and people that keep the ESN Gdańsk app up to date.</p>
          </div>
        </header>

        <nav className="section-switch" aria-label="Admin panel sections" role="tablist">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={activeSection === section.id}
              className={activeSection === section.id ? 'active' : undefined}
              onClick={() => setSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <section className="table-card">
          <header className="table-header">
            <div>
              <h2>{activeLabel}</h2>
              <p>
                {searchTerm
                  ? `${activeCount} of ${activeTotalCount} records`
                  : `${activeCount} ${activeCount === 1 ? 'record' : 'records'}`}
              </p>
            </div>
            <div className="table-header__actions">
              {selectedCount > 0 && (
                <div className="bulk-actions" aria-label={`Actions for selected ${activeLabel.toLowerCase()}`}>
                  <button
                    type="button"
                    className="bulk-delete-button"
                    onClick={() => {
                      setBulkActionError(null);
                      setBulkDeletePending(true);
                    }}
                  >
                    Delete selected
                  </button>
                  {activeSection !== 'admins' ? (
                    <button type="button" className="bulk-status-button" onClick={openBulkStatusDialog}>
                      Change status
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="bulk-status-button"
                      onClick={() => {
                        setBulkActionError(null);
                        setBulkPasswordResetPending(true);
                      }}
                    >
                      Reset password
                    </button>
                  )}
                </div>
              )}
              {activeSection === 'events' && (
                <Link className="create-button" to="/admin/events/new">
                  Create new event
                </Link>
              )}
              {activeSection === 'news' && (
                <Link className="create-button" to="/admin/news/new">
                  Create new news article
                </Link>
              )}
              {activeSection === 'partners' && (
                <>
                  <button
                    type="button"
                    className="create-button"
                    onClick={() => {
                      setDisplayOrderModalOpen(true);
                      setDisplayOrderError(null);
                    }}
                  >
                    Set display order
                  </button>
                  <Link className="create-button" to="/admin/partners/new">
                    Create new partner
                  </Link>
                </>
              )}
              {activeSection === 'info' && (
                <>
                  <button
                    type="button"
                    className="create-button"
                    onClick={() => {
                      setInfoOrderModalOpen(true);
                      setInfoOrderError(null);
                    }}
                  >
                    Set display order
                  </button>
                  <Link className="create-button" to="/admin/info/new">
                    Create new article
                  </Link>
                </>
              )}
              {activeSection === 'admins' && (
                <Link className="create-button" to="/admin/admins/new">
                  Create new admin
                </Link>
              )}
            </div>
          </header>

          <div className="list-tools">
            <label className="search-field" htmlFor="admin-section-search">
              <span className="search-control">
                <span className="search-icon" aria-hidden="true"></span>
                <input
                  id="admin-section-search"
                  type="search"
                  value={searchTerm}
                  placeholder={`Search ${activeLabel.toLocaleLowerCase()}`}
                  onChange={(event) => updateSearch(event.currentTarget.value)}
                />
                {searchTerm && (
                  <button type="button" aria-label="Clear search" title="Clear search" onClick={() => updateSearch('')}>
                    <span aria-hidden="true">&times;</span>
                  </button>
                )}
              </span>
            </label>
            {selectedCount > 0 && (
              <div className="selection-summary">
                <span className="selection-count">{selectedCount} selected</span>
                <button type="button" onClick={() => setSelectedIds(new Set())}>
                  Clear selection
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button className="mat-mdc-button" type="button" onClick={() => ensureSectionLoaded(activeSection, true)}>
                Try again
              </button>
            </div>
          )}

          {resetPasswordSent && (
            <div className="success-banner" role="status">
              <span>{resetPasswordSent}</span>
              <button type="button" aria-label="Dismiss" onClick={() => setResetPasswordSent(null)}>
                &times;
              </button>
            </div>
          )}

          {loading ? (
            <LoadingSpinner />
          ) : activeCount === 0 ? (
            <div className="empty-results">
              <span className="empty-results__icon" aria-hidden="true"></span>
              <h3>No {activeLabel.toLocaleLowerCase()} found</h3>
              <p>
                {searchTerm
                  ? 'Try a different search term or clear the search.'
                  : 'There are no records in this section yet.'}
              </p>
              {searchTerm && (
                <button type="button" onClick={() => updateSearch('')}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                className="table-scroll"
                ref={tableScrollRef}
                onScroll={(event) => {
                  const element = event.currentTarget;
                  setTableScrollPosition(element.scrollTop);
                  setTableScrollMaximum(Math.max(0, element.scrollHeight - element.clientHeight));
                  closeOptionsMenu();
                }}
              >
                {renderTable()}
              </div>

              <input
                className="table-scrollbar"
                type="range"
                min="0"
                max={tableScrollMaximum}
                value={tableScrollPosition}
                disabled={tableScrollMaximum === 0}
                aria-label="Scroll table"
                onChange={(event) => {
                  const position = Number(event.currentTarget.value);
                  if (tableScrollRef.current) {
                    tableScrollRef.current.scrollTop = position;
                  }
                  setTableScrollPosition(position);
                }}
              />

              <footer className="pagination" aria-label="Table pagination">
                <div className="pagination__summary">
                  <p>
                    Showing {paginationStart}–{paginationEnd} of {activeCount}
                  </p>
                  <label className="page-size-field">
                    <span>Rows per page</span>
                    <select
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(Number(event.currentTarget.value));
                        setCurrentPage(1);
                      }}
                    >
                      {PAGE_SIZE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="pagination__controls">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={activePage === 1}
                    onClick={() => setCurrentPage(Math.max(activePage - 1, 1))}
                  >
                    <span className="pagination-arrow pagination-arrow--previous" aria-hidden="true"></span>
                    Previous
                  </button>
                  <span>
                    Page {activePage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={activePage === totalPages}
                    onClick={() => setCurrentPage(Math.min(activePage + 1, totalPages))}
                  >
                    Next
                    <span className="pagination-arrow pagination-arrow--next" aria-hidden="true"></span>
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </section>

      {pendingDelete && (
        <div className="confirmation-backdrop">
          <section
            className="confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={DELETE_COPY[pendingDelete.section].titleId}
          >
            <h2 id={DELETE_COPY[pendingDelete.section].titleId}>Are you sure you want to delete {pendingDelete.label}?</h2>
            {deleteError && (
              <p className="confirmation-error" role="alert">
                {deleteError}
              </p>
            )}
            <div className="confirmation-actions">
              <button type="button" className="confirmation-cancel" disabled={deleting} onClick={cancelDelete}>
                {DELETE_COPY[pendingDelete.section].keep}
              </button>
              <button type="button" className="confirmation-delete" disabled={deleting} onClick={confirmDelete}>
                {deleting ? 'Deleting...' : DELETE_COPY[pendingDelete.section].confirm}
              </button>
            </div>
          </section>
        </div>
      )}

      {adminPendingReset && (
        <div className="confirmation-backdrop">
          <section className="confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="reset-admin-title">
            <h2 id="reset-admin-title">Send a password reset link to {adminPendingReset.email}?</h2>
            {deleteError && (
              <p className="confirmation-error" role="alert">
                {deleteError}
              </p>
            )}
            <div className="confirmation-actions">
              <button
                type="button"
                className="confirmation-cancel"
                disabled={resettingPassword}
                onClick={cancelAdminPasswordReset}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirmation-submit"
                disabled={resettingPassword}
                onClick={confirmAdminPasswordReset}
              >
                {resettingPassword ? 'Sending...' : 'Yes, send link'}
              </button>
            </div>
          </section>
        </div>
      )}

      {bulkPasswordResetPending && (
        <div className="confirmation-backdrop">
          <section
            className="confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="bulk-reset-admins-title"
          >
            <h2 id="bulk-reset-admins-title">
              Send password reset links to {selectedCount} selected {selectedCount === 1 ? 'admin' : 'admins'}?
            </h2>
            {bulkActionError && (
              <p className="confirmation-error" role="alert">
                {bulkActionError}
              </p>
            )}
            <div className="confirmation-actions">
              <button
                type="button"
                className="confirmation-cancel"
                disabled={applyingBulkAction}
                onClick={cancelBulkPasswordReset}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirmation-submit"
                disabled={applyingBulkAction}
                onClick={confirmBulkPasswordReset}
              >
                {applyingBulkAction ? 'Sending...' : 'Yes, send links'}
              </button>
            </div>
          </section>
        </div>
      )}

      {bulkDeletePending && (
        <div className="confirmation-backdrop">
          <section
            className="confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`bulk-delete-${activeSection}-title`}
          >
            <h2 id={`bulk-delete-${activeSection}-title`}>
              Delete {selectedCount} selected {itemLabelPlural}?
            </h2>
            {bulkActionError && (
              <p className="confirmation-error" role="alert">
                {bulkActionError}
              </p>
            )}
            <div className="confirmation-actions">
              <button type="button" className="confirmation-cancel" disabled={applyingBulkAction} onClick={cancelBulkDelete}>
                Keep {itemLabelPlural}
              </button>
              <button type="button" className="confirmation-delete" disabled={applyingBulkAction} onClick={confirmBulkDelete}>
                {applyingBulkAction ? 'Deleting...' : `Yes, delete ${itemLabelPlural}`}
              </button>
            </div>
          </section>
        </div>
      )}

      {bulkStatusPending && activeSection !== 'admins' && (
        <div className="confirmation-backdrop">
          <section
            className="confirmation-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`bulk-status-${activeSection}-title`}
          >
            <h2 id={`bulk-status-${activeSection}-title`}>Change status for selected {itemLabelPlural}</h2>
            <label className="bulk-status-field" htmlFor={`bulk-${activeSection}-status`}>
              <select
                id={`bulk-${activeSection}-status`}
                value={selectedBulkStatus}
                disabled={applyingBulkAction}
                onChange={(event) => setSelectedBulkStatus(Number(event.currentTarget.value))}
              >
                {STATUS_OPTIONS[activeSection].map((option) => {
                  const eligibleCount = bulkStatusEligibleCount(option.value);
                  const eligibleLabel = eligibleCount === 1 ? itemLabel : `${itemLabel}s`;
                  return (
                    <option key={option.value} value={option.value} disabled={eligibleCount === 0}>
                      {option.label} ({eligibleCount} {eligibleLabel})
                    </option>
                  );
                })}
              </select>
            </label>
            {bulkActionError && (
              <p className="confirmation-error" role="alert">
                {bulkActionError}
              </p>
            )}
            <div className="confirmation-actions">
              <button type="button" className="confirmation-cancel" disabled={applyingBulkAction} onClick={cancelBulkStatus}>
                Cancel
              </button>
              <button
                type="button"
                className="confirmation-submit"
                disabled={applyingBulkAction || bulkStatusEligibleCount(selectedBulkStatus) === 0}
                onClick={confirmBulkStatus}
              >
                {applyingBulkAction ? 'Changing...' : 'Change status'}
              </button>
            </div>
          </section>
        </div>
      )}

      <AdminDisplayOrderModal
        open={displayOrderModalOpen}
        items={activePartnersForReorder}
        itemLabel={(partner) => partner.name}
        emptyMessage="No active partners yet. Create one to set display order."
        saving={savingDisplayOrder}
        error={displayOrderError}
        onClose={() => {
          setDisplayOrderModalOpen(false);
          setDisplayOrderError(null);
        }}
        onSave={saveDisplayOrderPartners}
      />

      <AdminDisplayOrderModal
        open={infoOrderModalOpen}
        items={publishedInfoForReorder}
        itemLabel={(article) => article.title}
        emptyMessage="No published articles yet. Publish one to set display order."
        saving={savingInfoOrder}
        error={infoOrderError}
        onClose={() => {
          setInfoOrderModalOpen(false);
          setInfoOrderError(null);
        }}
        onSave={saveInfoOrder}
      />
    </Host>
  );
}
