import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ImageFade, Skeleton, StaggerIn } from '../../../shared';
import { NewsApi } from '../data-access/news-api';
import { NewsItemDto } from '../data-access/news.models';
import { newsTileColour } from '../utils/news-tile-colour';

@Component({
  selector: 'app-home-highlights',
  imports: [DatePipe, MatIconModule, RouterLink, ImageFade, Skeleton, StaggerIn],
  templateUrl: './home-highlights.html',
  styleUrl: './home-highlights.scss',
})
export class HomeHighlights implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild('newsCarousel') private carousel?: ElementRef<HTMLElement>;

  private readonly newsApi = inject(NewsApi);
  protected readonly activeIndex = signal(0);
  protected readonly newsItems = signal<NewsItemDto[]>([]);
  protected readonly loaded = signal(false);
  protected readonly brokenImages = signal<ReadonlySet<string>>(new Set());
  /** Only the most recent published story gets the "New" sticker. */
  protected readonly newestId = computed(
    () =>
      this.newsItems()
        .filter((item) => item.status !== 0)
        .reduce<NewsItemDto | null>(
          (newest, item) => (!newest || item.createdAt > newest.createdAt ? item : newest),
          null,
        )?.id ?? null,
  );
  protected readonly newsTileColour = newsTileColour;
  private autoAdvanceTimer?: ReturnType<typeof setInterval>;
  private newsSubscription?: Subscription;
  private programmaticTargetIndex: number | null = null;
  private viewInitialized = false;

  ngOnInit(): void {
    this.newsSubscription = this.newsApi.getAll().subscribe({
      next: (items) => {
        this.newsItems.set(items);
        this.loaded.set(true);
        this.activeIndex.set(0);
        this.programmaticTargetIndex = null;

        if (this.viewInitialized) {
          this.restartAutoAdvance();
        }
      },
      error: () => {
        this.newsItems.set([]);
        this.loaded.set(true);
        this.clearAutoAdvance();
      },
    });
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;

    if (this.newsItems().length > 1) {
      this.restartAutoAdvance();
    }
  }

  ngOnDestroy(): void {
    this.newsSubscription?.unsubscribe();
    this.clearAutoAdvance();
  }

  protected markImageBroken(id: string): void {
    this.brokenImages.update((ids) => new Set(ids).add(id));
  }

  protected updateActiveCard(event: Event): void {
    const carousel = event.currentTarget as HTMLElement;
    const cards = Array.from(carousel.querySelectorAll<HTMLElement>('.news-card'));
    const carouselCenter = carousel.getBoundingClientRect().left + carousel.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const bounds = card.getBoundingClientRect();
      const distance = Math.abs(carouselCenter - (bounds.left + bounds.width / 2));

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (this.programmaticTargetIndex !== null) {
      if (nearestIndex === this.programmaticTargetIndex) {
        this.programmaticTargetIndex = null;
      } else {
        return;
      }
    }

    if (this.activeIndex() !== nearestIndex) {
      this.activeIndex.set(nearestIndex);
      this.restartAutoAdvance();
    }
  }

  protected moveCard(carousel: HTMLElement, direction: -1 | 1): void {
    const cards = Array.from(carousel.querySelectorAll<HTMLElement>('.news-card'));
    const nextIndex = Math.max(0, Math.min(cards.length - 1, this.activeIndex() + direction));

    this.scrollToCard(carousel, cards[nextIndex], nextIndex);
    this.activeIndex.set(nextIndex);
    this.restartAutoAdvance();
  }

  private restartAutoAdvance(): void {
    this.clearAutoAdvance();

    if (this.newsItems().length < 2) {
      return;
    }

    this.autoAdvanceTimer = setInterval(() => this.advanceAutomatically(), 5000);
  }

  private clearAutoAdvance(): void {
    if (this.autoAdvanceTimer) {
      clearInterval(this.autoAdvanceTimer);
      this.autoAdvanceTimer = undefined;
    }
  }

  private advanceAutomatically(): void {
    if (document.hidden) {
      return;
    }

    const carousel = this.carousel?.nativeElement;

    if (!carousel) {
      return;
    }

    const cards = Array.from(carousel?.querySelectorAll<HTMLElement>('.news-card') ?? []);

    if (cards.length === 0) {
      return;
    }

    const nextIndex = (this.activeIndex() + 1) % cards.length;
    this.scrollToCard(carousel, cards[nextIndex], nextIndex);
    this.activeIndex.set(nextIndex);
  }

  private scrollToCard(carousel: HTMLElement, card: HTMLElement | undefined, targetIndex: number): void {
    if (!card) {
      return;
    }

    this.programmaticTargetIndex = targetIndex;
    const centeredPosition = card.offsetLeft - (carousel.clientWidth - card.offsetWidth) / 2;
    carousel.scrollTo({
      behavior: 'smooth',
      left: centeredPosition,
      top: 0,
    });
  }
}
