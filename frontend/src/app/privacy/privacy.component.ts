import { Component } from '@angular/core';
import { PRIVACY_EMAIL } from '../core/contact';

@Component({
  selector: 'app-privacy',
  imports: [],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
})
export class PrivacyComponent {
  protected readonly privacyEmail = PRIVACY_EMAIL;
}
