import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import 'leaflet-draw';
import { AuthService } from '../core/auth.service';
import { MarkingsService } from '../core/markings.service';
import { CreateDistrictPayload, CreatePoiPayload, GeoPolygon, Poi, District } from '../core/models';
import { POI_CATEGORIES, safetyColor, safetyLabel } from '../core/safety';

type DraftKind = 'poi' | 'district';

interface Draft {
  kind: DraftKind;
  layer: L.Layer;
  location?: [number, number]; // [lng, lat] for POIs
  area?: GeoPolygon; // for districts
}

@Component({
  selector: 'app-map',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './map.html',
  styleUrl: './map.scss',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  private readonly auth = inject(AuthService);
  private readonly markings = inject(MarkingsService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  protected readonly isLoggedIn = this.auth.isLoggedIn;
  protected readonly categories = POI_CATEGORIES;
  protected readonly safetyLabel = safetyLabel;
  protected readonly colorFor = safetyColor;

  protected readonly draft = signal<Draft | null>(null);
  protected readonly toast = signal<string | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);

  // Filters
  protected readonly selectedCategory = signal<string>('all');
  protected readonly minSafetyRating = signal<number>(1);

  // Stats for social proof
  protected readonly approvedCount = signal<{ pois: number; districts: number }>({
    pois: 0,
    districts: 0,
  });

  // Search
  protected readonly searchQuery = signal<string>('');
  protected readonly searching = signal<boolean>(false);

  // Data storage for filtering
  private allPois: Poi[] = [];
  private allDistricts: District[] = [];

  // Welcome prompt for new users
  protected readonly showWelcome = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    category: ['other'],
    safetyRating: [5, [Validators.required]],
  });

  private map!: L.Map;
  private dataLayer!: L.LayerGroup;
  private draftLayer!: L.LayerGroup;

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl.nativeElement, {
      center: [50.8503, 4.3517], // Brussels
      zoom: 12,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.dataLayer = L.layerGroup().addTo(this.map);
    this.draftLayer = L.layerGroup().addTo(this.map);

    if (this.isLoggedIn()) {
      this.addDrawControls();
    }

    this.map.on('draw:created', (e) => this.onShapeCreated(e as L.DrawEvents.Created));

    this.loadData();

    // Check for welcome query param (post-registration)
    this.route.queryParams.subscribe((params) => {
      if (params['welcome'] === 'true') {
        this.showWelcome.set(true);
        setTimeout(() => this.showWelcome.set(false), 10000);
      }
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private addDrawControls(): void {
    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        marker: false,
        circle: false,
        circlemarker: { color: '#e84393' },
        polyline: false,
        rectangle: false,
        polygon: {
          allowIntersection: false,
          shapeOptions: { color: '#e84393' },
        },
      },
      edit: undefined,
    });
    this.map.addControl(drawControl);
  }

  private onShapeCreated(event: L.DrawEvents.Created): void {
    this.clearDraft();
    const layer = event.layer;

    if (event.layerType === 'circlemarker' && layer instanceof L.CircleMarker) {
      const { lat, lng } = layer.getLatLng();
      layer.setStyle({ color: '#e84393', fillColor: '#e84393' });
      this.draftLayer.addLayer(layer);
      this.resetForm();
      this.draft.set({ kind: 'poi', layer, location: [lng, lat] });
    } else if (event.layerType === 'polygon' && layer instanceof L.Polygon) {
      const area = this.polygonToGeoJson(layer);
      if (!area) {
        return;
      }
      this.draftLayer.addLayer(layer);
      this.resetForm();
      this.form.controls.category.setValue('other');
      this.draft.set({ kind: 'district', layer, area });
    }
  }

  private polygonToGeoJson(layer: L.Polygon): GeoPolygon | null {
    const latlngs = layer.getLatLngs()[0] as L.LatLng[];
    if (!Array.isArray(latlngs) || latlngs.length < 3) {
      return null;
    }
    const ring = latlngs.map((p): [number, number] => [p.lng, p.lat]);
    ring.push([...ring[0]]); // close the ring
    return { type: 'Polygon', coordinates: [ring] };
  }

  protected submit(): void {
    const draft = this.draft();
    if (!draft || this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const value = this.form.getRawValue();

    if (draft.kind === 'poi' && draft.location) {
      const payload: CreatePoiPayload = {
        name: value.name,
        description: value.description,
        category: value.category,
        safetyRating: value.safetyRating,
        location: { type: 'Point', coordinates: draft.location },
      };
      this.markings.createPoi(payload).subscribe({
        next: () => this.onSubmitted(),
        error: () => this.onSubmitError(),
      });
    } else if (draft.kind === 'district' && draft.area) {
      const payload: CreateDistrictPayload = {
        name: value.name,
        description: value.description,
        safetyRating: value.safetyRating,
        area: draft.area,
      };
      this.markings.createDistrict(payload).subscribe({
        next: () => this.onSubmitted(),
        error: () => this.onSubmitError(),
      });
    }
  }

  private onSubmitted(): void {
    this.submitting.set(false);
    this.clearDraft();
    this.showSuccessToast(
      'Thanks! Your submission helps the community. It will be visible once approved.',
    );
    this.reloadStats();
  }

  private reloadStats(): void {
    this.markings.getApprovedPois().subscribe((pois) => {
      this.allPois = pois;
      this.approvedCount.update((c) => ({ ...c, pois: pois.length }));
      this.applyFilters();
    });
    this.markings.getApprovedDistricts().subscribe((districts) => {
      this.allDistricts = districts;
      this.approvedCount.update((c) => ({ ...c, districts: districts.length }));
      this.applyFilters();
    });
  }

  private onSubmitError(): void {
    this.submitting.set(false);
    this.showToast('Could not save your submission. Please try again.');
  }

  protected cancelDraft(): void {
    this.clearDraft();
  }

  private clearDraft(): void {
    this.draftLayer.clearLayers();
    this.draft.set(null);
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      description: '',
      category: 'other',
      safetyRating: 5,
    });
  }

  private showToast(message: string, duration = 4000): void {
    this.toast.set(message);
    setTimeout(() => this.toast.set(null), duration);
  }

  private showSuccessToast(message: string): void {
    this.toast.set(message);
    setTimeout(() => this.toast.set(null), 5000);
  }

  protected applyFilters(): void {
    this.dataLayer.clearLayers();

    const category = this.selectedCategory();
    const minRating = this.minSafetyRating();

    // Filter POIs
    const filteredPois = this.allPois.filter((poi) => {
      if (category !== 'all' && poi.category !== category) return false;
      if (poi.safetyRating < minRating) return false;
      return true;
    });

    for (const poi of filteredPois) {
      const [lng, lat] = poi.location.coordinates;
      const marker = L.circleMarker([lat, lng], {
        radius: 9,
        color: safetyColor(poi.safetyRating),
        fillColor: safetyColor(poi.safetyRating),
        fillOpacity: 0.85,
        weight: 2,
      });
      marker.bindPopup(this.poiPopup(poi.name, poi));
      this.dataLayer.addLayer(marker);
    }

    // Filter Districts
    const filteredDistricts = this.allDistricts.filter((district) => {
      if (district.safetyRating < minRating) return false;
      return true;
    });

    for (const district of filteredDistricts) {
      const ring = district.area.coordinates[0].map(([lng, lat]): [number, number] => [lat, lng]);
      const polygon = L.polygon(ring, {
        color: safetyColor(district.safetyRating),
        fillColor: safetyColor(district.safetyRating),
        fillOpacity: 0.25,
        weight: 2,
      });
      polygon.bindPopup(
        this.districtPopup(district.name, district.description, district.safetyRating),
      );
      this.dataLayer.addLayer(polygon);
    }
  }

  protected onCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedCategory.set(value);
    this.applyFilters();
  }

  protected onRatingChange(event: Event): void {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    this.minSafetyRating.set(value);
    this.applyFilters();
  }

  protected detectUserLocation(): void {
    if (!navigator.geolocation) {
      this.loadError.set('Geolocation is not supported by your browser.');
      setTimeout(() => this.loadError.set(null), 3000);
      return;
    }

    this.loadError.set('Detecting your location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.map.setView([latitude, longitude], 14);
        this.loadError.set(null);
      },
      () => {
        this.loadError.set('Could not detect your location.');
        setTimeout(() => this.loadError.set(null), 3000);
      },
    );
  }

  protected onSearch(event: Event): void {
    event.preventDefault();
    const query = this.searchQuery().trim();
    if (!query) return;

    this.searching.set(true);
    // Use Nominatim for geocoding
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        this.searching.set(false);
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          this.map.setView([parseFloat(lat), parseFloat(lon)], 14);
        } else {
          this.loadError.set('Location not found.');
          setTimeout(() => this.loadError.set(null), 3000);
        }
      })
      .catch(() => {
        this.searching.set(false);
        this.loadError.set('Search failed. Please try again.');
        setTimeout(() => this.loadError.set(null), 3000);
      });
  }

  private loadData(): void {
    this.markings.getApprovedPois().subscribe({
      next: (pois) => {
        for (const poi of pois) {
          const [lng, lat] = poi.location.coordinates;
          const marker = L.circleMarker([lat, lng], {
            radius: 9,
            color: safetyColor(poi.safetyRating),
            fillColor: safetyColor(poi.safetyRating),
            fillOpacity: 0.85,
            weight: 2,
          });
          marker.bindPopup(this.poiPopup(poi.name, poi));
          this.dataLayer.addLayer(marker);
        }
      },
      error: () => this.loadError.set('Could not load places.'),
    });

    this.markings.getApprovedDistricts().subscribe({
      next: (districts) => {
        for (const district of districts) {
          const ring = district.area.coordinates[0].map(([lng, lat]): [number, number] => [
            lat,
            lng,
          ]);
          const polygon = L.polygon(ring, {
            color: safetyColor(district.safetyRating),
            fillColor: safetyColor(district.safetyRating),
            fillOpacity: 0.25,
            weight: 2,
          });
          polygon.bindPopup(
            this.districtPopup(district.name, district.description, district.safetyRating),
          );
          this.dataLayer.addLayer(polygon);
        }
      },
      error: () => this.loadError.set('Could not load districts.'),
    });
  }

  private poiPopup(
    name: string,
    poi: { description: string; category: string; safetyRating: number },
  ): string {
    return `
      <strong>${this.escape(name)}</strong>
      <div class="pop-meta">${this.escape(poi.category)} · ${safetyLabel(poi.safetyRating)}</div>
      ${poi.description ? `<p>${this.escape(poi.description)}</p>` : ''}
    `;
  }

  private districtPopup(name: string, description: string, rating: number): string {
    return `
      <strong>${this.escape(name)}</strong>
      <div class="pop-meta">District · ${safetyLabel(rating)}</div>
      ${description ? `<p>${this.escape(description)}</p>` : ''}
    `;
  }

  private escape(value: string): string {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }
}
