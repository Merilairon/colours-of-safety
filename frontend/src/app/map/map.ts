import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';
import 'leaflet-draw';
import { AuthService } from '../core/auth.service';
import { MarkingsService } from '../core/markings.service';
import {
  CreateDistrictPayload,
  CreatePoiPayload,
  GeoPolygon,
} from '../core/models';
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

  protected readonly isLoggedIn = this.auth.isLoggedIn;
  protected readonly categories = POI_CATEGORIES;
  protected readonly safetyLabel = safetyLabel;
  protected readonly colorFor = safetyColor;

  protected readonly draft = signal<Draft | null>(null);
  protected readonly toast = signal<string | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);

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

    this.map.on('draw:created', (e) =>
      this.onShapeCreated(e as L.DrawEvents.Created),
    );

    this.loadData();
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
    this.showToast('Thanks! Your submission is pending reviewer approval.');
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

  private showToast(message: string): void {
    this.toast.set(message);
    setTimeout(() => this.toast.set(null), 4000);
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
          const ring = district.area.coordinates[0].map(
            ([lng, lat]): [number, number] => [lat, lng],
          );
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

  private districtPopup(
    name: string,
    description: string,
    rating: number,
  ): string {
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
