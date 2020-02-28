export interface Wallet {
  walletName: string;
  protocol: string;
  url: string;
  connectionWaitingTime: number;
  requestWaitingTime: number;
}

export interface Authorization {
  actor: string;
  permission: string;
}

interface Action {
  account: string;
  name: string;
  authorization: Authorization[];
  data: any;
}
export interface Transaction {
  actions: Action[];
}
