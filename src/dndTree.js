import flareJson from './flare.json';
import Utils from './utils';
import membersurl from '../mock/members.csv';

// TODO get JSON async

const getData = () => Promise.resolve(flareJson);

const drawGraph = treeData => {
  var root;

  const viewerWidth = document.documentElement.clientWidth;
  const viewerHeight = document.documentElement.clientHeight;

  let tree = d3.layout.tree().size([viewerHeight, viewerWidth]);

  // define a d3 diagonal projection for use by the node paths later on.
  const diagonal = d3.svg.diagonal().projection(d => [d.y, d.x]);

  // A recursive helper function for performing some setup by walking through all nodes

  // Call visit function to establish maxLabelLength
  const maxLabelLength = Utils.getMaxLabelLength(treeData);

  // Sort the tree initially incase the JSON isn't in a sorted order.
  Utils.sortByNamesTree(tree);

  // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
  var zoomListener = d3.behavior
    .zoom()
    .scaleExtent([0.5, 3])
    .on('zoom', () => svgGroup.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')'));

  // define the baseSvg, attaching a class for styling and the zoomListener
  var baseSvg = d3
    .select('#tree-container')
    .append('svg')
    .attr('width', viewerWidth)
    .attr('height', viewerHeight)
    .attr('class', 'overlay')
    .call(zoomListener);

  // Append a group which holds all nodes and which the zoom Listener can act upon.
  var svgGroup = baseSvg.append('g');

  // Define the root
  root = treeData;
  root.x0 = viewerHeight / 2;
  root.y0 = 0;
  window.root = root;
  Utils.update(root, root, tree, viewerWidth, viewerHeight, maxLabelLength, svgGroup, zoomListener);
  Utils.centerNode(root, zoomListener, viewerWidth, viewerHeight);

  window.collapseAll = () => {
    Utils.collapse(root);
    Utils.update(root, root, tree, viewerWidth, viewerHeight, maxLabelLength, svgGroup, zoomListener);
    Utils.centerNode(root, zoomListener, viewerWidth, viewerHeight);
  };
  window.expandAll = () => {
    Utils.expand(root);
    Utils.update(root, root, tree, viewerWidth, viewerHeight, maxLabelLength, svgGroup, zoomListener);
    Utils.centerNode(root, zoomListener, viewerWidth, viewerHeight);
  };
};

const init = async () => {
  // - fetch json structure
  const data = await getData(flareJson);
  const membersFlatList = await Utils.fromCSVUrlToJSON(membersurl);
  const membersTree = Utils.fromFlatMemebersToTree(membersFlatList);

  console.log(membersTree);
  // New structure
  drawGraph(membersTree);
  //

  window.membersTree = membersTree;
};

init();
