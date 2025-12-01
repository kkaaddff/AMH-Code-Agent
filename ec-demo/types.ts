enum ActionType {
  JumpType = 'jump',
  DialogType = 'dialog',
  CancelType = 'cancel',
  ToastType = 'toast',
  CloseAndJumpType = 'closeAndJump',
  CustomType = 'custom',
  RequestType = 'request',
}

interface ITrack {
  elementId: string;
  region: string;
  pageName?: string;
  extra: Record<string, unknown>;
}

interface IEcBadge {
  text: string;
  backgroundColor?: string;
  borderColor?: string;
}

interface IEcPopover {
  text: string;
  backgroundColor?: string;
}

interface IEcDialog {
  id: string;
  title: string;
  subTitle?: string;
  content: string;
  buttons?: IEcButton[];
  closable?: boolean;
  t?: ITrack;
  extMap?: Record<string, unknown>;
}

interface IAction<E = Record<string, unknown>> {
  actionType: ActionType;
  href?: string;
  toastMsg?: string;
  dialog?: IEcDialog;
  interfaceUrl?: string;
  ext?: E;
}

interface IAutoAction<E = Record<string, unknown>> {
  id: string;
  action: IAction<E>;
  t?: ITrack;
}

interface IEcButton<E = Record<string, unknown>> {
  id: string;
  action?: IAction<E>;
  icon?: string;
  text: string;
  subText?: string;
  backgroundColor?: string;
  borderColor?: string;
  disabled?: boolean;
  badge?: IEcBadge;
  t?: ITrack;
  popover?: IEcPopover;
  autoWidth?: boolean;
}
