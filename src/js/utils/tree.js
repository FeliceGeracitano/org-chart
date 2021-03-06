// TODO: refactor this frankenstein, maybe move to new version of d3
import d3 from 'd3';
import UtilsData from './data';
var duration = 300;
var i = 0;

const visit = (parent, visitFn, childrenFn) => {
  if (!parent) return;
  visitFn(parent);
  var children = childrenFn(parent);
  if (!children) return;
  var count = children.length;
  for (var i = 0; i < count; i++) visit(children[i], visitFn, childrenFn);
};

const collapse = node => {
  if (!(node.children || node._children)) return;
  node._children = node.children || node._children;
  node.children = null;
  node._children.forEach(collapse);
};
const expand = node => {
  if (!(node.children || node._children)) return;
  node.children = node.children || node._children;
  node._children = null;
  node.children.forEach(expand);
};
const expandParents = node => {
  const parent = node.parent;
  if (!parent) return;
  parent.children = parent._children;
  expandParents(parent);
};

function centerNode(source) {
  let { viewerWidth, viewerHeight, zoomListener } = UtilsData.getDrawParameters();
  const scale = zoomListener.scale();
  let x = -source.y0;
  let y = -source.x0;
  x = x * scale + viewerWidth / 2;
  y = y * scale + viewerHeight / 2;
  d3.select('g')
    .transition()
    .duration(duration)
    .attr('transform', 'translate(' + x + ',' + y + ')scale(' + scale + ')');
  zoomListener.scale(scale);
  zoomListener.translate([x, y]);
}

const toggleChildren = node => {
  if (node.children) {
    node._children = node.children;
    node.children = null;
  } else if (node._children) {
    node.children = node._children;
    node._children = null;
  }
  return node;
};

function click(node, root, tree, viewerWidth, viewerHeight, maxLabelLength, svgGroup, zoomListener, teamsColorMap) {
  if (d3.event.defaultPrevented) return;
  if (node._children || node.children) {
    node = toggleChildren(node);
    update(node, root, tree, viewerWidth, viewerHeight, maxLabelLength, svgGroup, zoomListener, teamsColorMap);
  }
  centerNode(node);
}
function update(source) {
  let {
    root,
    tree,
    viewerWidth,
    viewerHeight,
    maxLabelLength,
    svgGroup,
    zoomListener,
    teamsColorMap
  } = UtilsData.getDrawParameters();
  const diagonal = d3.svg.diagonal().projection(d => [d.y, d.x]);

  // Compute the new height, function counts total children of root node and sets tree height accordingly.
  // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
  // This makes the layout more consistent.
  var levelWidth = [1];
  var childCount = function(level, n) {
    if (n.children && n.children.length > 0) {
      if (levelWidth.length <= level + 1) levelWidth.push(0);

      levelWidth[level + 1] += n.children.length;
      n.children.forEach(function(d) {
        childCount(level + 1, d);
      });
    }
  };
  childCount(0, root);
  var newHeight = d3.max(levelWidth) * 35; // 25 pixels per line
  tree = tree.size([newHeight, viewerWidth]);

  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse(),
    links = tree.links(nodes);

  // Set widths between levels based on maxLabelLength.
  nodes.forEach(function(d) {
    d.y = d.depth * (maxLabelLength * 10); //maxLabelLength * 10px
    // alternatively to keep a fixed scale one can set a fixed depth per level
    // Normalize for fixed-depth by commenting out below line
    // d.y = (d.depth * 500); //500px per level.
  });

  // Update the nodes…
  const node = svgGroup.selectAll('g.node').data(nodes, function(d) {
    return d.id || (d.id = ++i);
  });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', () => 'translate(' + source.y0 + ',' + source.x0 + ')')
    .on('click', d => {
      click(d, root, tree, viewerWidth, viewerHeight, maxLabelLength, svgGroup, zoomListener, teamsColorMap);
    });

  nodeEnter
    .append('circle')
    .attr('class', 'nodeCircle')
    .attr('r', 0)
    .style('fill', function(d) {
      const color = teamsColorMap.get(d.team || '');
      return color; //return d._children ? 'lightsteelblue' : '#fff';
    });

  nodeEnter
    .append('text')
    .attr('x', function(d) {
      return d.children || d._children ? -20 : 20;
    })
    .attr('dy', '.35em')
    .attr('class', 'nodeText')
    .attr('text-anchor', function(d) {
      return d.children || d._children ? 'end' : 'start';
    })
    .text(function(d) {
      // return d.name + d['Team (team)'];
      return 'felice';
    })
    .style('fill-opacity', 0);

  // Update the text to reflect whether node has children or not.
  node
    .select('text')
    .attr('x', function(d) {
      return d.children || d._children ? -20 : 20;
    })
    .attr('text-anchor', function(d) {
      return d.children || d._children ? 'end' : 'start';
    })
    .text(function(d) {
      return d['Team (team)'] ? `${d.name} (${d['Team (team)']})` : d.name;
    });

  // Change the circle fill depending on whether it has children and is collapsed
  node
    .select('circle.nodeCircle')
    .attr('r', 10)
    .style('fill', function(d) {
      const color = teamsColorMap.get(d['Team (team)'] || '');
      return color;
      return d._children ? 'lightsteelblue' : '#fff';
    });

  // Transition nodes to their new position.
  var nodeUpdate = node
    .transition()
    .duration(duration)
    .attr('transform', function(d) {
      return 'translate(' + d.y + ',' + d.x + ')';
    });

  // Fade the text in
  nodeUpdate.select('text').style('fill-opacity', 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node
    .exit()
    .transition()
    .duration(duration)
    .attr('transform', function(d) {
      return 'translate(' + source.y + ',' + source.x + ')';
    })
    .remove();

  nodeExit.select('circle').attr('r', 0);

  nodeExit.select('text').style('fill-opacity', 0);

  // Update the links…
  var link = svgGroup.selectAll('path.link').data(links, d => d.target.id);

  // Enter any new links at the parent's previous position.
  link
    .enter()
    .insert('path', 'g')
    .attr('class', 'link')
    .attr('d', function(d) {
      var o = {
        x: source.x0,
        y: source.y0
      };
      return diagonal({
        source: o,
        target: o
      });
    });

  // Transition links to their new position.
  link
    .transition()
    .duration(duration)
    .attr('d', diagonal);

  // Transition exiting nodes to the parent's new position.
  link
    .exit()
    .transition()
    .duration(duration)
    .attr('d', function(d) {
      var o = {
        x: source.x,
        y: source.y
      };
      return diagonal({
        source: o,
        target: o
      });
    })
    .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

const sortByTeamsTree = d3Tree =>
  d3Tree.sort((a, b) => (b['Team (team)'].toLowerCase() < a['Team (team)'].toLowerCase() ? 1 : -1));

const drawGraph = ({ root, tree }) => {
  sortByTeamsTree(tree);
  update(root);
  centerNode(root);
};

function registerUserActions({ root }) {
  document.querySelector('#collapse-button').addEventListener('click', () => {
    collapse(root);
    update(root);
    centerNode(root);
  });
  document.querySelector('#expande-button').addEventListener('click', () => {
    expand(root);
    update(root);
    centerNode(root);
  });
}

export default {
  sortByNamesTree: d3Tree => d3Tree.sort((a, b) => (b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1)),
  sortByTeamsTree: d3Tree =>
    d3Tree.sort((a, b) => (b['Team (team)'].toLowerCase() < a['Team (team)'].toLowerCase() ? 1 : -1)),
  fromCSVUrlToJSON: async url => {
    const resp = await fetch(url);
    const CSVString = await resp.text();
    return await csvtojson().fromString(CSVString);
  },
  fromCSVStringToJSON: async string => {
    return await csvtojson().fromString(string);
  },
  fromFlatMemebersToTree: oldlist => {
    const list = oldlist.slice().map(el => ({ ...el, name: el['Name (id)'] }));
    var map = {},
      node,
      roots = [],
      i;
    for (i = 0; i < list.length; i += 1) {
      map[list[i].name] = i;
      list[i].children = [];
    }
    for (i = 0; i < list.length; i += 1) {
      node = list[i];
      if (node['Manager (member)'] !== '') {
        list[map[node['Manager (member)']]].children.push(node);
      } else {
        roots.push(node);
      }
    }
    return {
      name: 'HBC Tech',
      children: roots.filter(el => el.children.length)
    };
  },
  toggleChildren: node => {
    if (node.children) {
      node._children = node.children;
      node.children = null;
    } else if (node._children) {
      node.children = node._children;
      node._children = null;
    }
    return node;
  },
  centerNode,
  collapse,
  drawGraph,
  expand,
  expandParents,
  registerUserActions,
  update,
  visit
};
