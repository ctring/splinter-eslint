export class JsonMessage {
  constructor(public readonly type: string) {}

  toString(): string {
    return JSON.stringify(this);
  }
}

export class EntityMessage extends JsonMessage {
  constructor(public readonly name: string) {
    super('entity');
  }

  static validate(message: JsonMessage): message is EntityMessage {
    return message.type === 'entity';
  }
}

export class Attribute {
  constructor(
    public readonly name: string,
    public readonly start_line: number,
    public readonly start_column: number,
    public readonly end_line: number,
    public readonly end_column: number
  ) {}
}

export class MethodMessage extends JsonMessage {
  constructor(
    public readonly name: string,
    public readonly methodType: 'read' | 'write' | 'other' | 'transaction',
    public readonly object: string,
    public readonly objectTypes: string[],
    public readonly attributes: Attribute[]
  ) {
    super('method');
  }

  static validate(message: JsonMessage): message is MethodMessage {
    return message.type === 'method';
  }
}
