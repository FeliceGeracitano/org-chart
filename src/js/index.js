import 'bulma/css/bulma.min.css';
import 'select2/dist/css/select2.min.css';
import membersurl from '../../mock/members.csv';
import '../css/d3.css';
import '../css/index.css';
import typeahead from './typeahead';
import UtilsData from './utils/data';
import UtilsTree from './utils/tree';

const init = async () => {
  const membersTree = await UtilsData.fetchMembers(
    process.env.GITHUB_OWNER,
    process.env.GITHUB_REPO,
    process.env.GITHUB_FILE_PATH,
    process.env.GITHUB_TOKEN,
    membersurl,
    process.env.ROOT_LABEL
  );
  UtilsData.setDrawParameters(membersTree, '.tree-container');
  UtilsTree.drawGraph(UtilsData.getDrawParameters());
  UtilsTree.registerUserActions(UtilsData.getDrawParameters());
  typeahead.initMemberSelector('#select-input-member', UtilsData.getDrawParameters());
  typeahead.initTeamSelector('#select-input-team', UtilsData.getDrawParameters());
};

init();
