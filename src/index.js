import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

import NeuroNames from './mh-neuronames.json';
// import nnpatches from './nnpatches.json';
import { NNSearch} from './nnsearch';
import { NNTree } from './nntree';

import * as serviceWorker from './serviceWorker';

const nntree = new NNTree(NeuroNames);
const nnsearch = new NNSearch(nntree);

ReactDOM.render(<App 
                    className="nnviewer"
                    nntree={nntree}
                    nnsearch={nnsearch}
                />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
