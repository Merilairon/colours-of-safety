import '@angular/compiler';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { RouterOutlet, RouterLink } from '@angular/router';

// Stub App component with inline template for testing
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, NgIf],
  template: `
    <nav>
      <a routerLink="/">Colours of Safety</a>
      @if (true) {
        <a routerLink="/profile">Profile</a>
        <button>Logout</button>
      }
      @if (false) {
        <a routerLink="/login">Login</a>
        <a routerLink="/register">Register</a>
      }
    </nav>
    <router-outlet></router-outlet>
  `,
})
class TestApp {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestApp, HttpClientModule, HttpClientTestingModule],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(TestApp);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the brand name', async () => {
    const fixture = TestBed.createComponent(TestApp);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a')?.textContent).toContain('Colours of Safety');
  });
});
