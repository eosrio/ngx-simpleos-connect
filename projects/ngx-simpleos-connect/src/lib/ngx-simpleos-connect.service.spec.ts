import {TestBed} from '@angular/core/testing';

import {NgxSimpleosConnectService} from './ngx-simpleos-connect.service';

describe('NgxSimpleosConnectService', () => {
  let service: NgxSimpleosConnectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxSimpleosConnectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
