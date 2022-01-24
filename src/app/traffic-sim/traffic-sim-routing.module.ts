import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TrafficSimComponent } from './traffic-sim.component';

const routes: Routes = [
  {path: '', component: TrafficSimComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrafficSimRoutingModule { }
