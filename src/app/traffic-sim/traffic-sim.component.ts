import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RoadMap } from './map/road-map';
import { SimulationManager } from './simulation-manager';

@Component({
  selector: 'app-traffic-sim',
  templateUrl: './traffic-sim.component.html',
  styleUrls: ['./traffic-sim.component.css']
})
export class TrafficSimComponent implements OnInit {
  private _simMgr: SimulationManager;

  constructor(private httpClient: HttpClient) { }

  ngOnInit(): void {
    this._simMgr = SimulationManager.inst;
    this._simMgr.init();
    let path: string = 'assets/maps/intersection.json';
    this.httpClient.get(path).subscribe((data: RoadMap) =>{
      this._simMgr.getMapManager().loadMap(data);
    });
    this._simMgr.start();
  }
}
