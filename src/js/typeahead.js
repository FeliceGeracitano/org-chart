import $ from 'jquery';
import select2 from 'select2';
import UtilsTree from './utils/tree';
select2($);

export default {
  init(
    selector,
    { root, tree, viewerWidth, viewerHeight, maxLabelLength, svgGroup, zoomListener, teamsColorMap }
  ) {
    const treeList = [];
    UtilsTree.visit(root, d => treeList.push(d), d => d._children || d.children);
    const html = treeList
      .map(item => `<option value="${item.name}">${item.name}</option>`)
      .join('');
    document.querySelector(selector).innerHTML = html;

    // Init Select 2
    $(selector).select2();

    // On Select Open Tree
    $(selector).on('select2:select', function(e) {
      let node;
      UtilsTree.collapse(root);
      UtilsTree.visit(
        root,
        d => (d.name === e.params.data.id ? (node = d) : (node = node)),
        d => d._children
      );
      UtilsTree.expandParents(node);
      UtilsTree.update(
        root,
        root,
        tree,
        viewerWidth,
        viewerHeight,
        maxLabelLength,
        svgGroup,
        zoomListener,
        teamsColorMap
      );
      UtilsTree.centerNode(node, zoomListener, viewerWidth, viewerHeight);
    });
  }
};
