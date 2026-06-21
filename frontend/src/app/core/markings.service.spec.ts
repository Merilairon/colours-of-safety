import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';
import { MarkingsService } from './markings.service';
import { CreateDistrictPayload, CreatePoiPayload, District, Poi, ReviewPayload } from './models';
import type { HttpClient } from '@angular/common/http';

describe('MarkingsService', () => {
  let service: MarkingsService;
  let httpClientMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    httpClientMock = {
      get: vi.fn().mockReturnValue(of([])),
      post: vi.fn().mockReturnValue(of({})),
      patch: vi.fn().mockReturnValue(of({})),
      put: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of(null)),
    };

    service = new MarkingsService(httpClientMock as unknown as HttpClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POIs', () => {
    const mockPoi: Poi = {
      id: 'poi-1',
      name: 'Test POI',
      description: 'Description',
      category: 'cafe',
      safetyRating: 4,
      wheelchairAccessible: true,
      location: { type: 'Point', coordinates: [4.35, 50.85] },
      status: 'pending',
      voteCount: 0,
      reviewNote: null,
      createdAt: '2024-01-01T00:00:00Z',
      isAnonymous: false,
    };

    describe('getApprovedPois', () => {
      it('fetches approved POIs', () => {
        const mockPois: Poi[] = [mockPoi];
        httpClientMock.get.mockReturnValue(of(mockPois));

        service.getApprovedPois().subscribe((pois) => {
          expect(pois).toEqual(mockPois);
        });

        expect(httpClientMock.get).toHaveBeenCalledWith('/api/pois');
      });
    });

    describe('getPendingPois', () => {
      it('fetches pending POIs', () => {
        const mockPois: Poi[] = [{ ...mockPoi, status: 'pending' }];
        httpClientMock.get.mockReturnValue(of(mockPois));

        service.getPendingPois().subscribe((pois) => {
          expect(pois).toEqual(mockPois);
        });

        expect(httpClientMock.get).toHaveBeenCalledWith('/api/pois/pending');
      });
    });

    describe('getMyPois', () => {
      it('fetches current user POIs', () => {
        const mockPois: Poi[] = [mockPoi];
        httpClientMock.get.mockReturnValue(of(mockPois));

        service.getMyPois().subscribe((pois) => {
          expect(pois).toEqual(mockPois);
        });

        expect(httpClientMock.get).toHaveBeenCalledWith('/api/pois/mine');
      });
    });

    describe('createPoi', () => {
      it('creates a new POI', () => {
        const payload: CreatePoiPayload = {
          name: 'New POI',
          description: 'New Description',
          category: 'bar',
          safetyRating: 5,
          wheelchairAccessible: true,
          location: { type: 'Point', coordinates: [4.36, 50.86] },
        };
        httpClientMock.post.mockReturnValue(of(mockPoi));

        service.createPoi(payload).subscribe((poi) => {
          expect(poi).toEqual(mockPoi);
        });

        expect(httpClientMock.post).toHaveBeenCalledWith('/api/pois', payload);
      });
    });

    describe('reviewPoi', () => {
      it('reviews a POI', () => {
        const payload: ReviewPayload = { status: 'approved', reviewNote: 'Looks good' };
        const reviewedPoi: Poi = { ...mockPoi, status: 'approved', reviewNote: 'Looks good' };
        httpClientMock.patch.mockReturnValue(of(reviewedPoi));

        service.reviewPoi('poi-1', payload).subscribe((poi) => {
          expect(poi).toEqual(reviewedPoi);
        });

        expect(httpClientMock.patch).toHaveBeenCalledWith('/api/pois/poi-1/review', payload);
      });
    });

    describe('updatePoi', () => {
      it('updates an existing POI', () => {
        const payload: CreatePoiPayload = {
          name: 'Updated POI',
          safetyRating: 3,
          location: { type: 'Point', coordinates: [4.37, 50.87] },
        };
        const updatedPoi: Poi = { ...mockPoi, name: 'Updated POI' };
        httpClientMock.put.mockReturnValue(of(updatedPoi));

        service.updatePoi('poi-1', payload).subscribe((poi) => {
          expect(poi).toEqual(updatedPoi);
        });

        expect(httpClientMock.put).toHaveBeenCalledWith('/api/pois/poi-1', payload);
      });
    });

    describe('deletePoi', () => {
      it('deletes a POI', () => {
        httpClientMock.delete.mockReturnValue(of(null));

        service.deletePoi('poi-1').subscribe((result) => {
          expect(result).toBeNull();
        });

        expect(httpClientMock.delete).toHaveBeenCalledWith('/api/pois/poi-1');
      });
    });
  });

  describe('Districts', () => {
    const mockDistrict: District = {
      id: 'district-1',
      name: 'Test District',
      description: 'Description',
      safetyRating: 4,
      wheelchairAccessible: true,
      area: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      },
      status: 'approved',
      voteCount: 0,
      reviewNote: null,
      createdAt: '2024-01-01T00:00:00Z',
      isAnonymous: false,
      blendEdges: false,
    };

    describe('getApprovedDistricts', () => {
      it('fetches approved districts', () => {
        const mockDistricts: District[] = [mockDistrict];
        httpClientMock.get.mockReturnValue(of(mockDistricts));

        service.getApprovedDistricts().subscribe((districts) => {
          expect(districts).toEqual(mockDistricts);
        });

        expect(httpClientMock.get).toHaveBeenCalledWith('/api/districts');
      });
    });

    describe('getPendingDistricts', () => {
      it('fetches pending districts', () => {
        const mockDistricts: District[] = [{ ...mockDistrict, status: 'pending' }];
        httpClientMock.get.mockReturnValue(of(mockDistricts));

        service.getPendingDistricts().subscribe((districts) => {
          expect(districts).toEqual(mockDistricts);
        });

        expect(httpClientMock.get).toHaveBeenCalledWith('/api/districts/pending');
      });
    });

    describe('getMyDistricts', () => {
      it('fetches current user districts', () => {
        const mockDistricts: District[] = [mockDistrict];
        httpClientMock.get.mockReturnValue(of(mockDistricts));

        service.getMyDistricts().subscribe((districts) => {
          expect(districts).toEqual(mockDistricts);
        });

        expect(httpClientMock.get).toHaveBeenCalledWith('/api/districts/mine');
      });
    });

    describe('createDistrict', () => {
      it('creates a new district', () => {
        const payload: CreateDistrictPayload = {
          name: 'New District',
          description: 'New Description',
          safetyRating: 5,
          wheelchairAccessible: true,
          area: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [2, 0],
                [2, 2],
                [0, 2],
                [0, 0],
              ],
            ],
          },
          blendEdges: true,
        };
        httpClientMock.post.mockReturnValue(of(mockDistrict));

        service.createDistrict(payload).subscribe((district) => {
          expect(district).toEqual(mockDistrict);
        });

        expect(httpClientMock.post).toHaveBeenCalledWith('/api/districts', payload);
      });
    });

    describe('reviewDistrict', () => {
      it('reviews a district', () => {
        const payload: ReviewPayload = { status: 'approved' };
        const reviewedDistrict: District = { ...mockDistrict, status: 'approved' };
        httpClientMock.patch.mockReturnValue(of(reviewedDistrict));

        service.reviewDistrict('district-1', payload).subscribe((district) => {
          expect(district).toEqual(reviewedDistrict);
        });

        expect(httpClientMock.patch).toHaveBeenCalledWith(
          '/api/districts/district-1/review',
          payload,
        );
      });
    });

    describe('updateDistrict', () => {
      it('updates an existing district', () => {
        const payload: CreateDistrictPayload = {
          name: 'Updated District',
          safetyRating: 3,
          area: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [3, 0],
                [3, 3],
                [0, 3],
                [0, 0],
              ],
            ],
          },
        };
        const updatedDistrict: District = { ...mockDistrict, name: 'Updated District' };
        httpClientMock.put.mockReturnValue(of(updatedDistrict));

        service.updateDistrict('district-1', payload).subscribe((district) => {
          expect(district).toEqual(updatedDistrict);
        });

        expect(httpClientMock.put).toHaveBeenCalledWith('/api/districts/district-1', payload);
      });
    });

    describe('deleteDistrict', () => {
      it('deletes a district', () => {
        httpClientMock.delete.mockReturnValue(of(null));

        service.deleteDistrict('district-1').subscribe((result) => {
          expect(result).toBeNull();
        });

        expect(httpClientMock.delete).toHaveBeenCalledWith('/api/districts/district-1');
      });
    });
  });
});
