import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <nav class="neu360-menu">
      <ul>
        <li><a routerLink="/revisor">Revisor</a></li>
        <li><a routerLink="/bodega-central">Bodega Central</a></li>
        <li><a routerLink="/tablas">Tablas Maestras</a></li>
      </ul>
    </nav>
  `,
    styles: [`
    .neu360-menu {
      width: 250px;
      height: 100vh;
      background: #ffffff;
      border-right: 1px solid #ddd;
      padding: 1rem;
    }
    ul { list-style: none; padding: 0; }
    li { margin-bottom: 1rem; }
    a { text-decoration: none; color: #333; font-weight: 600; }
    a:hover { color: #007bff; }
  `]
})
export class MenuComponent { }
