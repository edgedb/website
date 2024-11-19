import tokenize from "./_tokenize";
import {FieldJSON} from "./builder";

export interface IndexSearchResult {
  doc: {
    content: null;
    name: string;
    relname: string;
    signature: null;
    summary: string;
    target: string;
    title: string;
    type: string;
    version?: string;
  };
  id: number;
  score: number;
  indexId: string;
}

export interface IndexSearchReturn {
  hash: string;
  query: {
    orig: string;
    stripped: string;
    stemmed: string;
  }[];
  results: IndexSearchResult[];
}

export default class Index {
  private _fields: Map<number, FieldJSON>;
  private _documents: any;
  private _fieldsByName: Map<string, FieldJSON>;
  private _index: any;
  private _suggestionsTrie: any;
  private _docNum: number;
  private _docSum: Float64Array;
  private _docCnt: Int16Array;

  constructor(
    public indexId: string,
    fields: Map<number, FieldJSON>,
    documents: any,
    index: any,
    boost: any
  ) {
    this._fields = fields;
    this._documents = documents;

    this._fieldsByName = new Map();
    for (let f of this._fields.values()) {
      this._fieldsByName.set(f.name, f);
    }

    [this._index, this._suggestionsTrie] = this._buildIndex(index, boost);

    this._docNum = this._documents.size;
    this._docSum = new Float64Array(this._docNum);
    this._docCnt = new Int16Array(this._docNum);
  }

  search(query: string): IndexSearchReturn {
    let terms = tokenize(query, false, true); // false to use SUPER_STOPS list

    let docNum = this._docNum;
    let docSum = this._docSum;
    let docCnt = this._docCnt;

    docSum.fill(0);
    docCnt.fill(0);

    for (let [i, term] of terms.entries()) {
      let isLastAndUnfinished = i == terms.length - 1 && /\S$/.test(query);
      let suggested = false;

      let docFieldFreq = this._index.get(term.stemmed);
      if (!docFieldFreq && isLastAndUnfinished) {
        let suggestedTerm = this._suggest(term.orig);
        if (!suggestedTerm) {
          suggestedTerm = this._suggest(term.stemmed);
          if (!suggestedTerm) {
            continue;
          }
        }

        docFieldFreq = this._index.get(suggestedTerm);
        if (!docFieldFreq) {
          console.error(
            'the suggested term "' + suggestedTerm + '" is not in the index'
          );
          continue;
        }

        suggested = true;
      }

      if (!docFieldFreq) {
        continue;
      }

      for (let docId = 0; docId < docNum; docId++) {
        if (docCnt[docId] < 0) {
          // docId is not in a result set
          continue;
        }

        let fieldsFreq = docFieldFreq.get(docId);
        if (!fieldsFreq) {
          if (!suggested && !isLastAndUnfinished) {
            docCnt[docId] = -1; // exclude this docId from the results
          } else {
            // the document doesn't have the last query term (that
            // is still partially type.)  Still, we need to penalize
            // this docId (as other *might* have this partial term!)
            docCnt[docId] += 10;
          }
          continue;
        }

        for (let freq of fieldsFreq.values()) {
          docSum[docId] += freq * freq;
          docCnt[docId]++;
        }
      }
    }

    let weighted = [];
    for (let docId = 0; docId < docNum; docId++) {
      if (docCnt[docId] <= 0 || !docSum[docId]) {
        // docId is not in a result set
        continue;
      }

      const doc = this._documents.get(docId);

      weighted.push([
        docId,
        doc,
        (Math.sqrt(docSum[docId]) / docCnt[docId]) * doc._boost,
      ]);
    }
    weighted.sort((a, b) => b[2] - a[2]);

    let results = [];
    let hash = [];
    for (let [docId, doc, score] of weighted) {
      hash.push(docId);
      results.push({
        id: docId,
        doc: doc,
        score: score,
        indexId: this.indexId,
      });
    }

    return {
      results: results,
      query: terms,
      hash: hash.join("-"),
    };
  }

  _suggest(term: string) {
    let top = this._suggestionsTrie;
    for (let ch of term) {
      top = top[ch];
      if (!top) {
        return;
      }
    }
    if (!top || !top[" "]) {
      return;
    }
    return top[" "][0];
  }

  _buildIndex(index: any, boost: any) {
    let fieldBoost = Object.create(null);
    if (boost) {
      for (let fieldName of Object.keys(boost)) {
        let field = this._fieldsByName.get(fieldName);
        if (!field) {
          throw "unknown field " + fieldName + " in boost dict";
        }
        fieldBoost[field.id] = boost[fieldName];
      }
    }

    let walkRawIndex = (term: string, index: any) => {
      for (let ch of Object.keys(index)) {
        if (ch == " ") {
          let freqs = index[ch];
          for (let i = 0; i < freqs.length; i += 3) {
            let fieldId = freqs[i];
            let docId = freqs[i + 1];
            let termCount = freqs[i + 2];

            let fieldCount = termFieldCount.get(term);
            if (!fieldCount) {
              fieldCount = new Map();
            }
            fieldCount.set(fieldId, (fieldCount.get(fieldId) || 0) + 1);
            termFieldCount.set(term, fieldCount);

            if (!fieldsLens.has(fieldId)) {
              fieldsLens.set(fieldId, new Map());
            }
            let fieldLens = fieldsLens.get(fieldId);
            fieldLens.set(docId, (fieldLens.get(docId) || 0) + termCount);

            let docFieldTermCount = terms.get(term);
            if (!docFieldTermCount) {
              docFieldTermCount = new Map();
            }
            let fieldsFreq = docFieldTermCount.get(docId);
            if (!fieldsFreq) {
              fieldsFreq = new Map();
              docFieldTermCount.set(docId, fieldsFreq);
            }
            fieldsFreq.set(fieldId, termCount);

            terms.set(term, docFieldTermCount);
          }
        } else {
          walkRawIndex(term + ch, index[ch]);
        }
      }
    };

    let fieldsLens = new Map();
    let terms = new Map();
    let termsWeights = new Map();
    let termFieldCount = new Map();
    walkRawIndex("", index);

    for (let [term, docFieldsCount] of terms.entries()) {
      let termWeights = [];
      let fieldTermCount = termFieldCount.get(term);

      for (let [docId, fieldsCount] of docFieldsCount.entries()) {
        for (let fieldId of fieldsCount.keys()) {
          let idf = Math.log(
            this._fields.get(fieldId)!.count / fieldTermCount.get(fieldId)
          );
          let weight =
            idf *
            (fieldsCount.get(fieldId) /
              (1 + fieldsLens.get(fieldId).get(docId)));
          if (fieldBoost[fieldId]) {
            weight *= fieldBoost[fieldId];
          }
          fieldsCount.set(fieldId, weight);
          termWeights.push(weight);
        }
      }

      termWeights.sort();
      termsWeights.set(term, termWeights[termWeights.length - 1]);
    }

    let trie = Object.create(null);
    for (let term of terms.keys()) {
      let last = trie;
      for (let ch of term) {
        if (!last[ch]) {
          last[ch] = Object.create(null);
        }
        last = last[ch];
      }
    }

    let augmentTrie = (prefix: string, trie: any): any => {
      let children = Object.keys(trie);

      if (children.length) {
        let weights = [];
        for (let ch of children) {
          let w = augmentTrie(prefix + ch, trie[ch]);
          weights.push(w);
        }
        if (termsWeights.get(prefix)) {
          weights.push([prefix, termsWeights.get(prefix)]);
        }
        weights.sort((a, b) => b[1] - a[1]);
        trie[" "] = weights[0];
        return weights[0];
      } else {
        return [prefix, termsWeights.get(prefix)];
      }
    };
    augmentTrie("", trie);

    return [terms, trie];
  }

  static fromJSON(indexId: string, json: any, boost: any = null) {
    let {fields: rawFields, documents: rawDocuments, index} = json;

    let fields = new Map();
    for (let f of rawFields) {
      fields.set(f.id, f);
    }

    let documents = new Map();
    for (let i = 0; i < rawDocuments.length; i++) {
      let rawDoc = rawDocuments[i];
      let doc = Object.create(null);

      doc._boost = rawDoc.pop();

      for (let fi = 0; fi < rawDoc.length; fi++) {
        let val = rawDoc[fi];
        let field = fields.get(fi);
        if (field.type == "enum") {
          val = field.enum[val];
        }

        doc[field.name] = val;
      }

      documents.set(i, doc);
    }

    return new this(indexId, fields, documents, index, boost);
  }
}
