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
import 'leaflet.markercluster';
import { AuthService } from '../core/auth.service';
import { MarkingsService } from '../core/markings.service';
import {
  CreateDistrictPayload,
  CreateEditProposalPayload,
  CreatePoiPayload,
  GeoPolygon,
  Poi,
  District,
  EditProposalData,
} from '../core/models';
import {
  POI_CATEGORIES,
  POI_CATEGORY_LABELS,
  safetyColor,
  safetyIndicator,
  safetyLabel,
} from '../core/safety';

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
  protected readonly indicatorFor = safetyIndicator;
  protected readonly categoryLabels = POI_CATEGORY_LABELS;

  protected readonly draft = signal<Draft | null>(null);
  protected readonly toast = signal<string | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);

  protected readonly editingTarget = signal<{
    kind: 'poi' | 'district';
    id: string;
    name: string;
    category?: string;
    description: string;
    safetyRating: number;
    wheelchairAccessible?: boolean;
    location?: { type: 'Point'; coordinates: [number, number] };
    area?: GeoPolygon;
  } | null>(null);
  protected readonly editSubmitting = signal(false);
  protected readonly editGeometry = signal<{
    location?: [number, number];
    area?: GeoPolygon;
  } | null>(null);
  protected readonly editGeometryMode = signal<'move' | 'redraw' | null>(null);
  protected readonly editGeometryHint = signal<string | null>(null);

  // Filters
  protected readonly selectedCategory = signal<string>('all');
  protected readonly minSafetyRating = signal<number>(1);
  protected readonly wheelchairFilter = signal<boolean>(false);

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

  // Pending layer (logged-in users only)
  private pendingLayer!: L.LayerGroup;

  // Welcome prompt for new users
  protected readonly showWelcome = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    category: ['other'],
    safetyRating: [5, [Validators.required]],
    wheelchairAccessible: [false],
    isAnonymous: [false],
  });

  protected readonly editForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    category: ['other'],
    safetyRating: [5, [Validators.required]],
    wheelchairAccessible: [false],
  });

  private map!: L.Map;
  private poiClusterLayer!: any;
  private districtLayer!: L.LayerGroup;
  private draftLayer!: L.LayerGroup;
  private editGeometryLayer!: L.LayerGroup;
  private blendedPane!: HTMLElement;

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    this.map = L.map(this.mapEl.nativeElement, {
      center: [50.8503, 4.3517], // Brussels fallback
      zoom: 12,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.configureLeafletIcons();

    this.poiClusterLayer = (
      typeof (L as any).markerClusterGroup === 'function'
        ? (L as any).markerClusterGroup({
            maxClusterRadius: 120, // Fixed large radius for aggressive clustering
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: (cluster: any) => {
              const count = cluster.getChildCount();
              let size = 40;
              let fontSize = 14;

              // Larger cluster icons for bigger clusters
              if (count > 50) {
                size = 50;
                fontSize = 16;
              } else if (count > 20) {
                size = 45;
                fontSize = 15;
              }

              return L.divIcon({
                html: `<div class="cluster-icon" style="width: ${size}px; height: ${size}px; font-size: ${fontSize}px;"><span>${count}</span></div>`,
                className: 'marker-cluster',
                iconSize: L.point(size, size),
              });
            },
          })
        : L.layerGroup()
    ).addTo(this.map);
    this.districtLayer = L.layerGroup().addTo(this.map);
    this.pendingLayer = L.layerGroup().addTo(this.map);
    this.draftLayer = L.layerGroup().addTo(this.map);
    this.editGeometryLayer = L.layerGroup().addTo(this.map);
    this.initBlendedPane();

    console.log('Map init - isLoggedIn:', this.isLoggedIn(), 'user:', this.auth.user());
    if (this.isLoggedIn()) {
      console.log('Adding draw controls');
      this.addDrawControls();
    }

    this.map.on('draw:created', (e) => this.onShapeCreated(e as L.DrawEvents.Created));

    this.loadData();

    // Auto-locate user on first load
    this.attemptAutoLocate();

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

  private configureLeafletIcons(): void {
    const iconRetinaUrl = '/images/marker-icon-2x.png';
    const iconUrl = '/images/marker-icon.png';
    const shadowUrl = '/images/marker-shadow.png';

    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });
  }

  private initBlendedPane(): void {
    this.map.createPane('blendedDistricts');
    this.blendedPane = this.map.getPane('blendedDistricts')!;
    this.blendedPane.style.zIndex = '399';

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('xmlns', svgNS);
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:visible;pointer-events:none';

    const defs = document.createElementNS(svgNS, 'defs');
    const filter = document.createElementNS(svgNS, 'filter');
    filter.setAttribute('id', 'district-blend');
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%');
    filter.setAttribute('height', '140%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');

    const blur = document.createElementNS(svgNS, 'feGaussianBlur');
    blur.setAttribute('in', 'SourceGraphic');
    blur.setAttribute('stdDeviation', '8');

    filter.appendChild(blur);

    // Hatch pattern for pending districts
    const pattern = document.createElementNS(svgNS, 'pattern');
    pattern.setAttribute('id', 'pending-hatch');
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.setAttribute('width', '8');
    pattern.setAttribute('height', '8');
    pattern.setAttribute('patternTransform', 'rotate(45)');
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('y1', '0');
    line.setAttribute('x2', '0');
    line.setAttribute('y2', '8');
    line.setAttribute('stroke', '#888');
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-opacity', '0.4');
    pattern.appendChild(line);

    defs.appendChild(filter);
    defs.appendChild(pattern);
    svg.appendChild(defs);
    document.body.appendChild(svg);

    this.blendedPane.style.filter = 'url(#district-blend)';
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
    if (this.editGeometryMode() === 'redraw' && this.editingTarget()) {
      const layer = event.layer;
      if (event.layerType === 'polygon' && layer instanceof L.Polygon) {
        const area = this.polygonToGeoJson(layer);
        if (!area) {
          return;
        }
        this.editGeometryLayer.clearLayers();
        this.editGeometryLayer.addLayer(layer);
        this.editGeometry.update((g) => ({ ...g, area }));
        this.editGeometryMode.set(null);
        this.editGeometryHint.set(null);
      } else {
        this.editGeometryHint.set('Please draw a polygon for the new district area.');
      }
      return;
    }

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
        wheelchairAccessible: value.wheelchairAccessible,
        location: { type: 'Point', coordinates: draft.location },
        isAnonymous: value.isAnonymous,
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
        wheelchairAccessible: value.wheelchairAccessible,
        area: draft.area,
        isAnonymous: value.isAnonymous,
        blendEdges: true,
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

  protected startEditProposal(target: {
    kind: 'poi' | 'district';
    id: string;
    name: string;
    category?: string;
    description: string;
    safetyRating: number;
    wheelchairAccessible?: boolean;
    location?: { type: 'Point'; coordinates: [number, number] };
    area?: GeoPolygon;
  }): void {
    this.clearEditGeometry();
    this.editingTarget.set(target);
    this.editForm.reset({
      name: target.name,
      description: target.description,
      category: target.category ?? 'other',
      safetyRating: target.safetyRating,
      wheelchairAccessible: target.wheelchairAccessible ?? false,
    });
    if (target.kind === 'poi' && target.location) {
      this.editGeometry.set({
        location: [...target.location.coordinates] as [number, number],
      });
    } else if (target.kind === 'district' && target.area) {
      this.editGeometry.set({ area: target.area });
    }
  }

  protected submitEditProposal(): void {
    const target = this.editingTarget();
    if (!target || this.editForm.invalid || this.editSubmitting()) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.editSubmitting.set(true);
    const value = this.editForm.getRawValue();
    const geometry = this.editGeometry();
    const proposedData: EditProposalData = {
      name: value.name,
      description: value.description,
      safetyRating: value.safetyRating,
      wheelchairAccessible: value.wheelchairAccessible,
    };
    if (target.kind === 'poi') {
      proposedData.category = value.category;
      if (geometry?.location) {
        proposedData.location = { type: 'Point', coordinates: geometry.location };
      }
    } else if (target.kind === 'district' && geometry?.area) {
      proposedData.area = geometry.area;
    }
    const payload: CreateEditProposalPayload = {
      targetType: target.kind,
      targetId: target.id,
      proposedData,
    };
    this.markings.createEditProposal(payload).subscribe({
      next: () => {
        this.editSubmitting.set(false);
        this.clearEditGeometry();
        this.editingTarget.set(null);
        this.showSuccessToast('Edit proposal submitted. It will be reviewed soon.');
      },
      error: () => {
        this.editSubmitting.set(false);
        this.showToast('Could not submit edit proposal. Please try again.');
      },
    });
  }

  protected cancelEditProposal(): void {
    this.clearEditGeometry();
    this.editingTarget.set(null);
  }

  protected formatLocation(coords?: [number, number]): string {
    if (!coords) return 'Not set';
    return `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
  }

  protected startMovePoi(): void {
    const target = this.editingTarget();
    const geometry = this.editGeometry();
    if (!target || target.kind !== 'poi' || !geometry?.location) return;
    this.editGeometryLayer.clearLayers();
    this.editGeometryMode.set('move');
    this.editGeometryHint.set('Drag the pin to the new location.');
    const [lng, lat] = geometry.location;
    const marker = L.marker([lat, lng], { draggable: true });
    marker.addTo(this.editGeometryLayer);
    marker.on('dragend', (e) => {
      const { lat: newLat, lng: newLng } = (e.target as L.Marker).getLatLng();
      this.editGeometry.update((g) => (g ? { ...g, location: [newLng, newLat] } : g));
    });
  }

  protected startRedrawDistrict(): void {
    const target = this.editingTarget();
    if (!target || target.kind !== 'district') return;
    this.editGeometryLayer.clearLayers();
    this.editGeometryMode.set('redraw');
    this.editGeometryHint.set(
      'Draw a new polygon on the map. It replaces the current district area.',
    );
  }

  private clearEditGeometry(): void {
    this.editGeometry.set(null);
    this.editGeometryMode.set(null);
    this.editGeometryHint.set(null);
    this.editGeometryLayer.clearLayers();
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
      wheelchairAccessible: false,
      isAnonymous: false,
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
    this.poiClusterLayer.clearLayers();
    this.districtLayer.clearLayers();

    const category = this.selectedCategory();
    const minRating = this.minSafetyRating();
    const wheelchairOnly = this.wheelchairFilter();

    // Filter POIs
    const filteredPois = this.allPois.filter((poi) => {
      if (category !== 'all' && poi.category !== category) return false;
      if (poi.safetyRating < minRating) return false;
      if (wheelchairOnly && !poi.wheelchairAccessible) return false;
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
      marker.bindPopup(this.poiPopup(poi.name, poi, poi.id));
      if (this.isLoggedIn()) {
        marker.on('popupopen', () => this.attachEditHandler(marker, poi, 'poi'));
      }
      this.poiClusterLayer.addLayer(marker);
    }

    // Filter Districts
    const filteredDistricts = this.allDistricts.filter((district) => {
      if (district.safetyRating < minRating) return false;
      if (wheelchairOnly && !district.wheelchairAccessible) return false;
      return true;
    });

    for (const district of filteredDistricts) {
      const ring = district.area.coordinates[0].map(([lng, lat]): [number, number] => [lat, lng]);
      const polygon = L.polygon(ring, {
        color: safetyColor(district.safetyRating),
        fillColor: safetyColor(district.safetyRating),
        fillOpacity: 0.55,
        weight: 0,
        pane: 'blendedDistricts',
      });
      polygon.bindPopup(
        this.districtPopup(
          district.name,
          district.description,
          district.safetyRating,
          district.wheelchairAccessible,
          district.id,
        ),
      );
      if (this.isLoggedIn()) {
        polygon.on('popupopen', () => this.attachEditHandler(polygon, district, 'district'));
      }
      this.districtLayer.addLayer(polygon);
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

  protected onWheelchairChange(event: Event): void {
    const value = (event.target as HTMLInputElement).checked;
    this.wheelchairFilter.set(value);
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

  private attemptAutoLocate(): void {
    if (!navigator.geolocation) return;

    // Silent auto-locate on page load
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.map.setView([latitude, longitude], 14);
      },
      () => {
        // Silent fail - keep Brussels fallback
      },
      { timeout: 5000, enableHighAccuracy: false },
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
        this.allPois = pois;
        this.applyFilters();
      },
      error: () => this.loadError.set('Could not load places.'),
    });

    this.markings.getApprovedDistricts().subscribe({
      next: (districts) => {
        this.allDistricts = districts;
        this.applyFilters();
      },
      error: () => this.loadError.set('Could not load districts.'),
    });

    this.loadPendingData();
  }

  private loadPendingData(): void {
    // Only show pending items to logged-in users
    if (!this.isLoggedIn()) {
      return;
    }

    this.markings.getPendingPois().subscribe({
      next: (pois) => {
        for (const poi of pois) {
          const [lng, lat] = poi.location.coordinates;
          const marker = L.circleMarker([lat, lng], {
            radius: 9,
            color: safetyColor(poi.safetyRating),
            fillColor: safetyColor(poi.safetyRating),
            fillOpacity: 0.4,
            weight: 2,
            dashArray: '4 3',
          });
          marker.bindPopup(this.pendingPoiPopup(poi));
          marker.on('popupopen', () => this.attachVoteHandler(marker, poi.id, 'poi'));
          this.pendingLayer.addLayer(marker);
        }
      },
    });

    this.markings.getPendingDistricts().subscribe({
      next: (districts) => {
        for (const district of districts) {
          const ring = district.area.coordinates[0].map(([lng, lat]): [number, number] => [
            lat,
            lng,
          ]);
          const polygon = L.polygon(ring, {
            color: safetyColor(district.safetyRating),
            fillColor: safetyColor(district.safetyRating),
            fillOpacity: 0.12,
            weight: 2,
            dashArray: '6 4',
            className: 'pending-district',
          });
          polygon.bindPopup(this.pendingDistrictPopup(district));
          polygon.on('popupopen', () => this.attachVoteHandler(polygon, district.id, 'district'));
          this.pendingLayer.addLayer(polygon);
        }
      },
    });
  }

  private attachVoteHandler(layer: L.Layer, id: string, kind: 'poi' | 'district'): void {
    const btn = document.getElementById(`vote-btn-${id}`);
    if (!btn) return;

    btn.addEventListener('click', () => {
      const obs = kind === 'poi' ? this.markings.votePoi(id) : this.markings.voteDistrict(id);

      obs.subscribe({
        next: (res) => {
          // Update vote count in popup
          const countEl = document.getElementById(`vote-count-${id}`);
          if (countEl) {
            countEl.textContent = `${res.voteCount} 👍`;
          }
          // Disable button
          btn.setAttribute('disabled', 'true');
          btn.textContent = 'Voted 👍';
          if (res.autoApproved) {
            this.showToast('This submission has been auto-approved!');
            // Remove from pending layer after delay
            setTimeout(() => {
              this.pendingLayer.removeLayer(layer);
            }, 2000);
          }
        },
        error: () => {
          btn.textContent = 'Error';
        },
      });
    });
  }

  private attachEditHandler(
    layer: L.Layer,
    target: Poi | District,
    kind: 'poi' | 'district',
  ): void {
    const id = kind === 'poi' ? (target as Poi).id : (target as District).id;
    const btn = document.getElementById(`edit-proposal-${id}`);
    if (!btn) return;

    btn.addEventListener('click', () => {
      this.startEditProposal({
        kind,
        id,
        name: target.name,
        category: (target as Poi).category,
        description: target.description,
        safetyRating: target.safetyRating,
        wheelchairAccessible: target.wheelchairAccessible,
        location: (target as Poi).location,
        area: (target as District).area,
      });
    });
  }

  private pendingPoiPopup(poi: Poi): string {
    const indicator = safetyIndicator(poi.safetyRating);
    const wheelchairBadge = poi.wheelchairAccessible ? ' ♿' : '';
    const voteCount = poi.voteCount || 0;
    return `
      <strong>${this.escape(poi.name)}${wheelchairBadge}</strong>
      <div class="pop-meta pop-pending">⏳ Pending — awaiting review</div>
      <div class="pop-meta">
        <span class="safety-indicator" aria-hidden="true">${indicator}</span>
        ${this.escape(this.categoryLabels[poi.category] || poi.category)}
        · ${safetyLabel(poi.safetyRating)}
      </div>
      ${poi.description ? `<p>${this.escape(poi.description)}</p>` : ''}
      <div class="vote-section">
        <span class="vote-count" id="vote-count-${poi.id}">${voteCount} 👍</span>
        <button class="vote-btn" id="vote-btn-${poi.id}">Upvote 👍</button>
      </div>
    `;
  }

  private pendingDistrictPopup(district: District): string {
    const indicator = safetyIndicator(district.safetyRating);
    const voteCount = district.voteCount || 0;
    return `
      <strong>${this.escape(district.name)}</strong>
      <div class="pop-meta pop-pending">⏳ Pending — awaiting review</div>
      <div class="pop-meta">
        <span class="safety-indicator" aria-hidden="true">${indicator}</span>
        District · ${safetyLabel(district.safetyRating)}
      </div>
      ${district.description ? `<p>${this.escape(district.description)}</p>` : ''}
      <div class="vote-section">
        <span class="vote-count" id="vote-count-${district.id}">${voteCount} 👍</span>
        <button class="vote-btn" id="vote-btn-${district.id}">Upvote 👍</button>
      </div>
    `;
  }

  private poiPopup(
    name: string,
    poi: {
      id?: string;
      description: string;
      category: string;
      safetyRating: number;
      wheelchairAccessible?: boolean;
    },
    id?: string,
  ): string {
    const indicator = safetyIndicator(poi.safetyRating);
    const wheelchairBadge = poi.wheelchairAccessible ? ' ♿' : '';
    return `
      <strong>${this.escape(name)}${wheelchairBadge}</strong>
      <div class="pop-meta">
        <span class="safety-indicator" aria-hidden="true">${indicator}</span>
        ${this.escape(this.categoryLabels[poi.category] || poi.category)}
        · ${safetyLabel(poi.safetyRating)}
      </div>
      ${poi.description ? `<p>${this.escape(poi.description)}</p>` : ''}
      ${this.editProposalButton(id)}
      ${this.reportLink()}
    `;
  }

  private districtPopup(
    name: string,
    description: string,
    rating: number,
    wheelchairAccessible?: boolean,
    id?: string,
  ): string {
    const indicator = safetyIndicator(rating);
    const wheelchairBadge = wheelchairAccessible ? ' ♿' : '';
    return `
      <strong>${this.escape(name)}${wheelchairBadge}</strong>
      <div class="pop-meta">
        <span class="safety-indicator" aria-hidden="true">${indicator}</span>
        District · ${safetyLabel(rating)}
      </div>
      ${description ? `<p>${this.escape(description)}</p>` : ''}
      ${this.editProposalButton(id)}
      ${this.reportLink()}
    `;
  }

  private editProposalButton(id?: string): string {
    if (!id || !this.isLoggedIn()) return '';
    return `<button class="edit-proposal-btn" id="edit-proposal-${id}">✎ Suggest edit</button>`;
  }

  private reportLink(): string {
    return `<div class="pop-report"><a href="mailto:support@colours-of-safety.org?subject=Report inappropriate content">🚩 Flag</a></div>`;
  }

  private escape(value: string): string {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }
}
