import _ from 'lodash';
import { PrefixSearch } from './prefix-search';
import React, { Component } from 'react';
import {AutoComplete} from 'primereact/autocomplete';


function promotePrimaryTerm(mnodes) {
    let matchingNodes = [];
    // group all matches that map to the same ID

    const grouped = _.groupBy(mnodes, n => n.id);

    for (const mv of _.values(grouped)) {
        const v = _.find(mv, i => i.termType === 'name');
        matchingNodes.push(v ? v : mv[0]);
    }
    return matchingNodes;
}

function promoteExactMatches(mnodes, searchString) {
    let exactMatchingNodes = [], otherMatchingNodes = [];
    const searchStringLower = searchString.toLowerCase();

    for (const n of mnodes) {
        if (n.term.startsWith(searchStringLower)) {
            exactMatchingNodes.push(n);
        }
        else {
            otherMatchingNodes.push(n);
        }
    }
    return exactMatchingNodes.concat(otherMatchingNodes);
}

export class NNSearch {
    constructor(nn) {
        this.search = new PrefixSearch(nn);
        for (const id of _.keys(nn.index)) {
            const elem = nn.lookup(id);
            const primaryTerm = nn.getName(id);
            this.search.indexNode(id, primaryTerm, primaryTerm, 'name', '');
            this.search.indexNode(id, primaryTerm, elem.acronym, 'acronym', '');
            let syn = nn.getSynonyms(id);
            for (const s of syn) {
                if (primaryTerm !== s.synonym) {
                    this.search.indexNode(id, primaryTerm, s.synonym, 'synonym', s.lang);
                }
            
            }
        }
    }

    match(searchString) {
        const matchingNodes = this.search.getMatches(searchString);
        const orderedMatching = promoteExactMatches(
            promotePrimaryTerm(matchingNodes),
            searchString);
        return orderedMatching;
    }
}


export class NNSearchView extends Component {
    state = {
        matchingNodes: [],
    }

    onSelect = (ev) => {
        const o = ev.value;
        if (this.props.onSelect) {
            this.props.onSelect([o.id]);
        }
    }

    handleSearch = (ev) => {
        const searchString = ev.query;
        const matchingNodes = this.props.nnsearch.match(searchString);
        this.setState({ matchingNodes });
        if (this.props.onSearch) {
            const ids = [];
            for (let i = 0; i < matchingNodes.length; i++) {
                ids.push(matchingNodes[i].id);
            }
            this.props.onSearch(ids, searchString);
        }
    }

    render() {
        const { nntree, searchString } = this.props;
        const { matchingNodes } = this.state;
        for (const m of matchingNodes) {
            const primaryTerm = nntree.getName(m.id);
            const matchingTerm = m.term;
            const labelTerm = primaryTerm === matchingTerm ? 
                        primaryTerm : `${matchingTerm} [${primaryTerm}]`;
            m.label = labelTerm;
        }
        
        return (
            <span className={this.props.className}>
                <AutoComplete
                    field="label"
                    suggestions={matchingNodes}
                    value={searchString}
                    onSelect={this.onSelect}
                    completeMethod={this.handleSearch}
                    placeholder={this.props.placeholder}

                >
                </AutoComplete>

            </span>
        );
    }
}