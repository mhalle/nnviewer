import React, { Component } from 'react';
import { NNSearchView } from './nnsearch';
import { NNTreeView } from './nntree';
import SplitPane from 'react-split-pane';
import createHistory from 'history/createBrowserHistory';
import queryString from 'query-string';
import _ from 'lodash';

import './App.css';



const App = class extends Component {
  constructor(props) {
    super();
    this.history = createHistory();
    this.unlisten = this.history.listen((location, action) => {
      this.handleHistory(location, action);
    });

    this.state = {
      searchString: '',
      selectedIds: [],
      expandedIds: [props.nntree.rootId],
    };
  }

  componentDidMount() {
    this.handleHistory(this.history.location, 'X-INIT');
  }

  componentWillUnmount() {
    if (this.state.unlisten) {
      this.state.unlisten();
    }
  }

  handleHistory = (location, action) => {
    if (action === 'POP' || action === 'X-INIT') {
      let selectedIds = [];
      let expandedIds = [this.props.nntree.rootId];
      let searchString = '';

      const query = queryString.parse(location.search);
      if (query.id && this.props.nntree.isValidId(query.id)) {
        selectedIds = [query.id];
      }

      if (selectedIds.length === 1) {
        expandedIds = this.props.nntree.getAncestorIds(selectedIds[0]);

      }
      this.setState({
        selectedIds,
        expandedIds,
        searchString
      });
    }
  }

  pushHistory = (id) => {
    let uri = '/';
    let q = [];

    if (id) {
      q = [`id=${id}`];
    }
    if (q.length) {
      uri = '/?' + q.join('&');
    }

    this.history.push(uri);
  }

  onSearchSelect = (selectedIds) => {
    if (selectedIds.length === 1) {
      const expandedIds = this.props.nntree.getAncestorIds(selectedIds[0]);
      this.setState({
        selectedIds,
        expandedIds,
        searchString: ''
      });
      this.pushHistory(selectedIds[0]);
    }
  }

  setExpandedIds = (expandedIds) => {
    this.setState({ expandedIds });
  }

  setSelectedIds = (selectedIds) => {
    this.setState({ selectedIds });
  }

  setSearchString = (searchString) => {
    this.setState({ searchString });
  }

  onSelect = (selectedIds, info) => {
    if (selectedIds.length === 1) {
      this.setState({ searchString: ''});
      this.pushHistory(selectedIds[0]);
    }
    this.setState({ selectedIds });
  }

  onSearch = (selectedIds, searchString) => {
    this.setState({
      searchString
    });
  }

  render() {
    return (
      <div className="nnviewer">
            <SplitPane split="horizontal" minSize={60} maxSize={60}>
        <header>
          <div>
            <h1>NeuroNames term viewer</h1>
          </div>
          <NNSearchView className="nnsearch"
            nnsearch={this.props.nnsearch}
            nntree={this.props.nntree}
            onSearch={this.onSearch}
            onSelect={this.onSearchSelect}
            searchString={this.state.searchString}
            placeholder="search"
          />
        </header>
        <div>
        <SplitPane split="vertical" minSize={100} defaultSize={450}>
          <div style={{ marginTop: "10px", width: "100%", height: "100%", overflow: "auto" }}>

            <NNTreeView
              className="nntree"
              nntree={this.props.nntree}
              onSelect={this.onSelect}
              onExpand={this.setExpandedIds}
              expandedIds={this.state.expandedIds}
              selectedIds={this.state.selectedIds}
            />


          </div>
          <div style={{ height: "100%", overflow: "auto" }}>
            <NNDetailView
              className="nndetail"
              selectedIds={this.state.selectedIds}
              nntree={this.props.nntree}
              onSelect={this.onSelect}
            />
          </div>
        </SplitPane>
        </div>
        </SplitPane>
      </div>
    );
  }
}

function NNDetailView(props) {
  const { className, selectedIds, nntree } = props;

  if (selectedIds.length !== 1) {
    return null;
  }

  const info = nntree.lookup(selectedIds[0]);

  return ( 
    <div className={className}>
      <h2>{info.name}</h2>

      <div style={{height: "100%"}}>
        <table>
          <tbody key="mm">
            {[
              DetailField(info, 'Acronym', 'acronym'),
              DetailField(info, 'NeuroNames ID', 'id'),
              SynonymField(info),
              DetailFieldURL(info, 'BrainInfo URL', 'brainInfoURL', '_blank'),
              DetailField(info, 'Structure type', 'brainStructureType'),
              DetailFieldSpan(info, 'Definition', getDefinition),
            ]}
          </tbody>
        </table>
      </div>
    </div>
    
  );
}

function initialLower(s) {
  if (!s || s.length === 0) {
    return s;
  }
  return s[0].toLowerCase() + s.slice(1);
}

function SynonymField(info) {
  const syns = info['synonyms'];
  let byLang = {};
  for (const s of syns) {
    const lang = s.lang;

    if (!_.hasIn(byLang, lang)){
      byLang[lang] = [initialLower(s.synonym)];
    }
    else {
      byLang[lang].push(initialLower(s.synonym));
    }
  }

  byLang = _.mapValues(byLang, x => _.uniq(x));

  let toRender = [];
  toRender.push(<tr><th colSpan="2">Synonyms</th></tr>);
  console.log(byLang);
  for (const llang of ['English', 'Latin', 'Mixed']) {
    const synMarkup = byLang[llang] ? byLang[llang].map(x => <div>{x}</div>) : null;
    if (synMarkup) {
      toRender.push(<tr><th className="nndetail-indent">{llang}</th><td>{synMarkup}</td></tr>);
    }
  }
  return toRender;
}

function DetailField(info, header, field) {
  const val = typeof field === 'function' ? field(info) : info[field];
  if (!val) {
    return null;
  }
  return (<tr key={header}>
    <th>{header}</th><td>{val}</td></tr>
  );
}

function DetailFieldSpan(info, header, field) {
  const val = typeof field === 'function' ? field(info) : info[field];
  if (!val) {
    return null;
  }
  return ([<tr key={header}>
    <th colSpan={2}>{header}</th></tr>,
  <tr key={header + "2"}><td className="nndetail-indent" colSpan={2}>{val}</td></tr>
  ]);
}

function DetailFieldURL(info, header, field, target) {
  const val = typeof field === 'function' ? field(info) : info[field];
  if (!val) {
    return null;
  }

  return (<tr key={header}>
    <th>{header}</th>
    <td><a href={val} target={target}>{val}</a></td>
  </tr>);
}

function getDefinition(info) {
  const cDef = info.definition;
  const name = info.name;

  if (!cDef || cDef === 'N/A') {
    return null;
  }
  const capName = name[0].toUpperCase() + name.slice(1);
  return <span className="definition" key="def"><span key="name" className="structure-name">{capName}</span>&nbsp;<span key="rest">{cDef}</span></span>;
}

export default App;
