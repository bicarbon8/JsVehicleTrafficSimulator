import { Component, reflectComponentType } from '@angular/core';

@Component({
  selector: 'app-root-traffic',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'JsVehicleTrafficSimulator';

  constructor() {
    const selector = reflectComponentType(AppComponent).selector;
    const parent = document.querySelector<HTMLElement>(selector);
    let rect: DOMRect;
    try {
        const main = document.querySelector('main') as HTMLElement;
        rect = main.getBoundingClientRect();
    } catch (e) {
        const body = document.querySelector('body') as HTMLElement;
        rect = body.getBoundingClientRect();
    }
    parent.style.width = `${rect.width}px`;
    parent.style.height = `${rect.height}px`;
  }
}
