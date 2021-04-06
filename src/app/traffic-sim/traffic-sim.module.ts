import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { TrafficSimRoutingModule } from './traffic-sim-routing.module';
import { TrafficSimComponent } from './traffic-sim.component';


@NgModule({
  declarations: [TrafficSimComponent],
  imports: [
    CommonModule,
    TrafficSimRoutingModule,
    HttpClientModule
  ]
})
export class TrafficSimModule { }
