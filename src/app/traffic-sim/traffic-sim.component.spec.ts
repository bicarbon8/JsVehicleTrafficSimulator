import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrafficSimComponent } from './traffic-sim.component';

describe('TrafficSimComponent', () => {
  let component: TrafficSimComponent;
  let fixture: ComponentFixture<TrafficSimComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrafficSimComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrafficSimComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
