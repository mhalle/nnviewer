const TrieSearch = require('trie-search');

export class PrefixSearch {
    constructor() {
        this.index = new TrieSearch(['term'], {
            splitOnRegEx: /[-\s]/g,
            min: 2
        });
    }

    indexNode(id, primaryTerm, term, termType, lang) {
        const indexObj = {
            id,
            primaryTerm,
            term,
            termType,
            lang
        };
        this.index.add(indexObj);
    }

    getMatches(prefixString) {
        return this.index.get(prefixString);
    }
}

