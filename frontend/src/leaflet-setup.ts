import * as L from 'leaflet';

// Expose L globally so UMD plugins (leaflet-draw, leaflet.markercluster) can patch it
(window as any)['L'] = L;
