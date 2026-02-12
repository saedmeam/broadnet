import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet],
    template: `
    <div class="main-container">
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
    styles: [`
    .main-container { padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .content { min-height: 100vh; }
  `]
})
export class App {
    protected readonly title = signal('broadnet');
}
