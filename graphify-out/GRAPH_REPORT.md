# Graph Report - .  (2026-06-01)

## Corpus Check
- Corpus is ~9,469 words - fits in a single context window. You may not need a graph.

## Summary
- 428 nodes · 702 edges · 23 communities (18 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Backend Auth Module|Backend Auth Module]]
- [[_COMMUNITY_Backend Domain Entities|Backend Domain Entities]]
- [[_COMMUNITY_Angular Build Config|Angular Build Config]]
- [[_COMMUNITY_Frontend Markings Service|Frontend Markings Service]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Frontend App Shell & Routing|Frontend App Shell & Routing]]
- [[_COMMUNITY_Backend Package Config|Backend Package Config]]
- [[_COMMUNITY_Backend Dev Dependencies|Backend Dev Dependencies]]
- [[_COMMUNITY_Backend TypeScript Config|Backend TypeScript Config]]
- [[_COMMUNITY_Backend Runtime Dependencies|Backend Runtime Dependencies]]
- [[_COMMUNITY_Architecture Concepts|Architecture Concepts]]
- [[_COMMUNITY_Map Component|Map Component]]
- [[_COMMUNITY_E2E Test Config|E2E Test Config]]
- [[_COMMUNITY_NestJS CLI Config|NestJS CLI Config]]
- [[_COMMUNITY_Frontend API Proxy|Frontend API Proxy]]
- [[_COMMUNITY_Backend Build Config|Backend Build Config]]
- [[_COMMUNITY_VS Code Launch|VS Code Launch]]
- [[_COMMUNITY_VS Code Tasks|VS Code Tasks]]
- [[_COMMUNITY_VS Code Extensions|VS Code Extensions]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 22 edges
2. `AuthUser` - 19 edges
3. `MapComponent` - 17 edges
4. `User` - 16 edges
5. `UsersService` - 15 edges
6. `MarkingsService` - 15 edges
7. `AuthService` - 14 edges
8. `scripts` - 13 edges
9. `ReviewStatus` - 13 edges
10. `Poi` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Colours of Safety` --references--> `Geospatial Data Model`  [EXTRACTED]
  README.md → backend/src/pois/poi.entity.ts
- `Colours of Safety` --references--> `JWT Authentication`  [EXTRACTED]
  README.md → backend/src/auth/auth.service.ts
- `Review Moderation Workflow` --conceptually_related_to--> `Safety Rating System`  [EXTRACTED]
  README.md → frontend/src/app/core/safety.ts
- `Review Moderation Workflow` --conceptually_related_to--> `Role-Based Access Control`  [EXTRACTED]
  README.md → backend/src/users/user.entity.ts
- `Geospatial Data Model` --shares_data_with--> `PostGIS Spatial Database`  [EXTRACTED]
  backend/src/pois/poi.entity.ts → docker-compose.yml

## Hyperedges (group relationships)
- **Marking Submission Flow** — core_leaflet_map, core_geospatial, core_review_workflow, core_safety_rating, core_postgis [EXTRACTED 0.95]
- **Deployment Pipeline** — deploy_cicd, deploy_k8s, deploy_cloudflare, core_docker_compose [EXTRACTED 0.95]
- **Auth Security Stack** — core_jwt_auth, core_rbac, core_seed, frontend_auth_interceptor [EXTRACTED 0.95]

## Communities (23 total, 5 thin omitted)

### Community 0 - "Backend Auth Module"
Cohesion: 0.08
Nodes (23): AuthController, AuthModule, AuthResult, AuthService, AuthUser, JwtPayload, JwtStrategy, CurrentUser (+15 more)

### Community 1 - "Backend Domain Entities"
Cohesion: 0.09
Nodes (12): PointDto, PolygonDto, ReviewDto, ReviewStatus, District, DistrictsController, DistrictsService, CreateDistrictDto (+4 more)

### Community 2 - "Angular Build Config"
Cohesion: 0.05
Nodes (43): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+35 more)

### Community 3 - "Frontend Markings Service"
Cohesion: 0.10
Nodes (18): MarkingsService, CreateDistrictPayload, CreatePoiPayload, District, GeoPoint, GeoPolygon, Poi, ReviewPayload (+10 more)

### Community 4 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (31): dependencies, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/platform-browser, @angular/router, leaflet (+23 more)

### Community 5 - "Frontend App Shell & Routing"
Cohesion: 0.10
Nodes (11): App, appConfig, routes, LoginComponent, RegisterComponent, authInterceptor(), AuthService, authGuard() (+3 more)

### Community 6 - "Backend Package Config"
Cohesion: 0.07
Nodes (28): author, description, jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment (+20 more)

### Community 7 - "Backend Dev Dependencies"
Cohesion: 0.08
Nodes (25): devDependencies, eslint, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier, globals, jest (+17 more)

### Community 8 - "Backend TypeScript Config"
Cohesion: 0.09
Nodes (22): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+14 more)

### Community 9 - "Backend Runtime Dependencies"
Cohesion: 0.11
Nodes (18): dependencies, bcryptjs, class-transformer, class-validator, @nestjs/common, @nestjs/config, @nestjs/core, @nestjs/jwt (+10 more)

### Community 10 - "Architecture Concepts"
Cohesion: 0.14
Nodes (18): NestJS Backend API, Colours of Safety, Docker Compose Orchestration, Geospatial Data Model, JWT Authentication, Leaflet Map Integration, POI Category Taxonomy, PostGIS Spatial Database (+10 more)

### Community 12 - "E2E Test Config"
Cohesion: 0.29
Nodes (6): moduleFileExtensions, rootDir, testEnvironment, testRegex, transform, ^.+\\.(t|j)s$

### Community 13 - "NestJS CLI Config"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 14 - "Frontend API Proxy"
Cohesion: 0.40
Nodes (4): /api, changeOrigin, secure, target

## Knowledge Gaps
- **169 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+164 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Backend Dev Dependencies` to `Backend Package Config`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `MapComponent` connect `Map Component` to `Frontend Markings Service`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Backend Runtime Dependencies` to `Backend Package Config`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _169 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend Auth Module` be split into smaller, more focused modules?**
  _Cohesion score 0.07832167832167833 - nodes in this community are weakly interconnected._
- **Should `Backend Domain Entities` be split into smaller, more focused modules?**
  _Cohesion score 0.09219858156028368 - nodes in this community are weakly interconnected._
- **Should `Angular Build Config` be split into smaller, more focused modules?**
  _Cohesion score 0.04756871035940803 - nodes in this community are weakly interconnected._