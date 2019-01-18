import _ from 'lodash';
import { PrefixSearch } from './prefix-search';
import React, { Component } from 'react';
import Autocomplete from 'antd/lib/auto-complete';

const Option = Autocomplete.Option;

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

    onSelect = (v, o) => {
        if (this.props.onSelect) {
            this.props.onSelect([o.props.id]);
        }
    }

    handleSearch = (searchString) => {
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
        const children = _.map(matchingNodes, m => {
            const primaryTerm = nntree.getName(m.id);
            const matchingTerm = m.term;

            const printTerm = primaryTerm === matchingTerm ?
                primaryTerm : `${matchingTerm} [${primaryTerm}]`;
            return <Option value={m.primaryTerm} id={m.id} key={m}>{printTerm}</Option>;
        })
        return (
            <span className={this.props.className}>
                <Autocomplete
                    showSearch
                    allowClear
                    value={searchString}
                    optionLabelProp="value"
                    onSelect={this.onSelect}
                    onSearch={this.handleSearch}
                    placeholder={this.props.placeholder}

                >
                    {children}
                </Autocomplete>

            </span>
        );
    }
}