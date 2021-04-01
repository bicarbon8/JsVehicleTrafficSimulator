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
  
  runningState: string;

  constructor(private httpClient: HttpClient) {
    this.runningState = 'running';
  }

  async ngOnInit(): Promise<void> {
    this._simMgr = SimulationManager.inst;
    this._simMgr.init('#traffic-sim');
    let mergeLoop: string = 'assets/maps/merge_loop.json';
    await this.loadMap(mergeLoop);
    this._simMgr.setRealtime(true);
    this._simMgr.start();
  }

  async loadMap(path: string): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        this.httpClient.get(path).subscribe((data: RoadMap) =>{
          this._simMgr.loadMap(data);
          resolve();
        });
      });
    } catch (e) {
      console.warn(e);
    }
  }

  isRunning(): boolean {
    return this._simMgr.isRunning();
  }

  async toggleAnimationState(): Promise<void> {
    if (this.isRunning()) {
      this.runningState = 'paused';
      this._simMgr.stop();
    } else {
      this.runningState = 'running';
      this._simMgr.start();
    }
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
