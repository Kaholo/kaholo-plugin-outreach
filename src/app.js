const { getUsers } = require('./autocomplete');
const OutreachService = require("./services/outreach.service");

async function addProspect(action, settings) {
  
  const outreachService = OutreachService.fromSettings(settings);
  let owner;
  if (action.params.owner){
      const parsed = parseInt(action.params.owner);
      if (parsed !== NaN) owner = parsed;
  }

  const prospect = {
    type: "prospect",
    attributes: {
      emails: [action.params.email],
      company: action.params.company,
      lastName: action.params.lastName,
      firstName: action.params.firstName,
      workPhones: [action.params.workPhone],
      custom1: action.params.custom1,
    },
    relationships: {},
  };

  if (owner !== undefined) {
    prospect.relationships.owner = {
      data: {
        type: "user",
        id: owner,
      },
    };
  }

  const result = await outreachService.addProspect(prospect);
  return result;
}

module.exports = {
  addProspect,
  getUsers,
};
