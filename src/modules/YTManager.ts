import { ProtoUtils, Utils } from "youtubei.js";
import UserModel from "../schema/user.schema.js";
import { GoogleAuth } from "./GoogleAuth.js";
import { BG } from "bgutils-js";
import { JSDOM } from "jsdom";
import YTModule from "./YTModule.js";
import { uid } from "uid";
import { CLIENT_ID, CLIENT_SECRET } from "../config.js";

class YTManager {
  readonly auth = new GoogleAuth();
  private userDB = UserModel;
  private AccountsMap = new Map<string, YTModule>();
  private GuestAccountsMap = new Map<string, YTModule>();

  async SetUser(code: string) {
    const tokens = await this.auth.GetAccessToken(code);

    if (
      tokens &&
      !tokens.access_token &&
      !tokens.refresh_token &&
      !tokens.expiry_date
    ) {
      throw new Error("Invalid Tokens");
    }

    const user = await this.userDB.findOne({
      refresh_token: tokens.refresh_token,
    });

    if (user) {
      return user._id;
    }

    const visitorData = ProtoUtils.encodeVisitorData(
      Utils.generateRandomString(11),
      Math.floor(Date.now() / 1000)
    );

    const poToken = await this.getPo(visitorData);

    if (!poToken) throw new Error("Could not get Po Token");

    const newUser = new this.userDB({
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
      expiry_date: tokens.expiry_date,
      visitor_data: visitorData,
      po_token: poToken,
    });

    await newUser.save();

    const Account = new YTModule(newUser.id as string);
    await Account.Init(poToken, visitorData);

    Account.innertube.session.signIn({
      access_token: tokens.access_token as string,
      refresh_token: tokens.refresh_token as string,
      expiry_date: new Date(tokens.expiry_date as number).toISOString(),
      client: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      },
    });

    this.AccountsMap.set(newUser._id as string, Account);
    return newUser._id as string;
  }

  async DeleteGuestUser(token: string) {
    if (token) {
      const oldGuestSession = this.GuestAccountsMap.get(token);

      if (oldGuestSession) {
        console.log("[Guest] Deleting Guest User");
        this.GuestAccountsMap.delete(token);
        console.log("[Guest] Guest User Deleted");
      }
    }
  }

  async SetGuestUser() {
    const visitorData = ProtoUtils.encodeVisitorData(
      Utils.generateRandomString(11),
      Math.floor(Date.now() / 1000)
    );

    const poToken = await this.getPo(visitorData);

    if (!poToken) throw new Error("Could not get Po Token");

    const Token = uid(32);

    const Account = new YTModule(Token);
    await Account.Init(poToken, visitorData);

    this.GuestAccountsMap.set(Token, Account);

    return Account;
  }

  async getPo(identifier: string): Promise<string | undefined> {
    const requestKey = "O43z0dpjhgX20SCx4KAo";

    const dom = new JSDOM();

    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
    });

    const bgConfig = {
      fetch: (input: string | URL | globalThis.Request, init?: RequestInit) =>
        fetch(input, init),
      requestKey,
      identifier,
      globalObj: globalThis,
    };

    const challenge = await BG.Challenge.create(bgConfig);

    if (!challenge) throw new Error("Could not get challenge");

    if (challenge.script) {
      const script = challenge.script.find((sc) => sc !== null);
      if (script) new Function(script)();
    } else {
      console.warn("Unable to load VM.");
    }

    const poToken = await BG.PoToken.generate({
      program: challenge.challenge,
      globalName: challenge.globalName,
      bgConfig,
    });

    return poToken;
  }

  async SetAllAccounts() {
    const users = await this.userDB.find({});

    console.log("[Server] Loading Account");
    let i = 1;
    for (const user of users) {
      console.log("[Server] Account number: " + i + " of " + users.length);
      const Account = new YTModule(user.id);
      await Account.Init(user.po_token, user.visitor_data);

      Account.innertube.session.signIn({
        access_token: user.access_token,
        refresh_token: user.refresh_token,
        expiry_date: new Date(user.expiry_date as number).toISOString(),
        client: {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
        },
      });

      Account.innertube.session.on("update-credentials", (credentials) => {});

      this.AccountsMap.set(user.id as string, Account);
      i++;
    }

    console.log("[Server] All Accounts Loaded");
  }

  async GetAccount(token: string) {
    const Account = this.AccountsMap.get(token);
    let GuestAccount = this.GuestAccountsMap.get(token);
    console.log("[Account] Account Loading");
    if (!Account) {
      console.log("[Guest] Loading Account");
      if (!GuestAccount) {
        console.log("[Guest] Creating Account");
        GuestAccount = await this.SetGuestUser();
      }
      console.log("[Guest] Account Loaded");
      return GuestAccount;
    }

    console.log("[Account] Account Loaded");
    return Account;
  }

  async LogoutUser(token: string) {
    const Account = this.AccountsMap.get(token);

    if (!Account) throw new Error("Invalid Token");

    await Account.innertube.session.signOut();
    this.AccountsMap.delete(token);
    console.log("[Account] User Logged Out");
    console.log("[Account] Deleting Account");

    const userDelete = await this.userDB.findOneAndDelete({ _id: token });

    if (!userDelete) throw new Error("Could not delete user");
    console.log("[Account] Deleted User");
    return userDelete;
  }

  async UpdateUser(
    token: string,
    {
      refresh_token,
      access_token,
      expiry_date,
    }: { refresh_token: string; access_token: string; expiry_date: number }
  ) {
    const user = await this.userDB.findOne({ _id: token });
    console.log("[Account] Updating User");

    if (!user) throw new Error("Invalid Token");

    user.refresh_token = refresh_token;
    user.access_token = access_token;
    user.expiry_date = expiry_date;

    await user.save();
    console.log("[Account] User Updated");
  }
}

export default new YTManager();
