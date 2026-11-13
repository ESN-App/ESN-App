import { useCallback, useEffect, useRef, useState, type UIEvent } from 'react';
import { Link } from 'react-router';
import { Host } from '../../../shared/host';
import { newsApi } from '../data-access/news-api';
import type { NewsItemDto } from '../data-access/news.models';
import './home-highlights.scss';

const AUTO_ADVANCE_MS = 5000;

function scrollToCard(carousel: HTMLElement, card: HTMLElement | undefined): void {
  if (!card) {
    return;
  }
  const centeredPosition = card.offsetLeft - (carousel.clientWidth - card.offsetWidth) / 2;
  carousel.scrollTo({ behavior: 'smooth', left: centeredPosition, top: 0 });
}

function cardsOf(carousel: HTMLElement): HTMLElement[] {
  return Array.from(carousel.querySelectorAll<HTMLElement>('.news-card'));
}

export function HomeHighlights() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const programmaticTargetIndex = useRef<number | null>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndexState] = useState(0);
  const [newsItems, setNewsItems] = useState<NewsItemDto[]>([]);
  // Bumped whenever the auto-advance timer should restart (manual navigation, new data).
  const [timerEpoch, setTimerEpoch] = useState(0);

  const setActiveIndex = useCallback((index: number) => {
    activeIndexRef.current = index;
    setActiveIndexState(index);
  }, []);

  useEffect(() => {
    let active = true;
    newsApi.getAll().then(
      (items) => {
        if (!active) return;
        setNewsItems(items);
        setActiveIndex(0);
        programmaticTargetIndex.current = null;
        setTimerEpoch((epoch) => epoch + 1);
      },
      () => active && setNewsItems([]),
    );
    return () => {
      active = false;
    };
  }, [setActiveIndex]);

  useEffect(() => {
    if (newsItems.length < 2) {
      return;
    }

    const timer = setInterval(() => {
      const carousel = carouselRef.current;
      if (document.hidden || !carousel) {
        return;
      }
      const cards = cardsOf(carousel);
      if (cards.length === 0) {
        return;
      }
      const nextIndex = (activeIndexRef.current + 1) % cards.length;
      programmaticTargetIndex.current = nextIndex;
      scrollToCard(carousel, cards[nextIndex]);
      setActiveIndex(nextIndex);
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(timer);
  }, [newsItems.length, timerEpoch, setActiveIndex]);

  const updateActiveCard = (event: UIEvent<HTMLDivElement>) => {
    const carousel = event.currentTarget;
    const carouselCenter = carousel.getBoundingClientRect().left + carousel.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    cardsOf(carousel).forEach((card, index) => {
      const bounds = card.getBoundingClientRect();
      const distance = Math.abs(carouselCenter - (bounds.left + bounds.width / 2));
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (programmaticTargetIndex.current !== null) {
      if (nearestIndex === programmaticTargetIndex.current) {
        programmaticTargetIndex.current = null;
      } else {
        return;
      }
    }

    if (activeIndexRef.current !== nearestIndex) {
      setActiveIndex(nearestIndex);
      setTimerEpoch((epoch) => epoch + 1);
    }
  };

  const moveCard = (direction: -1 | 1) => {
    const carousel = carouselRef.current;
    if (!carousel) {
      return;
    }
    const cards = cardsOf(carousel);
    const nextIndex = Math.max(0, Math.min(cards.length - 1, activeIndexRef.current + direction));
    programmaticTargetIndex.current = nextIndex;
    scrollToCard(carousel, cards[nextIndex]);
    setActiveIndex(nextIndex);
    setTimerEpoch((epoch) => epoch + 1);
  };

  return (
    <Host tag="app-home-highlights">
      {newsItems.length > 0 && (
        <section className="news-section" aria-labelledby="news-title">
          <header className="news-header">
            <div>
              <p>Fresh from ESN</p>
              <h2 id="news-title">What’s new</h2>
            </div>
            <span>Swipe to explore</span>
          </header>

          <div className="news-carousel-shell">
            <button
              className="news-button previous"
              type="button"
              aria-label="Show previous story"
              disabled={activeIndex === 0}
              onClick={() => moveCard(-1)}
            >
              <span aria-hidden="true"></span>
            </button>

            <div
              ref={carouselRef}
              className="news-carousel"
              role="region"
              aria-label="Latest ESN stories"
              onScroll={updateActiveCard}
            >
              {newsItems.map((item, itemIndex) => (
                <Link
                  key={item.id}
                  className={`news-card${item.status === 0 ? ' news-card--draft' : ''}${activeIndex === itemIndex ? ' active' : ''}`}
                  to={`/news/${item.id}`}
                  aria-label={`Open ${item.title}`}
                >
                  <img src={item.imagePath} alt={item.title} loading={itemIndex === 0 ? 'eager' : 'lazy'} />
                  <span className="news-overlay">
                    <span className={`news-badge${item.status === 0 ? ' draft-badge' : ''}`}>
                      {item.status === 0 ? 'Draft' : 'New'}
                    </span>
                    <strong>{item.title}</strong>
                  </span>
                </Link>
              ))}
            </div>

            <button
              className="news-button next"
              type="button"
              aria-label="Show next story"
              disabled={activeIndex === newsItems.length - 1}
              onClick={() => moveCard(1)}
            >
              <span aria-hidden="true"></span>
            </button>

            <div className="news-progress" aria-hidden="true">
              {newsItems.map((item, itemIndex) => (
                <span key={item.id} className={activeIndex === itemIndex ? 'active' : undefined}></span>
              ))}
            </div>
          </div>
        </section>
      )}
    </Host>
  );
}
