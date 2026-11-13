import { useState, type UIEvent } from 'react';
import { Link } from 'react-router';
import { Host } from '../../shared/host';
import { HomeHighlights } from './home-highlights/home-highlights';
import './home-page.scss';

type StandaloneNavigator = Navigator & { standalone?: boolean };

function detectStandaloneMode(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.matchMedia?.('(display-mode: fullscreen)').matches === true ||
    (window.navigator as StandaloneNavigator).standalone === true
  );
}

const TILES = [
  {
    className: 'events-tile',
    to: '/events',
    title: 'Events',
    description: 'Trips, activities and meetups prepared for ESN members.',
  },
  {
    className: 'partners-tile',
    to: '/partners',
    title: 'Partners',
    description: 'Student discounts and special offers from local partners.',
  },
  {
    className: 'info-tile',
    to: '/info',
    title: 'Info',
    description: 'Practical information and useful tips for life in Gdańsk.',
  },
];

export default function HomePage() {
  const [isStandalone] = useState(detectStandaloneMode);
  const [activeTileIndex, setActiveTileIndex] = useState(0);

  const updateActiveTile = (event: UIEvent<HTMLElement>) => {
    const carousel = event.currentTarget;
    const carouselCenter = carousel.getBoundingClientRect().left + carousel.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    carousel.querySelectorAll<HTMLElement>('.section-tile').forEach((tile, index) => {
      const bounds = tile.getBoundingClientRect();
      const distance = Math.abs(carouselCenter - (bounds.left + bounds.width / 2));
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveTileIndex(nearestIndex);
  };

  return (
    <Host tag="app-home-page">
      <section className="home-page">
        <header className="home-header">
          <div className="page-heading">
            <img src="/images/esnstar.png" alt="" />
            <div>
              <p className="eyebrow">ESN Gdańsk</p>
              <h1>Home</h1>
            </div>
          </div>
        </header>

        <HomeHighlights />

        <section className="community-section" aria-label="About ESN Gdańsk and office information">
          <article className="about-card">
            <div>
              <p className="about-label">Who we are</p>
              <h2>Meet ESN Gdańsk</h2>
              <p className="about-intro">
                ESN Gdańsk is a volunteer-led student association that helps international students
                feel at home from their first days in the city.
              </p>
              <p className="about-copy">
                We connect people across cultures through events, trips, local knowledge and everyday
                support. Our goal is simple: make your exchange easier, more social and full of
                experiences worth remembering.
              </p>
            </div>

            <ul className="about-highlights" aria-label="What ESN Gdańsk offers">
              <li>
                <span aria-hidden="true"></span>Local student volunteers
              </li>
              <li>
                <span aria-hidden="true"></span>An international community
              </li>
              <li>
                <span aria-hidden="true"></span>Practical support in Gdańsk
              </li>
            </ul>
          </article>

          <article className="office-card">
            <figure className="office-photo">
              <img
                src="/images/esn-office.jpg"
                alt="A warm student organization office with a shared table and colorful chairs"
                loading="lazy"
              />
              <figcaption>Illustrative office photo</figcaption>
            </figure>

            <div className="office-copy">
              <p className="office-label">Come say hi</p>
              <h2>Visit our office</h2>

              <div className="office-details">
                <div className="office-detail">
                  <span className="office-icon location" aria-hidden="true"></span>
                  <div>
                    <strong>Address</strong>
                    <p>
                      Gdańsk University of Technology
                      <br />
                      Building 14 “Misiówka”, room 001
                      <br />
                      ul. Narutowicza 11/12, 80-233 Gdańsk
                    </p>
                  </div>
                </div>

                <div className="office-detail">
                  <span className="office-icon hours" aria-hidden="true"></span>
                  <div>
                    <strong>Office hours</strong>
                    <p>Announced weekly during the semester.</p>
                    <small>Please check the latest ESN Gdańsk update before visiting.</small>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="welcome-panel" aria-labelledby="welcome-title">
          <div className="welcome-copy">
            <p className="panel-label">Your Erasmus companion</p>
            <h2 id="welcome-title">Everything you need to enjoy Gdańsk</h2>
            <p>
              This is your guide to student life with ESN Gdańsk. Discover upcoming activities,
              benefits from our local partners, and practical information for making the most of
              your stay.
            </p>
          </div>

          <nav className="section-tiles" aria-label="Explore ESN Gdańsk" onScroll={updateActiveTile}>
            {TILES.map((tile, index) => (
              <article
                key={tile.to}
                className={`section-tile ${tile.className}${activeTileIndex === index ? ' active' : ''}`}
              >
                <Link className="mobile-tile-link" to={tile.to} aria-label={`Check out ${tile.title}`}></Link>
                <div className="tile-body">
                  <span className="tile-icon" aria-hidden="true"></span>
                  <span className="tile-copy">
                    <strong>{tile.title}</strong>
                    <span className="tile-description">{tile.description}</span>
                  </span>
                  <Link className="tile-action" to={tile.to} aria-label={`Check out ${tile.title}`}>
                    <span className="tile-arrow" aria-hidden="true"></span>
                  </Link>
                </div>
              </article>
            ))}
          </nav>

          <div className="carousel-progress" aria-hidden="true">
            {TILES.map((tile, index) => (
              <span key={tile.to} className={activeTileIndex === index ? 'active' : undefined}></span>
            ))}
          </div>
        </section>

        {!isStandalone && (
          <section className="install-guide" aria-labelledby="install-title">
            <div className="install-heading">
              <p className="install-label">Keep ESN close</p>
              <h2 id="install-title">Add this app to your home screen</h2>
              <p>Open it like a regular mobile app and get back to it in one tap.</p>
            </div>

            <div className="platforms">
              <article className="platform-card">
                <div className="platform-title">
                  <span className="platform-mark" aria-hidden="true">
                    <img src="/icons/apple.svg" alt="" />
                  </span>
                  <h3>iPhone &amp; iPad</h3>
                </div>
                <ol>
                  <li>
                    Open this page in <strong>Safari</strong>.
                  </li>
                  <li>
                    Tap the <strong>Share</strong> button.
                  </li>
                  <li>
                    Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
                  </li>
                </ol>
              </article>

              <article className="platform-card">
                <div className="platform-title">
                  <span className="platform-mark android-mark" aria-hidden="true">
                    <img src="/icons/android.svg" alt="" />
                  </span>
                  <h3>Android</h3>
                </div>
                <ol>
                  <li>
                    Open this page in <strong>Chrome</strong>.
                  </li>
                  <li>
                    Tap the <strong>three-dot menu</strong>.
                  </li>
                  <li>
                    Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </li>
                </ol>
              </article>
            </div>
          </section>
        )}
      </section>
    </Host>
  );
}
