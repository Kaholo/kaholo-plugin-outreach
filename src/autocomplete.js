const OutreachService = require("./services/outreach.service");

module.exports.getUsers = async function(query, pluginSettings) {
  const settings = {};
  pluginSettings.forEach(setting=>{
    settings[setting.name] = setting.value;
  });
  
  query = query.trim();
  const outreachService = OutreachService.fromSettings(settings);
  const usersData = await outreachService.getUsers();

  const users = usersData.data
    .filter((user) => {
      if (!query) return true;
      const fullName = `${user.attributes.firstName} ${user.attributes.lastName}`;
      return fullName.toLowerCase().includes(query.toLowerCase());
    })
    .map((user) => {
      return {
        id: user.id,
        value: `${user.attributes.firstName} ${user.attributes.lastName}`,
      };
    });
  return users;
}
