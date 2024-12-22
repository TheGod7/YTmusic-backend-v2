import { CLIENT_ID, CLIENT_SECRET } from "../config.js";
import { OAuth2Client } from "google-auth-library";
const redirectUri = "http://localhost:3000/api/auth/login";

export class GoogleAuth {
  private auth = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, redirectUri);

  GenerateLoginURL() {
    const authorizationUrl = this.auth.generateAuthUrl({
      access_type: "offline",
      scope: [
        "http://gdata.youtube.com",
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/youtube.force-ssl",
        "https://www.googleapis.com/auth/youtube-paid-content",
      ],
      include_granted_scopes: true,
      prompt: "consent",
    });

    return authorizationUrl;
  }

  async GetAccessToken(code: string) {
    const { tokens } = await this.auth.getToken(code);
    return tokens;
  }
}
