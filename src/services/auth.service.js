const fetch = require("node-fetch");
const OUTREACT_SESSION_COOKIE = "_outreach_accounts_session";

class Auth {
  async extractAuthenticityToken(response) {
    const html = await response.text();
    const matches = html.match(/name="authenticity_token" value="([^"]+)"/);
    if (matches.length < 2) {
      throw "Could not find authenticity_token in login page";
    }

    return matches[1];
  }
  async throwHttpError(response, message) {
    throw {
      body: await response.text(),
      statusCode: response.status,
      messsage: message,
    };
  }

  async getOutreachKeys() {
    const response = await fetch("https://accounts.outreach.io/users/sign_in");
    if (!response.ok) {
      return this.throwHttpError(response, "Error fetching login page");
    }

    const authenticityToken = await this.extractAuthenticityToken(response);

    const outreachSessionCookies = response.headers
      .raw()
      ["set-cookie"].filter((header) =>
        header.startsWith(OUTREACT_SESSION_COOKIE)
      );
    if (!outreachSessionCookies.length) {
      throw `Cookie ${OUTREACT_SESSION_COOKIE} is missing`;
    }
    const outreachSessionKey = outreachSessionCookies[0]
      .split(";")[0]
      .split("=")[1];
    return {
      outreachSessionKey,
      authenticityToken,
    };
  }

  async firstLoginPhase(email) {
    const { outreachSessionKey, authenticityToken } = await this.getOutreachKeys();

    const params = new URLSearchParams();
    params.append("authenticity_token", authenticityToken);
    params.append("user[email]", email);

    const response = await fetch("https://accounts.outreach.io/users/next", {
      method: "POST",
      body: params,
      headers: {
        cookie: `${OUTREACT_SESSION_COOKIE}=${outreachSessionKey};`,
      },
    });

    if (!response.ok) {
      return this.throwHttpError(
        response,
        "Error during first login phase. Bad email?"
      );
    }

    const newAuthenticityToken = await this.extractAuthenticityToken(response);

    return { outreachSessionKey, authenticityToken: newAuthenticityToken };
  }

  async login(email, password) {
    const { outreachSessionKey, authenticityToken } = await this.firstLoginPhase(
      email
    );

    const params = new URLSearchParams();

    params.append("authenticity_token", authenticityToken);
    params.append("user[email]", email);
    params.append("user[password]", password);

    const response = await fetch("https://accounts.outreach.io/users/sign_in", {
      method: "POST",
      body: params,
      redirect: "manual",
      headers: {
        cookie: `${OUTREACT_SESSION_COOKIE}=${outreachSessionKey};`,
      },
    });

    if (response.status !== 302) {
      return this.throwHttpError(
        response,
        `Error during second login phase. Bad password ("${password}")?`
      );
    }

    const cookies = response.headers
      .raw()
      ["set-cookie"].map((cookie) => {
        return cookie.split(";")[0];
      })
      .join("; ");

    return { cookies };
  }

  async getCodeFromResponse(response) {
    const searchParams = new URL(response.headers.raw()["location"][0])
      .searchParams;
    if (!searchParams.has("code")) {
      return this.throwHttpError(response, "Missing 'code' search param");
    }
    const code = searchParams.get("code");

    return code;
  }

  async getCode(clientId, redirectUri, scope, loginCookies) {
    const params = {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scope,
    };

    const response = await fetch(
      `https://accounts.outreach.io/oauth/authorize?${new URLSearchParams(
        params
      )}`,
      {
        redirect: "manual",
        headers: {
          cookie: loginCookies,
        },
      }
    );

    if (response.status == 302) {
      return this.getCodeFromResponse(response);
    } else if (!response.ok) {
      return this.throwHttpError(response, "Error during autherize.");
    }

    params.authenticity_token = await this.extractAuthenticityToken(response);

    const postResponse = await fetch(
      "https://accounts.outreach.io/oauth/authorize",
      {
        method: "POST",
        body: new URLSearchParams(params),
        redirect: "manual",
        headers: {
          cookie: loginCookies,
        },
      }
    );

    if (postResponse.status !== 302) {
      return this.throwHttpError(postResponse, "Error during login.");
    }

    return this.getCodeFromResponse(postResponse);
  }

  async getToken({
    email,
    password,
    clientId,
    clientSecret,
    redirectUri,
    scope,
  }) {
    console.log(`email: ${email}, pass: ${password}, secret: ${clientSecret}`);
    const { cookies } = await this.login(email, password);
    const code = await this.getCode(clientId, redirectUri, scope, cookies);

    const tokenResponse = await fetch(
      "https://accounts.outreach.io/oauth/token",
      {
        method: "POST",
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          code,
        }),
      }
    );

    const token = await tokenResponse.json();
    return token;
  }
}

module.exports = new Auth();
