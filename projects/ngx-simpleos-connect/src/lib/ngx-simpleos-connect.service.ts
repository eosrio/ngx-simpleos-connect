import {Injectable} from '@angular/core';
import {SimpleosConnect} from './simpleos-connect';
import {Authorization, Transaction, Wallet} from './interfaces';

@Injectable({
  providedIn: 'root'
})
export class NgxSimpleosConnectService {
  simpleosConnect: SimpleosConnect;

  constructor() {
    this.simpleosConnect = new SimpleosConnect();
  }

  initWallet(wallet: Wallet): void {
    return this.simpleosConnect.initWallet(wallet);
  }

  getWallet(): Wallet {
    return this.simpleosConnect.getWallet();
  }

  sessionCreated(): boolean {
    return this.simpleosConnect.sessionCreated();
  }

  connectWallet(): Promise<void> {
    return this.simpleosConnect.connectWallet();
  }

  disconnectWallet(): void {
    return this.simpleosConnect.disconnectWallet();
  }

  isWalletConnected(): boolean {
    return this.simpleosConnect.isWalletConnected();
  }

  getAuthorizations(chainId: string): Promise<Authorization[]> {
    return this.simpleosConnect.getAuthorizations(chainId);
  }

  logIn(authorization: Authorization): Promise<void> {
    return this.simpleosConnect.logIn(authorization);
  }

  logOut(): Promise<void> {
    return this.simpleosConnect.logOut();
  }

  isLoggedIn(): Promise<boolean> {
    return this.simpleosConnect.isLoggedIn();
  }

  transact(transaction: Transaction): Promise<void> {
    return this.simpleosConnect.transact(transaction);
  }

  getCurrentAuthorization(): Promise<Authorization> {
    return this.simpleosConnect.getCurrentAuthorization();
  }
}

