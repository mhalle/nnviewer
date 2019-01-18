import _ from 'lodash';
import React, { Component } from 'react';
import Tree from 'antd/lib/tree';
const TreeNode = Tree.TreeNode;

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


export class NNTreeOld {
    constructor(elems, patches) {
        this.index = {};
        this.rootId = "21";

        for (const e of elems) {
            if(e.cNIDType === 'h') {
            this.index[this.getId(e)] = e;
            }
        }
        if (patches) {
            for (const i of _.keys(patches)) {
                this.index[i] = _.assign(this.index[i], patches[i]);
            }
        }
        
        // add "children" attribute with list of child ids
        for (const id of _.keys(this.index)) {
            const parentId = this.getParentId(id);
            if (typeof parentId !== "undefined" && parentId !== '') {
                if (!_.has(this.index, parentId)) {
                    continue;
                }
                const parent = this.index[parentId];
                if ((parent.cNIDType !== this.index[id].cNIDType) && 
                    parent.cNIDType === 'a') {
                    console.log(parent.standardName, "(", parentId, ") / ",
                        this.getName(id), "(", id, ")");
                }
                if (_.has(parent, 'children')) {
                    parent.children.push(id);
                }
                else {
                    parent.children = [id];
                }
            }
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
        return elem.brainInfoID;
    }

    isValidId(id) {
        return _.has(this.index, id);
    }

    lookup(id) {
        return this.index[id];
    }

    getParentId(id) {
        const pid = this.index[id].parentBrainInfoId;
        if(typeof pid === 'undefined' || pid === '') {
            return null;
        }
        return pid;
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
        return this.index[id].standardName;
    }
}

export const NNTreeView = class extends Component {
    onExpand = (expandedIds) => {
        if (this.props.onExpand) {
            this.props.onExpand(expandedIds);
        }
    }

    onSelect = (selectedIds) => {
        if (this.props.onSelect) {
            this.props.onSelect(selectedIds);
        }
    }

    render() {
        const { nntree } = this.props;

        return (
            <Tree 
                className={this.props.className}
                showLine
                onSelect={this.onSelect}
                expandedKeys={this.props.expandedIds}
                autoExpandParent={false}
                onExpand={this.onExpand}
                selectedKeys={this.props.selectedIds}              
            >
                {renderTreeNodesFromChildren(nntree, nntree.rootId)}
            </Tree>
        )
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