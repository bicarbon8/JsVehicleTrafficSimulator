import { HttpClient } from '@angular/common/http';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Utils } from './helpers/utils';
import { RoadMap } from './map/road-map';
import { SimulationManager } from './simulation-manager';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-traffic-sim',
  templateUrl: './traffic-sim.component.html',
  styleUrls: ['./traffic-sim.component.css']
})
export class TrafficSimComponent implements OnInit, OnDestroy {
  #simMgr: SimulationManager;
  
  runningState: string;
  elapsed: string;

  constructor(private httpClient: HttpClient, private zone: NgZone) {
    this.runningState = 'running';
  }
  
  async ngOnInit(): Promise<void> {
    this.#simMgr = SimulationManager.inst;
    this.#simMgr.init('#traffic-sim');
    let path: string = 'assets/maps/intersection.json';
    await this.loadLocalMap(path);
    this.zone.runOutsideAngular(() => {
      this.#simMgr.start();
    });
  }

  ngOnDestroy(): void {
    this.#simMgr.destroy();
  }

  async loadLocalMap(lpath: string): Promise<void> {
    await this.loadMap(`${environment.baseUrl}/${lpath}`);
  }

  async loadMap(fpath: string): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        this.httpClient.get(fpath).subscribe((data: RoadMap) =>{
          this.#simMgr.loadMap(data);
          resolve();
        });
      });
    } catch (e) {
      console.warn(e);
    }
  }

  isRunning(): boolean {
    return this.#simMgr.isRunning();
  }

  async toggleAnimationState(): Promise<void> {
    if (this.isRunning()) {
      this.runningState = 'paused';
      this.#simMgr.stop();
    } else {
      this.runningState = 'running';
      this.zone.runOutsideAngular(() => {
        this.#simMgr.start();
      });
    }
  }

  toggleDebug(): void {
    this.#simMgr.toggleDebugging();
  }

  async updateTimeStep(step: number): Promise<void> {
    if (!isNaN(step)) {
      this.#simMgr.setTimestep(step);
    }
  }

  getSimulationTimeElapsed(): string {
    return Utils.convertMsToHumanReadable(this.#simMgr.getTotalElapsed());
  }
}
