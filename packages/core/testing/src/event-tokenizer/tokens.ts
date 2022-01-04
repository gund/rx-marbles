export class MarbleEventToken {
  constructor(public text: string, public pos: MarbleEventTokenPos) {}

  toString() {
    return this.text;
  }
}

export interface MarbleEventTokenPos {
  start: number;
  end: number;
}

export class FrameMarbleEventToken extends MarbleEventToken {}

export class StartMarbleEventToken extends MarbleEventToken {}

export class CloseMarbleEventToken extends MarbleEventToken {}

export class ParenMarbleEventToken extends MarbleEventToken {
  constructor(public isOpen: boolean, text: string, pos: MarbleEventTokenPos) {
    super(text, pos);
  }
}

export class GroupMarbleEventToken extends MarbleEventToken {
  constructor(public isOpen: boolean, text: string, pos: MarbleEventTokenPos) {
    super(text, pos);
  }
}

export class StringMarbleEventToken extends MarbleEventToken {
  constructor(public value: string, text: string, pos: MarbleEventTokenPos) {
    super(text, pos);
  }
}
