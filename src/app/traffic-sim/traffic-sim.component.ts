import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Utils } from './helpers/utils';
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

  async ngOnInit(): Promise<void> {
    this._simMgr = SimulationManager.inst;
    this._simMgr.init('#traffic-sim');
    let path: string = 'assets/maps/intersection.json';
    await this.loadMap(path);
    this._simMgr.setRealtime(true);
    this._simMgr.start();
  }

  async loadMap(path: string): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        this.httpClient.get(path).subscribe((data: RoadMap) =>{
          if (!data) {
            reject(`unable to load map data from '${path}'`);
          } else {
            this._simMgr.loadMap(data);
            resolve();
          }
        });
      });
    } catch (e) {
      console.warn(e);
    }
  }

  async toggleAnimationState(): Promise<void> {
    this._simMgr.toggleAnimationState();
  }

  async updateTimeStep(step: number): Promise<void> {
    if (!isNaN(step)) {
      this._simMgr.setTimestep(step);
    }
  }

  getSimulationTimeElapsed(): string {
    return Utils.convertMsToHumanReadable(this._simMgr.getTotalElapsed());
  }
}
