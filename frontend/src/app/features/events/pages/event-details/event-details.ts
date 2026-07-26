import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { LoadingSpinner } from '../../../../shared';
import { EventsApi } from '../../data-access/events-api';
import { isSameCalendarDay } from '../../utils/event-date';
import { extractEventId } from '../../utils/event-url';

@Component({
  selector: 'app-event-details',
  imports: [CurrencyPipe, DatePipe, RouterLink, LoadingSpinner],
  template: `
    <main class="details-page">
      <a
        class="back"
        routerLink="/events"
        queryParamsHandling="preserve"
        aria-label="Back to events"
      >
        <span class="back-icon" aria-hidden="true"></span>
        <span class="back-label">Events</span>
      </a>

      @if (event(); as loaded) {
        <article>
          <section class="hero" [class.no-image]="!loaded.imagePath">
            @if (loaded.imagePath) {
              <div class="hero-image">
                <img
                  [src]="loaded.imagePath"
                  [alt]="loaded.title"
                  (error)="hideBrokenImage($event)"
                />
              </div>
            }

            <div class="hero-copy">
              <p class="eyebrow">ESN Gdańsk event</p>
              <h1>{{ loaded.title }}</h1>
              <p class="summary">{{ loaded.shortDescription }}</p>
            </div>
          </section>

          <section
            class="facts"
            [class.has-participants]="showParticipants && loaded.currentParticipants !== null"
            aria-label="Event information"
          >
            <div class="fact">
              <span class="fact-icon calendar" aria-hidden="true"></span>
              <div>
                <small>Date & time</small>
                <strong>{{ loaded.startsAt | date: 'EEEE, d MMMM yyyy' }}</strong>
                <span>
                  {{ loaded.startsAt | date: 'HH:mm' }}
                  @if (loaded.endsAt && !isSameDay(loaded.startsAt, loaded.endsAt)) {
                    – {{ loaded.endsAt | date: 'd MMM yyyy, HH:mm' }}
                  }
                </span>
              </div>
            </div>

            <div class="fact">
              <span class="fact-icon marker" aria-hidden="true"></span>
              <div>
                <small>Location</small>
                <strong>{{ loaded.location }}</strong>
              </div>
            </div>

            <div class="fact">
              <span class="fact-icon wallet" aria-hidden="true"></span>
              <div>
                <small>Price</small>
                <strong>
                  {{ loaded.price === 0 ? 'Free' : (loaded.price | currency: 'PLN') }}
                </strong>
              </div>
            </div>

            @if (showParticipants && loaded.currentParticipants !== null) {
              <div class="fact participants-fact">
                <span class="fact-icon users" aria-hidden="true"></span>
                <div>
                  <small>Participants</small>
                  <strong>
                    {{ loaded.currentParticipants }}
                    @if (loaded.maximumParticipants !== null) {
                      / {{ loaded.maximumParticipants }}
                    }
                    going
                  </strong>
                  @if (loaded.minimumParticipants !== null) {
                    <span>Minimum {{ loaded.minimumParticipants }}</span>
                  }
                </div>
              </div>
            }
          </section>

          <section class="about">
            <p class="eyebrow">About the event</p>
            <p>{{ loaded.description }}</p>
          </section>

          @if (loaded.registrationUrl) {
            <a
              class="register"
              [href]="loaded.registrationUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              Register for this event
              <span aria-hidden="true">→</span>
            </a>
          }
        </article>
      } @else if (event() === null) {
        <section class="not-found">
          <h1>Event not found</h1>
          <p>This event may no longer be available.</p>
          <a routerLink="/events">Return to events</a>
        </section>
      } @else {
        <app-loading-spinner />
      }
    </main>
  `,
  styles: `
    :host {
      --accent: #7ac143;
      display: block;
    }

    .details-page {
      margin: 0 auto;
      max-width: 48rem;
    }

    .back {
      align-items: center;
      color: #111;
      display: inline-flex;
      font-size: 0.8rem;
      font-weight: 700;
      gap: 0.4rem;
      margin-bottom: 1rem;
      text-decoration: none;
    }

    .back-icon {
      background: var(--accent);
      height: 2rem;
      mask: url('/icons/arrow-circle-left.svg') center / contain no-repeat;
      width: 2rem;
    }

    article {
      display: grid;
      gap: 1rem;
    }

    .hero {
      border: 1px solid var(--accent);
      border-radius: 2rem;
      display: grid;
      gap: 1.5rem;
      grid-template-columns: minmax(13rem, 42%) 1fr;
      overflow: hidden;
      padding: 0.75rem;
    }

    .hero-image {
      align-items: center;
      background: #fff;
      border-radius: 1.35rem;
      display: flex;
      justify-content: center;
      min-height: 18rem;
      overflow: hidden;
      position: relative;
    }

    .hero-image img {
      height: 100%;
      inset: 0;
      object-fit: cover;
      position: absolute;
      width: 100%;
    }

    .hero-copy {
      align-self: end;
      padding: 1.25rem 1.25rem 1.25rem 0;
    }

    .hero.no-image {
      grid-template-columns: 1fr;
    }

    .hero.no-image .hero-copy {
      padding: 2rem;
    }

    .eyebrow {
      color: var(--accent);
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      margin: 0 0 0.5rem;
      text-transform: uppercase;
    }

    h1 {
      font-size: clamp(2.2rem, 7vw, 4rem);
      font-weight: 800;
      letter-spacing: -0.055em;
      line-height: 0.92;
      margin: 0;
    }

    .summary {
      color: #555;
      line-height: 1.45;
      margin: 1rem 0 0;
    }

    .facts {
      border: 1px solid var(--accent);
      border-radius: 1.5rem;
      display: grid;
      gap: 0;
      grid-template-columns: 1fr;
      overflow: hidden;
    }

    .fact {
      align-items: center;
      display: flex;
      gap: 0.8rem;
      min-height: 4.5rem;
      padding: 0.8rem 1rem;
    }

    .fact + .fact {
      border-top: 1px solid #ddd;
    }

    .fact div {
      display: grid;
      gap: 0.1rem;
    }

    .fact small,
    .fact span {
      color: #777;
      font-size: 0.7rem;
    }

    .fact strong {
      font-size: 0.85rem;
    }

    .fact-icon {
      background: var(--accent);
      flex: 0 0 auto;
      height: 1.35rem;
      width: 1.35rem;
    }

    .calendar {
      mask: url('/icons/calendar.svg') center / contain no-repeat;
    }

    .marker {
      mask: url('/icons/marker.svg') center / contain no-repeat;
    }

    .wallet {
      mask: url('/icons/wallet.svg') center / contain no-repeat;
    }

    .users {
      mask: url('/icons/users.svg') center / contain no-repeat;
    }

    .about {
      border: 1px solid var(--accent);
      border-radius: 1.5rem;
      padding: 1.5rem;
    }

    .about > p:last-child {
      line-height: 1.6;
      margin: 0;
      white-space: pre-line;
    }

    .register {
      align-items: center;
      background: var(--accent);
      border-radius: 100px;
      color: #fff;
      display: flex;
      font-weight: 800;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      text-decoration: none;
    }

    .register span {
      font-size: 1.4rem;
    }

    .not-found {
      border: 1px solid var(--accent);
      border-radius: 1.5rem;
      padding: 2rem;
    }

    .not-found h1 {
      font-size: 2rem;
    }

    @media (min-width: 701px) {
      .facts {
        grid-template-columns: repeat(3, 1fr);
      }

      .facts.has-participants {
        grid-template-columns: repeat(2, 1fr);
      }

      .fact {
        border-right: 1px solid #ddd;
      }

      .fact + .fact {
        border-top: 0;
      }

      .fact:last-child,
      .facts.has-participants .fact:nth-child(2) {
        border-right: 0;
      }

      .facts.has-participants .fact:nth-child(n + 3) {
        border-top: 1px solid #ddd;
      }
    }

    @media (max-width: 700px) {
      .back {
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 3px 10px rgba(17, 17, 17, 0.1);
        height: 2.5rem;
        margin-bottom: 0.75rem;
        position: sticky;
        top: 0.5rem;
        width: 2.5rem;
        z-index: 10;
      }

      .back-icon {
        height: 2.5rem;
        width: 2.5rem;
      }

      .back-label {
        display: none;
      }

      .hero {
        grid-template-columns: 1fr;
      }

      .hero-image {
        min-height: 14rem;
      }

      .hero-copy {
        padding: 0.5rem 0.75rem 1rem;
      }

      .hero.no-image .hero-copy {
        padding: 1rem 0.75rem;
      }
    }
  `,
})
export class EventDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(EventsApi);

  protected readonly showParticipants = true;
  protected readonly isSameDay = isSameCalendarDay;

  readonly event = toSignal(
    this.route.paramMap.pipe(
      map((params) => extractEventId(params.get('eventSlug') ?? '')),
      switchMap((id) => (id ? this.api.getById(id) : of(null))),
      catchError(() => of(null)),
    ),
  );

  hideBrokenImage(event: Event): void {
    const image = event.currentTarget as HTMLImageElement;
    image.closest('.hero')?.classList.add('no-image');
    image.closest('.hero-image')?.remove();
  }
}
