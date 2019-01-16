import csvtojson from "csvtojson";
import membersurl from "../mock/members.csv";

const loadCSV = async url => {
  const resp = await fetch(url);
  return await resp.text();
};

const init = async () => {
  try {
    const memebersCSVString = await loadCSV(membersurl);
    let membersJSON = await csvtojson().fromString(memebersCSVString);
    document.body.appendChild(
      document.createElement("pre")
    ).innerHTML = JSON.stringify(membersJSON, undefined, 4);

    console.log(membersJSON);
  } catch (error) {
    console.log(error);
  }
};

init();
