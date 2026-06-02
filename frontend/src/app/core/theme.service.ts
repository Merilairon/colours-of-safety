import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'theme';
  
  readonly isHighContrast = signal<boolean>(false);

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    this.isHighContrast.set(saved === 'high-contrast');
    
    if (this.isHighContrast()) {
      document.documentElement.classList.add('high-contrast');
    }
  }

  toggleHighContrast(): void {
    const newValue = !this.isHighContrast();
    this.isHighContrast.set(newValue);
    
    if (newValue) {
      document.documentElement.classList.add('high-contrast');
      localStorage.setItem(this.STORAGE_KEY, 'high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
      localStorage.setItem(this.STORAGE_KEY, 'normal');
    }
  }
}
