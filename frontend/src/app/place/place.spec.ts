/**
 * LSA-B3: the place page loads places and districts by id, shows a not-found
 * state for bad ids, and sets per-place SEO.
 */
import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PlaceComponent } from './place';
import { District, Poi } from '../core/models';

const ID = '0b6c1e9e-3a2f-4f7e-9d7a-1c2b3d4e5f60';

const poi: Poi = {
  source: 'community',
  sourceUrl: null,
  lastVerifiedAt: null,
  address: null,
  website: null,
  openingHours: null,
  ratingCount: 0,
  communityRating: null,
  id: ID,
  name: 'Rainbow Cafe',
  description: 'A cosy, welcoming cafe.',
  category: 'cafe',
  safetyRating: 5,
  wheelchairAccessible: true,
  location: { type: 'Point', coordinates: [4.35, 50.85] },
  status: 'approved',
  voteCount: 0,
  createdBy: { id: 'u1', displayName: 'Alex', pronouns: null, avatar: null },
  createdAt: '2026-01-01T00:00:00Z',
  isAnonymous: false,
};

const district: District = {
  source: 'community',
  sourceUrl: null,
  lastVerifiedAt: null,
  id: ID,
  name: 'Safe Quarter',
  description: '',
  safetyRating: 4,
  wheelchairAccessible: false,
  area: {
    type: 'Polygon',
    coordinates: [
      [
        [4, 50],
        [5, 50],
        [5, 51],
        [4, 50],
      ],
    ],
  },
  status: 'approved',
  voteCount: 0,
  createdBy: null,
  createdAt: '2026-01-01T00:00:00Z',
  isAnonymous: true,
  blendEdges: false,
};

describe('PlaceComponent (LSA-B3)', () => {
  let fixture: ComponentFixture<PlaceComponent>;
  let http: HttpTestingController;

  async function open(id: string) {
    await TestBed.configureTestingModule({
      imports: [PlaceComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id })) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PlaceComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  const render = () => {
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const notFound = { status: 404, statusText: 'Not Found' };
  const robots = () => document.querySelector('meta[name="robots"]')?.getAttribute('content');
  const canonical = () => document.querySelector('link[rel="canonical"]')?.getAttribute('href');

  afterEach(() => {
    // Approved places also load their community ratings (LSA-F5).
    http.match((req) => req.url.endsWith('/ratings')).forEach((req) => req.flush([]));
    http.verify();
  });

  describe('with a place id', () => {
    beforeEach(async () => {
      await open(ID);
      http.expectOne(`/api/pois/${ID}`).flush(poi);
    });

    it('renders the place', () => {
      const page = render();
      expect(page.querySelector('h1')?.textContent).toContain('Rainbow Cafe');
      expect(page.textContent).toContain('Community submission by Alex');
    });

    it('sets a per-place title, description and canonical URL', () => {
      expect(TestBed.inject(Title).getTitle()).toBe('Rainbow Cafe · Cafe | Colours of Safety');
      expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
        'A cosy, welcoming cafe.',
      );
      expect(canonical()).toBe(`https://coloursofsafety.com/place/${ID}`);
      expect(robots()).toBe('index,follow');
    });

    it('links to the map centred on the place', () => {
      const link = render().querySelector<HTMLAnchorElement>('a.view-on-map')!;
      expect(link.getAttribute('href')).toBe('/?lat=50.850000&lng=4.350000&z=17');
    });
  });

  it('falls back to the district endpoint when no place has that id', async () => {
    await open(ID);
    http.expectOne(`/api/pois/${ID}`).flush({ message: 'nope' }, notFound);
    http.expectOne(`/api/districts/${ID}`).flush(district);

    const page = render();
    expect(page.querySelector('h1')?.textContent).toContain('Safe Quarter');
    expect(page.textContent).toContain('Community submission by Anonymous');
  });

  it('shows a not-found state (not an error) and noindex for unknown ids', async () => {
    await open(ID);
    http.expectOne(`/api/pois/${ID}`).flush({ message: 'nope' }, notFound);
    http.expectOne(`/api/districts/${ID}`).flush({ message: 'nope' }, notFound);

    const page = render();
    expect(page.querySelector('h1')?.textContent).toContain('Place not found');
    expect(robots()).toBe('noindex,nofollow');
  });

  it('does not call the API for malformed ids', async () => {
    await open('not-a-uuid');

    expect(render().querySelector('h1')?.textContent).toContain('Place not found');
  });

  it('shows an error state (not "not found") when the server fails', async () => {
    await open(ID);
    http
      .expectOne(`/api/pois/${ID}`)
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

    const page = render();
    expect(page.querySelector('h1')?.textContent).toContain('Place unavailable');
    expect(page.querySelector('[role="alert"]')).not.toBeNull();
  });

  describe('provenance and details (LSA-B12, LSA-F2, LSA-F13)', () => {
    it('flags an unconfirmed import and hides its placeholder rating', async () => {
      await open(ID);
      http.expectOne(`/api/pois/${ID}`).flush({
        ...poi,
        source: 'wikidata',
        sourceUrl: 'https://www.wikidata.org/wiki/Q1',
        lastVerifiedAt: null,
      });
      const page = render();

      expect(page.querySelector('.provenance-banner')?.textContent).toContain(
        'not yet community-verified',
      );
      expect(page.querySelector('.provenance-banner a')?.getAttribute('href')).toBe(
        'https://www.wikidata.org/wiki/Q1',
      );
      expect(page.querySelector('.rating')?.textContent).toContain('Not yet rated');
    });

    it('shows contact details and an OpenStreetMap directions link', async () => {
      await open(ID);
      http.expectOne(`/api/pois/${ID}`).flush({
        ...poi,
        address: 'Rue Haute 1, 1000 Brussels',
        website: 'https://rainbow.example',
        openingHours: 'Tu-Su 10:00-18:00',
        lastVerifiedAt: '2026-09-30T12:00:00Z',
      });
      const page = render();
      const details = page.querySelector('.details')!;

      expect(details.textContent).toContain('Rue Haute 1, 1000 Brussels');
      expect(details.textContent).toContain('Tu-Su 10:00-18:00');
      expect(
        details.querySelector('a[href="https://rainbow.example"]')?.getAttribute('rel'),
      ).toContain('noopener');
      expect(
        details.querySelector('a[href^="https://www.openstreetmap.org/directions"]'),
      ).not.toBeNull();
      expect(page.querySelector('.provenance-banner')).toBeNull();
      const verified = page.querySelector('.contribution time[datetime="2026-09-30T12:00:00Z"]');
      expect(verified?.textContent).toContain('2026');
    });
  });
});
