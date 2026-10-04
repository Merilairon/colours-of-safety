import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import 'leaflet-draw';
import 'leaflet.markercluster';
import { AuthService } from '../core/auth.service';
import { SUPPORT_EMAIL } from '../core/contact';
import { IconComponent, iconSvg } from '../core/icons';
import { PlaceListComponent, PlaceListItem } from './place-list/place-list';
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
  safetySymbolColor,
} from '../core/safety';

type DraftKind = 'poi' | 'district';

interface Draft {
  kind: DraftKind;
  layer: L.Layer;
  location?: [number, number]; // [lng, lat] for POIs
  area?: GeoPolygon; // for districts
}

const BRAND_COLOR = '#c2185b';
/** The list renders the nearest places only; the rest are reachable by zooming in. */
const PLACE_LIST_LIMIT = 50;

/**
 * The global `L` that UMD plugins (leaflet-draw, leaflet.markercluster) patch;
 * see leaflet-setup.ts. Top-level plugin additions (`markerClusterGroup`,
 * `Draw`, `drawLocal`) must be read from here: the bundler resolves `L.x` on
 * the `import * as L` namespace at build time, so names Leaflet itself does not
 * export come out undefined. That is why production rendered every place
 * unclustered (LSA-F6).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function leafletGlobal(): any {
  return (window as unknown as { L?: unknown }).L;
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  }
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}

@Component({
  selector: 'app-map',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, PlaceListComponent],
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
  protected readonly isAdmin = this.auth.isAdmin;
  protected readonly categories = POI_CATEGORIES;
  protected readonly safetyLabel = safetyLabel;
  protected readonly colorFor = safetyColor;
  protected readonly indicatorFor = safetyIndicator;
  protected readonly symbolColorFor = safetySymbolColor;
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
  protected readonly locating = signal(false);
  /** [lat, lng] once the visitor shared their location; used for list distances. */
  protected readonly userLocation = signal<[number, number] | null>(null);

  // Panels (filters and legend collapse on small screens, LSA-A11)
  protected readonly filtersOpen = signal(false);
  protected readonly legendOpen = signal(false);
  protected readonly listOpen = signal(false);

  // Accessible place list (LSA-A1) and screen-reader announcements (LSA-A9)
  protected readonly visiblePlaces = signal<PlaceListItem[]>([]);
  protected readonly visibleTotal = signal(0);
  protected readonly announcement = signal('');
  /** Context for the next "Showing N places …" announcement after the map moves. */
  private pendingAnnouncement: string | null = null;

  // Drawing (LSA-A12)
  protected readonly drawMode = signal<DraftKind | null>(null);
  protected readonly drawHint = computed(() => {
    if (!this.isLoggedIn() || this.draft() || this.editingTarget()) return null;
    switch (this.drawMode()) {
      case 'poi':
        return 'Click the map where the place is. Press Esc to cancel.';
      case 'district':
        return 'Click to add corners, then click the first corner to finish. Press Esc to cancel.';
      default:
        return 'Use “Add place” or “Draw district” to contribute.';
    }
  });
  private activeDrawHandler: { disable(): void } | null = null;

  // Data storage for filtering
  private allPois: Poi[] = [];
  private allDistricts: District[] = [];
  private filteredPois: Poi[] = [];
  private readonly markerIndex = new Map<string, L.Marker>();

  // Popup focus management (LSA-A7)
  private popupReturnFocus: HTMLElement | null = null;
  private readonly onPopupKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.map.closePopup();
    }
  };

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
      zoomControl: false,
    });
    // Bottom-right keeps the zoom buttons clear of the search panel and place list.
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.configureLeafletIcons();

    const markerClusterGroup = leafletGlobal()?.markerClusterGroup;
    this.poiClusterLayer = (
      typeof markerClusterGroup === 'function'
        ? markerClusterGroup({
            maxClusterRadius: 120, // Fixed large radius for aggressive clustering
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: (cluster: { getChildCount(): number }) => {
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
                html: `<div class="cluster-icon" style="width: ${size}px; height: ${size}px; font-size: ${fontSize}px;"><span>${count}</span><span class="sr-only"> places here, select to zoom in</span></div>`,
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

    if (this.isLoggedIn()) {
      this.addDrawControls();
    }

    this.map.on('draw:created', (e) => this.onShapeCreated(e as L.DrawEvents.Created));
    this.map.on('draw:drawstart', (e) =>
      this.drawMode.set((e as unknown as { layerType: string }).layerType === 'polygon' ? 'district' : 'poi'),
    );
    this.map.on('draw:drawstop', () => {
      this.drawMode.set(null);
      this.activeDrawHandler = null;
    });
    this.map.on('moveend', () => this.onMapMoved());
    this.map.on('popupopen', (e) => this.onPopupOpen((e as L.PopupEvent).popup));
    this.map.on('popupclose', (e) => this.onPopupClose((e as L.PopupEvent).popup));

    this.loadData();

    // A deep link (e.g. "View on map" from a place page) wins over auto-locate.
    if (!this.applyViewFromUrl()) {
      this.attemptAutoLocate();
    }

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
    // Plain-language names instead of "circlemarker" / "polygon" (LSA-A12).
    // Must be set before the toolbar is created, which reads them once.
    const local = leafletGlobal()?.drawLocal;
    if (local) {
      local.draw.toolbar.buttons.circlemarker = 'Add a place';
      local.draw.toolbar.buttons.polygon = 'Draw a district';
      local.draw.handlers.circlemarker.tooltip.start = 'Click the map to add a place.';
      local.draw.handlers.polygon.tooltip.start = 'Click to start drawing a district.';
    }
    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        marker: false,
        circle: false,
        circlemarker: { color: BRAND_COLOR },
        polyline: false,
        rectangle: false,
        polygon: {
          allowIntersection: false,
          shapeOptions: { color: BRAND_COLOR },
        },
      },
      edit: undefined,
    });
    this.map.addControl(drawControl);
  }

  protected startAddPlace(): void {
    this.startDrawing('poi');
  }

  protected startDrawDistrict(): void {
    this.startDrawing('district');
  }

  /** Starts the same leaflet-draw handlers as the toolbar, from a visible button. */
  private startDrawing(kind: DraftKind): void {
    const Draw = leafletGlobal()?.Draw;
    if (!Draw) return;
    this.activeDrawHandler?.disable();
    const handler =
      kind === 'poi'
        ? new Draw.CircleMarker(this.map, { color: BRAND_COLOR })
        : new Draw.Polygon(this.map, {
            allowIntersection: false,
            shapeOptions: { color: BRAND_COLOR },
          });
    handler.enable();
    this.activeDrawHandler = handler;
    this.drawMode.set(kind);
    this.announce(
      kind === 'poi'
        ? 'Adding a place. Click the map where the place is, or press Escape to cancel.'
        : 'Drawing a district. Click the map to add corners, or press Escape to cancel.',
    );
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
      layer.setStyle({ color: '#c2185b', fillColor: '#c2185b' });
      this.draftLayer.addLayer(layer);
      this.resetForm();
      this.draft.set({ kind: 'poi', layer, location: [lng, lat] });
      this.focusSoon('draft-name');
    } else if (event.layerType === 'polygon' && layer instanceof L.Polygon) {
      const area = this.polygonToGeoJson(layer);
      if (!area) {
        return;
      }
      this.draftLayer.addLayer(layer);
      this.resetForm();
      this.form.controls.category.setValue('other');
      this.draft.set({ kind: 'district', layer, area });
      this.focusSoon('draft-name');
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
    this.loadApproved();
  }

  /** Loads approved places and districts and keeps the legend counter in sync. */
  private loadApproved(): void {
    this.markings.getApprovedPois().subscribe({
      next: (pois) => {
        this.allPois = pois;
        this.approvedCount.update((c) => ({ ...c, pois: pois.length }));
        this.applyFilters();
      },
      error: () => this.loadError.set('Could not load places.'),
    });
    this.markings.getApprovedDistricts().subscribe({
      next: (districts) => {
        this.allDistricts = districts;
        this.approvedCount.update((c) => ({ ...c, districts: districts.length }));
        this.applyFilters();
      },
      error: () => this.loadError.set('Could not load districts.'),
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
    this.map.closePopup();
    this.focusSoon('edit-name');
  }

  /** Moves focus to a panel field once Angular has rendered it. */
  private focusSoon(id: string): void {
    setTimeout(() => document.getElementById(id)?.focus());
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
    this.filteredPois = filteredPois;
    this.markerIndex.clear();

    const markers: L.Marker[] = [];
    for (const poi of filteredPois) {
      const marker = this.placeMarker(poi);
      this.markerIndex.set(poi.id, marker);
      marker.bindPopup(this.poiPopup(poi.name, poi, poi.id));
      if (this.isLoggedIn()) {
        marker.on('popupopen', () => this.attachEditHandler(marker, poi, 'poi'));
      }
      if (this.isAdmin()) {
        marker.on('popupopen', () =>
          this.attachRemoveHandler(marker, poi.id, 'poi', this.poiClusterLayer),
        );
      }
      markers.push(marker);
    }
    // One bulk add lets markercluster cluster everything in a single pass.
    if (typeof this.poiClusterLayer.addLayers === 'function') {
      this.poiClusterLayer.addLayers(markers);
    } else {
      markers.forEach((m) => this.poiClusterLayer.addLayer(m));
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
      if (this.isAdmin()) {
        polygon.on('popupopen', () =>
          this.attachRemoveHandler(polygon, district.id, 'district', this.districtLayer),
        );
      }
      this.districtLayer.addLayer(polygon);
    }

    this.updateVisiblePlaces();
  }

  /** Round marker with the rating symbol inside, so it never relies on colour alone (LSA-A2). */
  private placeIcon(rating: number, pending = false): L.DivIcon {
    return L.divIcon({
      className: 'place-marker-icon',
      html: `<span class="place-marker${pending ? ' pending' : ''}" style="background:${safetyColor(rating)};color:${safetySymbolColor(rating)}">${safetyIndicator(rating)}</span>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -12],
    });
  }

  private placeMarker(poi: Poi, pending = false): L.Marker {
    const [lng, lat] = poi.location.coordinates;
    const label = [
      poi.name,
      this.categoryLabels[poi.category] || poi.category,
      safetyLabel(poi.safetyRating),
      ...(pending ? ['pending review'] : []),
    ].join(', ');
    const marker = L.marker([lat, lng], {
      icon: this.placeIcon(poi.safetyRating, pending),
      title: poi.name,
      keyboard: true,
      riseOnHover: true,
    });
    // Leaflet gives keyboard markers role="button"; the title alone is not a reliable name.
    marker.on('add', () => marker.getElement()?.setAttribute('aria-label', label));
    return marker;
  }

  private onMapMoved(): void {
    this.updateVisiblePlaces();
    if (this.pendingAnnouncement !== null) {
      const context = this.pendingAnnouncement;
      this.pendingAnnouncement = null;
      this.announce(`Showing ${this.placeCount(this.visibleTotal())} ${context}.`);
    }
  }

  /** Recomputes the approved places inside the current view, nearest first. */
  private updateVisiblePlaces(): void {
    if (!this.map) return;
    const bounds = this.map.getBounds();
    const origin = this.userLocation() ? L.latLng(this.userLocation()!) : this.map.getCenter();
    const inView: { poi: Poi; meters: number }[] = [];
    for (const poi of this.filteredPois) {
      const [lng, lat] = poi.location.coordinates;
      const latLng = L.latLng(lat, lng);
      if (bounds.contains(latLng)) {
        inView.push({ poi, meters: origin.distanceTo(latLng) });
      }
    }
    inView.sort((a, b) => a.meters - b.meters);
    this.visibleTotal.set(inView.length);
    this.visiblePlaces.set(
      inView.slice(0, PLACE_LIST_LIMIT).map(({ poi, meters }) => ({
        id: poi.id,
        name: poi.name,
        category: this.categoryLabels[poi.category] || poi.category,
        ratingLabel: safetyLabel(poi.safetyRating),
        symbol: safetyIndicator(poi.safetyRating),
        color: safetyColor(poi.safetyRating),
        symbolColor: safetySymbolColor(poi.safetyRating),
        wheelchairAccessible: poi.wheelchairAccessible,
        distance: formatDistance(meters),
      })),
    );
  }

  protected toggleList(): void {
    this.listOpen.update((open) => !open);
    if (this.listOpen()) {
      this.updateVisiblePlaces();
    }
  }

  /** Opens a place's popup from the list, unclustering it first if needed. */
  protected openPlace(id: string, trigger: HTMLElement | null): void {
    const marker = this.markerIndex.get(id);
    if (!marker) return;
    const open = () => {
      marker.openPopup();
      // Return focus to the list row, not wherever focus was mid-animation.
      if (trigger) this.popupReturnFocus = trigger;
    };
    if (typeof this.poiClusterLayer.zoomToShowLayer === 'function') {
      this.poiClusterLayer.zoomToShowLayer(marker, open);
    } else {
      open();
    }
  }

  private onPopupOpen(popup: L.Popup): void {
    const active = document.activeElement as HTMLElement | null;
    this.popupReturnFocus = active && active !== document.body ? active : null;
    const container = popup.getElement();
    if (!container) return;
    const content = container.querySelector<HTMLElement>('.leaflet-popup-content');
    // Name the dialog after the place, without decorative or screen-reader-only extras.
    const heading = content?.querySelector('strong')?.cloneNode(true) as HTMLElement | undefined;
    heading?.querySelectorAll('[aria-hidden="true"], .sr-only').forEach((n) => n.remove());
    const title = heading?.textContent?.trim();
    container.setAttribute('role', 'dialog');
    if (title) container.setAttribute('aria-label', title);
    container.addEventListener('keydown', this.onPopupKeydown);
    if (content) {
      content.tabIndex = -1;
      content.focus({ preventScroll: true });
    }
  }

  private onPopupClose(popup: L.Popup): void {
    const container = popup.getElement();
    container?.removeEventListener('keydown', this.onPopupKeydown);
    const active = document.activeElement;
    const focusWasInPopup = !active || active === document.body || !!container?.contains(active);
    const target = this.popupReturnFocus;
    this.popupReturnFocus = null;
    if (!focusWasInPopup) return;
    if (target?.isConnected) {
      target.focus({ preventScroll: true });
    } else if (this.listOpen()) {
      document.getElementById('place-list')?.focus();
    }
  }

  private placeCount(n: number): string {
    return `${n} ${n === 1 ? 'place' : 'places'}`;
  }

  /** Re-setting the text guarantees a repeat message is read again. */
  private announce(message: string): void {
    this.announcement.set('');
    setTimeout(() => this.announcement.set(message), 100);
  }

  private announceFilterResult(): void {
    this.announce(
      `${this.placeCount(this.filteredPois.length)} match your filters, ${this.visibleTotal()} in view.`,
    );
  }

  protected onCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedCategory.set(value);
    this.applyFilters();
    this.announceFilterResult();
  }

  protected onRatingChange(event: Event): void {
    const value = parseInt((event.target as HTMLSelectElement).value, 10);
    this.minSafetyRating.set(value);
    this.applyFilters();
    this.announceFilterResult();
  }

  protected onWheelchairChange(event: Event): void {
    const value = (event.target as HTMLInputElement).checked;
    this.wheelchairFilter.set(value);
    this.applyFilters();
    this.announceFilterResult();
  }

  protected detectUserLocation(): void {
    if (!navigator.geolocation) {
      this.showError('Geolocation is not supported by your browser.');
      return;
    }

    this.locating.set(true);
    this.announce('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.locating.set(false);
        this.userLocation.set([latitude, longitude]);
        this.pendingAnnouncement = 'near your location';
        this.map.setView([latitude, longitude], 14);
      },
      () => {
        this.locating.set(false);
        this.showError('Could not detect your location.');
      },
    );
  }

  /** Errors render in the role="alert" region so they are announced (LSA-A9). */
  private showError(message: string, duration = 4000): void {
    this.loadError.set(message);
    setTimeout(() => {
      if (this.loadError() === message) this.loadError.set(null);
    }, duration);
  }

  /** Centres the map on `?lat=&lng=&z=` when present and valid. */
  private applyViewFromUrl(): boolean {
    const params = this.route.snapshot.queryParamMap;
    const lat = Number(params.get('lat'));
    const lng = Number(params.get('lng'));
    const zoom = Number(params.get('z') ?? 17);
    const valid =
      params.has('lat') &&
      params.has('lng') &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180;
    if (!valid) {
      return false;
    }
    this.map.setView([lat, lng], Number.isFinite(zoom) ? Math.min(Math.max(zoom, 3), 19) : 17);
    return true;
  }

  private attemptAutoLocate(): void {
    if (!navigator.geolocation) return;

    // Silent auto-locate on page load
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.userLocation.set([latitude, longitude]);
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
          this.pendingAnnouncement = `near ${query}`;
          this.map.setView([parseFloat(lat), parseFloat(lon)], 14);
        } else {
          this.showError('Location not found.');
        }
      })
      .catch(() => {
        this.searching.set(false);
        this.showError('Search failed. Please try again.');
      });
  }

  private loadData(): void {
    this.loadApproved();
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
          const marker = this.placeMarker(poi, true);
          marker.bindPopup(this.pendingPoiPopup(poi));
          marker.on('popupopen', () => this.attachVoteHandler(marker, poi.id, 'poi'));
          if (this.isAdmin()) {
            marker.on('popupopen', () =>
              this.attachRemoveHandler(marker, poi.id, 'poi', this.pendingLayer),
            );
          }
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
          if (this.isAdmin()) {
            polygon.on('popupopen', () =>
              this.attachRemoveHandler(polygon, district.id, 'district', this.pendingLayer),
            );
          }
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
            countEl.textContent = this.upvoteLabel(res.voteCount);
          }
          // Disable button
          btn.setAttribute('disabled', 'true');
          btn.textContent = 'Voted';
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

  private attachRemoveHandler(
    layer: L.Layer,
    id: string,
    kind: 'poi' | 'district',
    source: L.LayerGroup,
  ): void {
    const btn = document.getElementById(`remove-${id}`);
    if (!btn) return;

    btn.addEventListener('click', () => {
      if (!confirm('Remove this submission from the map?')) {
        return;
      }
      const obs = kind === 'poi' ? this.markings.deletePoi(id) : this.markings.deleteDistrict(id);
      obs.subscribe({
        next: () => {
          source.removeLayer(layer);
          this.showToast('Submission removed from the map');
        },
        error: () => {
          this.showToast('Failed to remove submission');
        },
      });
    });
  }

  private pendingPoiPopup(poi: Poi): string {
    return `
      <strong>${this.escape(poi.name)}${this.wheelchairBadge(poi.wheelchairAccessible)}</strong>
      <div class="pop-meta pop-pending">${iconSvg('clock')} Pending: awaiting review</div>
      ${this.ratingMeta(this.categoryLabels[poi.category] || poi.category, poi.safetyRating)}
      ${poi.description ? `<p>${this.escape(poi.description)}</p>` : ''}
      ${this.voteSection(poi.id, poi.voteCount)}
      ${this.removeButton(poi.id)}
    `;
  }

  private pendingDistrictPopup(district: District): string {
    return `
      <strong>${this.escape(district.name)}</strong>
      <div class="pop-meta pop-pending">${iconSvg('clock')} Pending: awaiting review</div>
      ${this.ratingMeta('District', district.safetyRating)}
      ${district.description ? `<p>${this.escape(district.description)}</p>` : ''}
      ${this.voteSection(district.id, district.voteCount)}
      ${this.removeButton(district.id)}
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
    return `
      <strong>${this.escape(name)}${this.wheelchairBadge(poi.wheelchairAccessible)}</strong>
      ${this.ratingMeta(this.categoryLabels[poi.category] || poi.category, poi.safetyRating)}
      ${poi.description ? `<p>${this.escape(poi.description)}</p>` : ''}
      ${this.editProposalButton(id)}
      ${this.removeButton(id)}
      ${this.reportLink(name, id)}
    `;
  }

  private districtPopup(
    name: string,
    description: string,
    rating: number,
    wheelchairAccessible?: boolean,
    id?: string,
  ): string {
    return `
      <strong>${this.escape(name)}${this.wheelchairBadge(wheelchairAccessible)}</strong>
      ${this.ratingMeta('District', rating)}
      ${description ? `<p>${this.escape(description)}</p>` : ''}
      ${this.editProposalButton(id)}
      ${this.removeButton(id)}
      ${this.reportLink(name, id)}
    `;
  }

  private ratingMeta(kindLabel: string, rating: number): string {
    return `
      <div class="pop-meta">
        <span class="safety-indicator" aria-hidden="true" style="background:${safetyColor(rating)};color:${safetySymbolColor(rating)}">${safetyIndicator(rating)}</span>
        ${this.escape(kindLabel)} · ${safetyLabel(rating)}
      </div>`;
  }

  private wheelchairBadge(accessible?: boolean): string {
    return accessible
      ? ' <span aria-hidden="true">♿</span><span class="sr-only"> (wheelchair accessible)</span>'
      : '';
  }

  private upvoteLabel(count: number): string {
    return `${count} ${count === 1 ? 'upvote' : 'upvotes'}`;
  }

  private voteSection(id: string, voteCount: number | undefined): string {
    return `
      <div class="vote-section">
        <span class="vote-count" id="vote-count-${id}">${this.upvoteLabel(voteCount || 0)}</span>
        <button type="button" class="vote-btn" id="vote-btn-${id}">${iconSvg('thumbs-up')} Upvote</button>
      </div>`;
  }

  private editProposalButton(id?: string): string {
    if (!id || !this.isLoggedIn()) return '';
    return `<button type="button" class="edit-proposal-btn" id="edit-proposal-${id}">${iconSvg('edit')} Suggest edit</button>`;
  }

  private removeButton(id?: string): string {
    if (!id || !this.isAdmin()) return '';
    return `<button type="button" class="remove-btn" id="remove-${id}">${iconSvg('trash')} Remove</button>`;
  }

  /** Mail-based until the in-app report flow (LSA-F4) replaces it. */
  private reportLink(name: string, id?: string): string {
    const subject = `Report: ${name}${id ? ` (${id})` : ''}`;
    const body = `Place: ${name}\nID: ${id ?? 'unknown'}\n\nWhat is wrong with this listing?\n`;
    const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return `<div class="pop-report"><a href="${this.escape(href)}">${iconSvg('flag')} Flag</a></div>`;
  }

  private escape(value: string): string {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }
}
