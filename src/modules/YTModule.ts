import {
  ClientType,
  Innertube,
  UniversalCache,
  YT,
  YTNodes,
} from "youtubei.js";

class YTModule {
  innertube: Innertube;
  token: string;

  constructor(token: string) {
    this.token = token;
    this.innertube = null as unknown as Innertube;
  }

  async Init(po_token: string, visitor_data: string) {
    const cache = new UniversalCache(true);

    this.innertube = await Innertube.create({
      po_token,
      visitor_data,
      cache,
      client_type: ClientType.WEB,
      generate_session_locally: true,
    });
  }

  async getAccountInfo() {
    if (!this.innertube.session.logged_in) throw new Error("Not Logged In");
    const AccountInfo = await this.innertube.account.getInfo();

    const AccountItem = AccountInfo.contents
      ?.as(YTNodes.AccountItemSection)
      .contents[0].as(YTNodes.AccountItem);

    return {
      name: AccountItem?.account_name.text,
      photo: AccountItem?.account_photo[0],
    };
  }
}

export default YTModule;
