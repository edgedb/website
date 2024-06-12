import {stemmer} from "./_stemmer";
import {STOPS, SUPER_STOPS} from "./_stops";

export default function tokenize(
  str: string,
  clean_stops = true,
  isQuery = false
) {
  let toks = str.trim().split(/\s+/);
  let newToks = [];
  for (let [i, orig_tok] of toks.entries()) {
    let tok = orig_tok.toLowerCase();
    let lastTok = i == toks.length - 1 && isQuery;
    let containsAlphanum = /[a-z0-9]/.test(tok);
    if (!isQuery || containsAlphanum) {
      tok = tok
        .replace(/[,\.:\)!;'"\{\[]+$/u, "")
        .replace(/^[\('"\}\]]+/u, "");
    }

    let stop_list = STOPS;
    if (!clean_stops) {
      stop_list = SUPER_STOPS;
    }

    if (
      !tok ||
      /^\d/.test(tok) ||
      (!isQuery && !/^[a-z][\w\-]*$/.test(tok)) ||
      (stop_list.has(tok) && !lastTok)
    ) {
      continue;
    }

    let subToks = containsAlphanum ? tok.split(/_|-/g) : [tok];
    let stemmed;
    if (subToks.length > 1) {
      stemmed = [];
      for (let subTok of subToks) {
        let subTokStemmed = stemmer(subTok);
        stemmed.push(subTokStemmed);

        newToks.push({
          orig: subTok,
          stripped: subTok,
          stemmed: subTokStemmed,
        });
      }
      stemmed = stemmed.join("_");
    } else {
      stemmed = stemmer(tok);
    }

    newToks.push({
      orig: orig_tok,
      stripped: tok,
      stemmed,
    });
  }
  return newToks;
}
