# GIS Data Sources — Colours of Safety

**Author:** GIS Analysis  
**Date:** 2026-06-10  
**Scope:** Seed data sources for LGBTQIA+ safe places (POIs + districts) before production launch

---

## 1. Project Context

| Property | Value |
| --- | --- |
| Map default center | Brussels `[50.8503, 4.3517]` |
| Storage | PostgreSQL 16 + PostGIS 3.4 |
| POI types | bar, cafe, club, restaurant, shop, bookstore, community, healthcare, hiv_sti_testing, sexual_health_clinic, crisis_shelter, support_group, transgender_services, youth_center, legal_aid, religious_spiritual, other |
| District type | Polygon (GeoJSON) with safety rating 1–5 |
| Review flow | Seed data should be inserted as `approved` status to bypass the reviewer queue |

---

## 2. Data Sources

### 2.1 OpenStreetMap — Overpass API ⭐ Primary

| Property | Detail |
| --- | --- |
| URL | https://overpass-api.de/api/interpreter |
| Interactive builder | https://overpass-turbo.dev/ |
| Export format | GeoJSON, CSV |
| License | ODbL (attribution required) |
| Coverage | Global; excellent in Western Europe |

**Relevant OSM tags:**

| OSM Tag | Maps to |
| --- | --- |
| `lgbtq=primary` | safetyRating 5 |
| `lgbtq=welcome` | safetyRating 4 |
| `lgbtq=yes` | safetyRating 3 |
| `lgbtq=limited` | safetyRating 2 |
| `amenity=bar` + `lgbtq=*` | category: `bar` |
| `amenity=cafe` + `lgbtq=*` | category: `cafe` |
| `amenity=restaurant` + `lgbtq=*` | category: `restaurant` |
| `amenity=community_centre` | category: `community` |
| `amenity=youth_centre` | category: `youth_center` |
| `amenity=social_facility` + `social_facility=shelter` | category: `crisis_shelter` |
| `healthcare=sexual_health` / `clinic` | category: `sexual_health_clinic` / `hiv_sti_testing` |
| `shop=books` + `lgbtq=*` | category: `bookstore` |
| `amenity=nightclub` + `lgbtq=*` | category: `club` |

**Sample Overpass query (Brussels area):**
```overpassql
[out:json][timeout:60];
(
  node["lgbtq"~"primary|welcome|yes|only"](50.75,4.25,50.95,4.50);
  way["lgbtq"~"primary|welcome|yes|only"](50.75,4.25,50.95,4.50);
);
out center body;
```

For global/multi-city queries replace the bounding box with `({{bbox}})` in Overpass Turbo or use a named area:
```overpassql
area["name"="Brussels"]["boundary"="administrative"]->.a;
node["lgbtq"~"primary|welcome|yes"](area.a);
out body;
```

---

### 2.2 Wikidata SPARQL

| Property | Detail |
| --- | --- |
| Endpoint | https://query.wikidata.org/sparql |
| Interactive | https://query.wikidata.org/ |
| Export format | JSON, CSV, GeoJSON |
| License | CC0 (public domain) |
| Best for | Named LGBTQ+ organisations, health centres, bookstores |

**Sample query (gay bars with coordinates):**
```sparql
SELECT ?item ?itemLabel ?coord WHERE {
  ?item wdt:P31 wd:Q1412694.   # instance of: gay bar
  ?item wdt:P625 ?coord.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
```

**Useful Wikidata class IDs:**

| Wikidata QID | Entity type |
| --- | --- |
| Q1412694 | Gay bar |
| Q1076486 | Sexual health clinic |
| Q131596 | Community centre |
| Q1628398 | LGBTQ community center |
| Q3943 | Bookshop (filter by topic) |

---

### 2.3 ILGA-Europe Rainbow Map

| Property | Detail |
| --- | --- |
| URL | https://www.ilga-europe.org/rainbow-europe/ |
| Export format | PDF, static scores per country |
| License | Free for non-commercial/advocacy use |
| Best for | Country-level district safety scores (legal environment) |

Use ILGA scores as a baseline for national-level district polygons (combine with GADM boundaries — see §2.6).

**Score mapping suggestion:**

| ILGA Rainbow score | safetyRating |
| --- | --- |
| 70–100% | 5 |
| 50–69% | 4 |
| 30–49% | 3 |
| 10–29% | 2 |
| 0–9% | 1 |

---

### 2.4 Foursquare Places API

| Property | Detail |
| --- | --- |
| URL | https://location.foursquare.com/developer/ |
| Free tier | 1,000 calls/day (Places Search) |
| Export format | JSON |
| License | Non-commercial free tier |
| Best for | Filling OSM gaps; rich category taxonomy |

Search terms: `gay bar`, `lgbtq health`, `queer bookstore`, `transgender clinic`

---

### 2.5 Yelp Fusion API

| Property | Detail |
| --- | --- |
| URL | https://fusion.yelp.com/ |
| Free tier | 500 requests/day |
| Relevant categories | `gaybars`, `lgbtqfriendly`, `sexualhealth`, `crisiscenters` |
| Export format | JSON |
| Rating mapping | Yelp 1–5 stars → safetyRating 1–5 (direct map) |

---

### 2.6 District / Polygon Sources

#### OSM Administrative Boundaries
Best for well-known LGBTQ+ neighbourhoods — query by name then assign rating manually:

```overpassql
[out:json];
relation["name"="Le Marais"]["boundary"="administrative"];
out geom;
```

**Known LGBTQ+ districts to seed:**

| District | City | Suggested safetyRating |
| --- | --- | --- |
| Le Marais | Paris | 5 |
| Castro | San Francisco | 5 |
| Canal Street / Gay Village | Manchester | 5 |
| Soho (Old Compton St) | London | 5 |
| Schöneberg | Berlin | 5 |
| Reguliersdwarsstraat area | Amsterdam | 5 |
| Sint-Joost-ten-Node / Matongé | Brussels | 4 |
| Ixelles | Brussels | 4 |
| Chueca | Madrid | 5 |
| Sitges old town | Sitges | 5 |

#### GADM (Country/Region Polygons)
- **URL:** https://gadm.org/download_country.html
- Level 0 = country, Level 1 = region, Level 2 = municipality
- Combine with ILGA scores for national-level safety overlays

#### Natural Earth
- **URL:** https://www.naturalearthdata.com/downloads/
- Coarse (1:10m, 1:50m) — use only for country-level context layers

---

## 3. Category Mapping Reference

| OSM `amenity` / `shop` / tag | App category |
| --- | --- |
| `amenity=bar` | `bar` |
| `amenity=cafe` | `cafe` |
| `amenity=restaurant` | `restaurant` |
| `amenity=nightclub` | `club` |
| `shop=books` + LGBTQ tag | `bookstore` |
| `amenity=community_centre` | `community` |
| `amenity=doctors` / `clinic` | `healthcare` |
| `healthcare=sexual_health` | `sexual_health_clinic` |
| `amenity=pharmacy` + `lgbtq=*` | `healthcare` |
| `social_facility=shelter` | `crisis_shelter` |
| `amenity=social_facility` (support) | `support_group` |
| `amenity=youth_centre` | `youth_center` |
| `office=ngo` + transgender tags | `transgender_services` |
| `office=lawyer` + `lgbtq=*` | `legal_aid` |
| `amenity=place_of_worship` + `lgbtq=*` | `religious_spiritual` |
| `shop=*` + `lgbtq=*` | `shop` |

---

## 4. Recommended Seed Pipeline

```
1. Overpass API  ──► GeoJSON export per city / bounding box
2. Wikidata SPARQL ──► JSON with coordinates + type labels
3. Transform script  ──► map tags → { name, category, safetyRating,
                              location: GeoJSON Point/Polygon,
                              status: "approved",
                              wheelchairAccessible: false (default) }
4. Bulk INSERT via NestJS seed script or direct psql COPY
5. District polygons ──► OSM boundary query → manual rating assignment
6. GADM Level-1/2 + ILGA scores ──► country-level district overlays
```

All seeded records should be inserted with `status = 'approved'` and a designated `seeder` reviewer account so the review trail is clean and the records appear on the public map immediately.

---

## 5. Licensing Summary

| Source | License | Commercial use |
| --- | --- | --- |
| OpenStreetMap | ODbL | Yes (with attribution) |
| Wikidata | CC0 | Yes |
| ILGA-Europe | Non-commercial | Advocacy/non-profit only |
| GADM | Academic/non-commercial | No |
| Natural Earth | Public domain | Yes |
| Foursquare | API ToS | Limited (check ToS) |
| Yelp Fusion | API ToS | Limited (check ToS) |

> **Note:** For a community project like Colours of Safety, OSM + Wikidata cover the vast majority of use cases under permissive licenses. Use Foursquare/Yelp only to fill gaps where OSM data is sparse.

---

## 6. Priority Order for Brussels Launch

1. **Overpass API** — query `lgbtq=*` within Brussels metropolitan bbox → immediate POI seed
2. **OSM boundary** — pull Ixelles, Saint-Gilles, Etterbeek district polygons + assign ratings
3. **Wikidata SPARQL** — enrich with named LGBTQ+ org data for Belgium
4. **ILGA Belgium score** — baseline for any national/regional district overlay
