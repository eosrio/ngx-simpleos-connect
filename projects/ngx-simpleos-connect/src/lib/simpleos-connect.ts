import * as io from 'socket.io-client';
import race from 'async/race';
import {Authorization, Transaction, Wallet} from './interfaces';


const websocketClient = io;

const PORT_RANGE_BEGIN = 5000;
const PORT_RANGE_END = 5010;

export class SimpleosConnect {
  private socket: SocketIOClient.Socket;
  private port: number;
  private wallet: Wallet;
  private sessionUuid: string;

  constructor() {
    this.socket = null;
    this.port = 0;
    this.wallet = null;
    this.sessionUuid = '';
  }

  public initWallet(wallet: Wallet): void {
    // TODO: Check if wallet info is valid
    this.wallet = wallet;
  }

  public getWallet(): Wallet {
    return this.wallet;
  }

  public sessionCreated(): boolean {
    const sessionUuid = localStorage.getItem('session_uuid');
    return (sessionUuid !== null);
  }

  public async connectWallet(): Promise<void> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized.');
    }

    // Wallet already connected
    if (this.isWalletConnected()) {
      return;
    }

    const availablePorts = await this.checkAvailablePorts();

    if (this.port === 0) {
      if (availablePorts.length === 0) {
        throw new Error('Failed to connect to wallet. No port available.');
      }

      // Request connection on first available port
      this.port = availablePorts[0];
      await this.requestSocketConnection(this.port);
    }
    await this.connectSocket();

    if (!this.socket.connected) {
      // TODO: If not connected, try inputting new port number directly on wallet
      throw new Error('Failed to connect to wallet.');
    }

    this.sessionUuid = localStorage.getItem('session_uuid');
    if (!this.sessionUuid) {
      this.sessionUuid = null;
      return;
    }

    if (!await this.isLoggedIn()) {
      this.sessionUuid = null;
      localStorage.removeItem('session_uuid');
    }
  }

  public disconnectWallet(): void {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = null;
  }

  public isWalletConnected(): boolean {
    if (this.socket) {
      return this.socket.connected;
    }
    return false;
  }

  public getAuthorizations(chainId: string): Promise<Authorization[]> {
    return new Promise<Authorization[]>((resolve, reject) => {

      if (!this.isWalletConnected()) {
        reject('Wallet not connected.');
      }

      this.socket.emit('get_authorizations', chainId, (response) => {
        resolve(response);
      });
    });
  }

  public logIn(authorization: Authorization): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.isWalletConnected()) {
        reject('Wallet not connected.');
      }

      const data = window.crypto.getRandomValues(new Uint8Array(16));
      const sessionUuid = Array.from(data).map(b => b.toString(16).padStart(2, "0")).join("");

      this.socket.emit('log_in', sessionUuid, authorization, () => {
        localStorage.setItem('session_uuid', sessionUuid);
        this.sessionUuid = sessionUuid;
        resolve();
      });
    });
  }

  public logOut(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.isWalletConnected()) {
        reject('Wallet not connected.');
      }

      this.socket.emit('log_out', () => {
        this.sessionUuid = '';
        localStorage.removeItem('session_uuid');
        resolve();
      });
    });
  }

  public isLoggedIn(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (!this.isWalletConnected()) {
        reject('Wallet not connected.');
      }

      this.socket.emit('is_logged_in', this.sessionUuid, (response) => {
        resolve(response);
      });
    });
  }

  public getCurrentAuthorization(): Promise<Authorization> {
    return new Promise<Authorization>(async (resolve, reject) => {
      if (!this.isWalletConnected()) {
        reject('Wallet not connected.');
      }

      if (!await this.isLoggedIn()) {
        reject('Not logged in.');
      }

      this.socket.emit('get_current_authorization', this.sessionUuid, (response) => {
        resolve(response);
      });
    });
  }

  public async transact(transaction: Transaction): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      // TODO: Check if transaction's authorization is the same as the selected one

      if (!this.isWalletConnected()) {
        reject('Wallet not connected.');
      }

      if (!await this.isLoggedIn()) {
        reject('Not logged in.');
      }

      this.socket.emit('transact', transaction, (response) => {
        if (response) {
          resolve(response);
        } else {
          reject('Transaction failed.');
        }
      });
    });
  }

  private async checkAvailablePorts(): Promise<number[]> {
    const attempts = [];
    const availablePorts: number[] = [];

    for (let port = PORT_RANGE_BEGIN; port < PORT_RANGE_END; port++) {
      attempts.push(async (callback) => {
        // Abort http requests for ports in use (ports that neither respond nor fail)
        const controller = new AbortController();
        const timeout = setTimeout(() => {
          controller.abort();
        }, 500);

        fetch(this.wallet.url + ':' + port + '/simpleos_ping', {
          mode: 'cors',
          signal: controller.signal
        }).then((response) => {
          callback(response, port);
        }).catch(() => {
          availablePorts.push(port);
          clearTimeout(timeout);
        });
      });
    }

    race(attempts, (response, port) => {
      // pong
      this.port = port;
    });

    return new Promise<number[]>((resolve) => {
      setTimeout(() => {
        resolve(availablePorts);
      }, 200);
    });
  }

  private connectSocket(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      this.socket = websocketClient(this.wallet.url + ':' + this.port, {reconnection: false});

      this.socket.on('disconnect', () => {
        this.sessionUuid = '';
        localStorage.removeItem('session_uuid');
      });

      setTimeout(() => {
        resolve(this.socket.connected);
      }, this.wallet.connectionWaitingTime);
    });
  }

  private requestSocketConnection(port): Promise<void> {
    return new Promise<void>((resolve) => {
      open(this.wallet.protocol + '://websocket_connection/' + port, '_self');
      setTimeout(() => {
        resolve();
      }, this.wallet.requestWaitingTime);
    });
  }
}
