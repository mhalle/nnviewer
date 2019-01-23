import _ from 'lodash';
import React, { Component } from 'react';
import {Tree} from 'primereact/tree';

export class NNTree {
    constructor(nndata) {
        this.index = {};
        this.rootId = nndata.rootId;

        for (const e of nndata.concepts) {
            this.index[this.getId(e)] = e;
        }
    }

    getChildrenIds(id) {
        const elem = this.index[id];
        if (!_.has(elem, 'children')) {
            return null;
        }
        return elem.children;
    }

    getId(elem) {
        return elem['id'];
    }

    isValidId(id) {
        return _.has(this.index, id);
    }

    lookup(id) {
        return this.index[id];
    }

    getParentId(id) {
        return this.index[id].parentId;
    }

    getAncestorIds(id){
        const ancestors = [id];
        while(true) {
            const parentId = this.getParentId(id);
            if (parentId === null) {
                break;
            }
            ancestors.push(parentId);
            id = parentId;
        }
        return ancestors;
    }

    getName(id) {
        return this.index[id].name;
    }

    getSynonyms(id) {
        return this.index[id].synonyms;
    }
}

export const NNTreeView = class extends Component {

    onSelect = (ev) => {
        console.log(ev);
        const selectedIds = ev.node ? [ev.node.id] : [];
        if (this.props.onSelect) {
            this.props.onSelect(selectedIds);
        }
    }

    onToggle = (ev) => {
        this.props.onExpand(ev.value);
    }

    render() {
        const { nntree } = this.props;
        const treeData = new TreeNode(nntree, nntree.rootId);
        return (
            <Tree 
                className={this.props.className}
                selectionMode="single"
                onSelect={this.onSelect}
                expandedKeys={this.props.expandedIds}

                onToggle={this.onToggle}
                selectedKeys={this.props.selectedIds}   
                value={[treeData]}           
            >
            </Tree>
        )
    }
}


class TreeNode {
    constructor(nntree, id) {
        this.tree = nntree;
        this.id = id;
    }

    get key() {
        return this.id;
    }
    get label() {
        return this.tree.getName(this.id);
    }

    get children() {
        const node = this.tree.lookup(this.id);
        return node.children.map(c => new TreeNode(this.tree, c));
    }
    get data() {
        return this.tree.lookup(this.id);
    }
}

function renderTreeNodesFromChildren(nn, id) {
    const childrenIds = nn.getChildrenIds(id);

    let children = [];
    if (childrenIds) {
        // get children, look for those that have children and put them first.
        // get children without children next.
        // sort both lists, then concatenate them

        let childrenWithoutChildren = [];
        let childrenWithChildren = [];
        for (const c of childrenIds) {
            const ccids = nn.getChildrenIds(c);
            if (ccids.length > 0) {
                childrenWithChildren.push(c);
            }
            else {
                childrenWithoutChildren.push(c);
            }
            childrenWithChildren = _.sortBy(childrenWithChildren, o => nn.getName(o).toLowerCase());
            childrenWithoutChildren = _.sortBy(childrenWithoutChildren, o => nn.getName(o));
            children = _.concat(childrenWithChildren, childrenWithoutChildren);
        }
    }
    return (
        <TreeNode title={nn.getName(id)} key={id}>
            {children.map(c => renderTreeNodesFromChildren(nn, c))}
        </TreeNode>
    )
}