import github from '@octokit/rest';
import csvtojson from 'csvtojson';
import Store from './store';
import UtilsTree from './tree';
import d3 from 'd3';
const octokit = new github();

const fromCSVUrlToJSON = async url => {
  const resp = await fetch(url);
  const CSVString = await resp.text();
  return await csvtojson().fromString(CSVString);
};
const fromCSVStringToJSON = async string => await csvtojson().fromString(string);
const fromFlatMemebersToTree = (list, rootLabel) => {
  const map = {},
    roots = [];
  let node, i;
  for (i = 0; i < list.length; i += 1) {
    map[list[i].name] = i;
    list[i].children = [];
  }
  for (i = 0; i < list.length; i += 1) {
    node = list[i];
    if (node.parent !== '') {
      list[map[node.parent]].children.push(node);
    } else {
      roots.push(node);
    }
  }
  return {
    name: rootLabel,
    children: roots.filter(el => el.children.length)
  };
};
const cleanObjectKeys = list =>
  list.slice().map(el => ({
    ...el,
    name: el['Name (id)'],
    parent: el['Manager (member)'],
    team: el['Team (team)']
  }));
const fetchMembers = async (owner, repo, path, token, fallbackUrl, rootLabel = 'root') => {
  let membersFlatList;
  try {
    await octokit.authenticate({ type: 'token', token });
    const {
      data: { content }
    } = await octokit.repos.getContents({
      owner,
      repo,
      path
    });
    const csvString = atob(content);
    membersFlatList = await fromCSVStringToJSON(csvString);
  } catch {
    membersFlatList = await fromCSVUrlToJSON(fallbackUrl);
  }
  return fromFlatMemebersToTree(cleanObjectKeys(membersFlatList), rootLabel);
};
function fromStringToColor(str = '') {
  if (!str) return 'FFFFFF';
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  var c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '00000'.substring(0, 6 - c.length) + c;
}
const getDrawParameters = () => Store.drawParameters;
const getMaxLabelLength = treeData => {
  let maxLabelLength = 0;
  UtilsTree.visit(
    treeData,
    node => (maxLabelLength = Math.max(node.name.length, maxLabelLength)),
    node => (node.children && node.children.length > 0 ? node.children : null)
  );
  return maxLabelLength;
};
const getTeamsColorMap = tree => {
  const teams = new Map();
  UtilsTree.visit(tree, node => teams.set(node.team || '', fromStringToColor(node.team)), node => node.children);
  return teams;
};
const setDrawParameters = (treeData, selector) => {
  const root = treeData;
  const teamsColorMap = getTeamsColorMap(treeData);
  const dimensions = document.querySelector(selector).getBoundingClientRect();
  const viewerWidth = dimensions.width;
  const viewerHeight = dimensions.height;
  let tree = d3.layout.tree().size([viewerHeight, viewerWidth]);
  const maxLabelLength = getMaxLabelLength(treeData);
  root.x0 = viewerHeight / 2;
  root.y0 = 0;
  const zoomListener = d3.behavior
    .zoom()
    .scaleExtent([0.5, 3])
    .on('zoom', () => {
      svgGroup.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
    });
  const baseSvg = d3
    .select(selector)
    .append('svg')
    .attr('width', viewerWidth)
    .attr('height', viewerHeight)
    .attr('class', 'overlay touch')
    .call(zoomListener);
  baseSvg
    .on('touchstart.zoom', null)
    .on('touchmove.zoom', null)
    .on('dblclick.zoom', null)
    .on('touchend.zoom', null);
  const svgGroup = baseSvg.append('g');
  Store.drawParameters = {
    root,
    tree,
    viewerWidth,
    viewerHeight,
    maxLabelLength,
    svgGroup,
    zoomListener,
    teamsColorMap
  };
};
const getTeams = tree => {
  const teams = new Set();
  UtilsTree.visit(tree, node => node.team && teams.add(node.team), node => node.children);
  return Array.from(teams);
};
export default {
  getTeams,
  fetchMembers,
  setDrawParameters,
  getDrawParameters
};
