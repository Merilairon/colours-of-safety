/**
 * LSA-A1: the place list is a keyboard-operable text alternative to the map.
 */
import '@angular/compiler';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { PlaceListComponent, PlaceListItem } from './place-list';

const item = (id: string, name: string): PlaceListItem => ({
  id,
  name,
  category: 'Cafe',
  ratingLabel: 'Friendly',
  symbol: '✓',
  color: '#7cb518',
  symbolColor: '#1d1f2b',
  wheelchairAccessible: id === 'a',
  distance: '120 m',
});

describe('PlaceListComponent', () => {
  let fixture: ComponentFixture<PlaceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PlaceListComponent] }).compileComponents();
    fixture = TestBed.createComponent(PlaceListComponent);
  });

  function render(places: PlaceListItem[], total = places.length): HTMLElement {
    fixture.componentRef.setInput('places', places);
    fixture.componentRef.setInput('total', total);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders each place as a button with name, category, rating and distance', () => {
    const el = render([item('a', 'Rainbow Cafe'), item('b', 'Pride Books')]);
    const buttons = el.querySelectorAll<HTMLButtonElement>('button.item');

    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('Rainbow Cafe');
    expect(buttons[0].textContent).toContain('Cafe · Friendly');
    expect(buttons[0].textContent).toContain('wheelchair accessible');
    expect(buttons[0].textContent).toContain('120 m');
    expect(buttons[1].textContent).not.toContain('wheelchair accessible');
    expect(el.querySelector('h2')?.textContent).toContain('Places in view (2)');
  });

  it('hides the colour symbol from screen readers', () => {
    const el = render([item('a', 'Rainbow Cafe')]);
    expect(el.querySelector('.symbol')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('emits the selected place with the row as focus-return target', () => {
    const el = render([item('a', 'Rainbow Cafe')]);
    let selected: { id: string; trigger: HTMLElement } | undefined;
    fixture.componentInstance.selectPlace.subscribe((e) => (selected = e));

    el.querySelector<HTMLButtonElement>('button.item')!.click();

    expect(selected?.id).toBe('a');
    expect(selected?.trigger).toBe(el.querySelector('button.item'));
  });

  it('explains when only the nearest places are listed', () => {
    const el = render([item('a', 'Rainbow Cafe')], 120);
    expect(el.textContent).toContain('Showing the 1 closest to the map centre');
  });

  it('shows an empty state', () => {
    const el = render([], 0);
    expect(el.textContent).toContain('No places match here');
    expect(el.querySelector('ul')).toBeNull();
  });
});
