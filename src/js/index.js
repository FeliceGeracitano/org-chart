import github from '@octokit/rest';
import 'bulma/css/bulma.min.css';
import 'select2/dist/css/select2.min.css';
import membersurl from '../../mock/members.csv';
import '../css/d3.css';
import '../css/index.css';
import Store from './store';
import typeahead from './typeahead';
import Utils from './utils';
const octokit = new github();

const init = async () => {
  let membersFlatList;
  // try from Github or fallback to mock file
  try {
    await octokit.authenticate({ type: 'token', token: process.env.GITHUB_TOKEN });
    const {
      data: { content },
    } = await octokit.repos.getContents({
      owner: 'saksdirect',
      repo: 'org-structure',
      path: 'members.csv',
    });
    const csvString = atob(content);
    membersFlatList = await Utils.fromCSVStringToJSON(csvString);
  } catch {
    membersFlatList = await Utils.fromCSVUrlToJSON(membersurl);
  }
  const membersTree = Utils.fromFlatMemebersToTree(membersFlatList);
  Store.drawParameters = Utils.getDrawParams(membersTree);
  Utils.drawGraph(Store.drawParameters);
  Utils.registerUserActions(Store.drawParameters);
  typeahead.init('.select-input', Store.drawParameters.root);
};

init();
