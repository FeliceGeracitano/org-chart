import $ from 'jquery';
import select2 from 'select2';
import Utils from './utils';
import Store from './store';
select2($);

export default {
  init(selector, root) {
    const treeList = [];
    Utils.visit(root, d => treeList.push(d), d => d._children || d.children);
    const html = treeList
      .map(item => `<option value="${item.name}">${item.name}</option>`)
      .join('');
    document.querySelector(selector).innerHTML = html;

    // Init Select 2
    $('.select-input').select2();

    // On Select Open Tree
    $('.select-input').on('select2:select', function(e) {
      const {
        root,
        tree,
        viewerWidth,
        viewerHeight,
        maxLabelLength,
        svgGroup,
        zoomListener,
        teamsColorMap,
      } = Store.drawParameters;
      let node;
      Utils.collapse(root);
      Utils.visit(
        root,
        d => (d.name === e.params.data.id ? (node = d) : (node = node)),
        d => d._children
      );
      Utils.expandParents(node);
      Utils.update(
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
      Utils.centerNode(node, zoomListener, viewerWidth, viewerHeight);
    });
  },
};
