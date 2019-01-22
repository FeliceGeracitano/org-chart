import $ from 'jquery';
import select2 from 'select2';
import UtilsTree from './utils/tree';
import UtilsData from './utils/data';
select2($);

export default {
  initMemberSelector(selector, { root }) {
    const treeList = [];
    UtilsTree.visit(root, d => treeList.push(d), d => d._children || d.children);
    const html = treeList.map(item => `<option value="${item.name}">${item.name}</option>`).join('');
    document.querySelector(selector).innerHTML = html;
    $(selector).select2();
    $(selector).on('select2:select', function(e) {
      let node;
      UtilsTree.collapse(root);
      UtilsTree.visit(root, d => (d.name === e.params.data.id ? (node = d) : (node = node)), d => d._children);
      UtilsTree.expandParents(node);
      UtilsTree.update(root);
      UtilsTree.centerNode(node);
    });
  },
  initTeamSelector(selector, { root }) {
    const teams = ['___________', ...UtilsData.getTeams(root)];
    const html = teams.map(team => `<option value="${team}">${team}</option>`).join('');
    document.querySelector(selector).innerHTML = html;
    $(selector).select2();
    $(selector).on('select2:select', function(e) {
      const team = e.params.data.id;
      UtilsTree.collapse(root);
      let firstMember;
      UtilsTree.visit(root, d => (!firstMember && d.team === team ? (firstMember = d) : undefined), d => d._children);
      UtilsTree.expandParents(firstMember);
      firstMember.children = firstMember._children;
      UtilsTree.update(root);
      UtilsTree.centerNode(firstMember);
    });
  },
  showControls() {
    const hidden = document.querySelector('.toolbar.hidden');
    const showed = document.querySelector('.toolbar:not(.hidden)');
    hidden.classList.remove('hidden');
    showed.classList.add('hidden');
  }
};
