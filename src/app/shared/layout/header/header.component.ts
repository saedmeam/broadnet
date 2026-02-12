import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule],
    template: `
    <header class="neu360-header">
      <h1>Broadnet - Bodega Keyla</h1>
      <div class="user-profile">
        <span>Usuario Demo</span>
      </div>
    </header>
  `,
    styles: [`
    .neu360-header {
      background: #f0f2f5;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
  `]
})
export class HeaderComponent { }
