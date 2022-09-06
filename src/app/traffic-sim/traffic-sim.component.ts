import { HttpClient } from '@angular/common/http';
import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { RoadMap, RoadMapOptions } from './map/road-map';
import { environment } from '../../environments/environment';
import { TrafficSim } from './view/traffic-sim';

@Component({
  selector: 'app-traffic-sim',
  templateUrl: './traffic-sim.component.html',
  styleUrls: ['./traffic-sim.component.css']
})
export class TrafficSimComponent implements OnInit, OnDestroy {
  runningState: string;
  elapsed: string;

  constructor(private httpClient: HttpClient, private zone: NgZone) {
    this.runningState = 'running';
  }
  
  async ngOnInit(): Promise<void> {
    const path: string = 'assets/maps/intersection.json';
    this.zone.runOutsideAngular(() => {
      TrafficSim.inst.start();
      TrafficSim.inst.game.events.once(Phaser.Scenes.Events.READY, () => this.loadLocalMap(path));
    });
  }

  ngOnDestroy(): void {
    TrafficSim.inst.stop();
  }

  async loadLocalMap(lpath: string): Promise<void> {
    await this.loadMap(`${environment.baseUrl}/${lpath}`);
  }

  async loadMap(fpath: string): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        this.httpClient.get(fpath).subscribe((data: RoadMapOptions) =>{
          TrafficSim.inst.roadMap = new RoadMap(data);
          resolve();
        });
      });
    } catch (e) {
      console.warn(e);
    }
  }

  isRunning(): boolean {
    return TrafficSim.inst.game.isRunning;
  }

  async toggleAnimationState(): Promise<void> {
    if (this.isRunning()) {
      this.runningState = 'paused';
      TrafficSim.inst.stop();
    } else {
      this.runningState = 'running';
      this.zone.runOutsideAngular(() => {
        TrafficSim.inst.start();
      });
    }
  }
}
