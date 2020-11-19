const fetch = require("node-fetch");
const authService = require("./auth.service");

class OutreachService {
  constructor(authOptions){
    this.authOptions = authOptions;
  }

  static fromSettings(settings){
    const authOptions = {
      email : settings.email,
      password : settings.password,
      clientId : settings.clientId,
      clientSecret : settings.clientSecret,
      redirectUri : settings.redirectUri,
      scope: undefined
    }

    return new OutreachService(authOptions);
  }

  async makeRequest(url, options) {
    const token = await authService.getToken(this.authOptions);

    options.headers = options.headers || {};
    options.headers.Authorization = `Bearer ${token.access_token}`;
    const response = await fetch(url, options);

    const body = await response.json();
    if (response.ok) {
      return body;
    } else {
      throw body;
    }
  }

  async addProspect(prospect) {
    this.authOptions.scope = "prospects.write";
    const url = `https://api.outreach.io/api/v2/prospects`;
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({data: prospect}),
    };

    return this.makeRequest(url,requestOptions);
  }

  async getUsers() {
    this.authOptions.scope = "users.read";
    const url = `https://api.outreach.io/api/v2/users`;
    const requestOptions = {};

    return this.makeRequest(url,requestOptions);
  }
}

module.exports = OutreachService;
