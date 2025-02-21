import tokenize from "./_tokenize";

class EnumBuilder {
  private _vals: Map<string, number>;
  private _cnt: number;

  constructor() {
    this._vals = new Map();
    this._cnt = 0;
  }

  get(name: string) {
    let idx = this._vals.get(name);
    if (idx == null) {
      idx = this._cnt;
      this._cnt++;
      this._vals.set(name, idx);
    }

    return idx;
  }

  toJSON() {
    return Array.from(this._vals.keys());
  }
}

type FieldType = "text" | "enum" | "name";

export interface FieldJSON {
  id: number;
  name: string;
  index: boolean;
  publish: boolean;
  type: FieldType;
  count: number;
  enum?: string[];
}

export class Field {
  private _id: number;
  private _name: string;
  private _index: boolean;
  private _publish: boolean;
  private _type: FieldType;
  private _count: number;
  private _required: boolean;
  private _enum?: EnumBuilder;

  constructor(
    id: number,
    name: string,
    index: boolean,
    publish: boolean,
    type: FieldType,
    required: boolean
  ) {
    if (type != "text" && type != "enum" && type != "name") {
      throw `cannot add field "${name}": unsupported type "${type}"`;
    }

    this._id = id;
    this._name = name;
    this._index = index;
    this._publish = publish;
    this._type = type;
    this._count = 0;
    this._required = required;

    if (type == "enum") {
      this._enum = new EnumBuilder();
    }
  }

  get id() {
    return this._id;
  }

  get required() {
    return this._required;
  }

  get name() {
    return this._name;
  }

  get index() {
    return this._index;
  }

  get publish() {
    return this._publish;
  }

  get type() {
    return this._type;
  }

  get count() {
    return this._count;
  }
  set count(count: number) {
    this._count = count;
  }

  transformValue(val: string) {
    if (this._type == "enum") {
      return this._enum!.get(val);
    }
    return val;
  }

  toJSON(): FieldJSON {
    const f: FieldJSON = {
      id: this._id,
      name: this._name,
      index: this._index,
      publish: this._publish,
      type: this._type,
      count: this._count,
    };

    if (this._type == "enum") {
      f.enum = this._enum as string[] | undefined;
    }

    return f;
  }
}

type CustomTokenizer<T> = (str: string, doc: T) => string[];

export default class Builder<T extends any> {
  private _fields: Field[];
  private _index: any;
  private _documents: any[];
  private _customTokenizers: Map<string, CustomTokenizer<T>>;

  constructor() {
    this._fields = [];
    this._index = Object.create(null);
    this._documents = [];
    this._customTokenizers = new Map();
  }

  addField(
    name: string,
    {
      index = false,
      publish = false,
      type = "text",
      required = false,
      customTokenizer,
    }: {
      index?: boolean;
      publish?: boolean;
      type?: FieldType;
      required?: boolean;
      customTokenizer?: CustomTokenizer<T>;
    }
  ) {
    let id = this._fields.length;
    let field = new Field(id, name, index, publish, type, required);
    this._fields.push(field);
    if (customTokenizer) {
      this._customTokenizers.set(name, customTokenizer);
    }
  }

  addDocument(doc: T, boost = 1) {
    let newDoc = [];
    let docId = this._documents.length;

    let indexIt = (field: Field, tok: string, weight: number = 1) => {
      let last = this._index;
      for (let ch of tok) {
        if (!last[ch]) {
          last[ch] = Object.create(null);
        }
        last = last[ch];
      }

      let termInfo = last[" "];
      if (!termInfo) {
        termInfo = last[" "] = {};
      }

      let fieldTermInfo = termInfo[field.id];
      if (!fieldTermInfo) {
        fieldTermInfo = termInfo[field.id] = Object.create(null);
      }

      if (!fieldTermInfo[docId]) {
        fieldTermInfo[docId] = 0;
      }

      fieldTermInfo[docId] += weight;
    };

    for (let field of this._fields) {
      let val = (doc as any)[field.name];
      if (val) {
        field.count++;
      } else {
        if (field.required) {
          throw `document ${doc} is missing a required field ${field.name}`;
        }
      }

      if (field.index && val) {
        const customTokenizer = this._customTokenizers.get(field.name);
        if (customTokenizer) {
          for (const tok of customTokenizer(val, doc)) {
            indexIt(field, tok);
          }
        } else {
          let preserve_stop_words = field.type == "name" || field.publish;
          let tokens = tokenize(val, !preserve_stop_words);

          for (let tok of tokens) {
            indexIt(field, tok.stemmed);

            if (field.type == "name") {
              indexIt(field, tok.orig.toLowerCase(), 2);
            }
          }
        }
      }

      if (field.publish) {
        newDoc[field.id] = field.transformValue(val);
      }
    }

    newDoc[this._fields.length] = boost;

    this._documents.push(newDoc);
  }

  toJSON() {
    function walkIndex(tree: {[key: string]: any}) {
      let newTree = Object.create(null);

      for (let key of Object.keys(tree)) {
        if (key == " ") {
          let idx = [];
          for (let [fieldId, docInfo] of Object.entries<any>(tree[" "])) {
            for (let [docId, freq] of Object.entries<any>(docInfo)) {
              idx.push(parseInt(fieldId), parseInt(docId), parseInt(freq));
            }
          }
          newTree[" "] = idx;
        } else {
          newTree[key] = walkIndex(tree[key]);
        }
      }

      return newTree;
    }

    return {
      fields: this._fields,
      documents: this._documents,
      index: walkIndex(this._index),
    };
  }
}
