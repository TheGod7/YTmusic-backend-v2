import { Router } from "express";
import YTModule from "../../modules/YTManager.js";

const router = Router();

router.get("/", (req, res) => {
  const token = req.headers.authorization;

  try {
    if (token) {
      const tokenSplit = token.split(" ");

      YTModule.DeleteGuestUser(tokenSplit[1]);
    }

    res.redirect(YTModule.auth.GenerateLoginURL());
  } catch (error: any) {
    res.json({ error: true, message: error.message });
  }
});

router.get("/login", async (req, res) => {
  const code = req.query.code as string;

  try {
    const token = await YTModule.SetUser(code);
    res.json({ token });
  } catch (error: any) {
    res.status(400).json({ error: true, message: error.message });
  }
});

router.get("/account", async (req, res) => {
  const token = req.headers.authorization;

  try {
    if (!token) throw new Error("No Token");

    const tokenSplit = token.split(" ");

    if (tokenSplit[0] !== "Bearer") throw new Error("Invalid Token");

    const tokenData = tokenSplit[1];

    const account = await YTModule.GetAccount(tokenData);

    const accountInfo = await account.getAccountInfo();
    res.json({
      data: accountInfo,
    });
  } catch (error: any) {
    res.status(400).json({ error: true, message: error.message });
  }
});

router.get("/logout", async (req, res) => {
  const token = req.headers.authorization;

  try {
    if (!token) throw new Error("No Token");

    const tokenSplit = token.split(" ");

    if (tokenSplit[0] !== "Bearer") throw new Error("Invalid Token");

    const tokenData = tokenSplit[1];

    const deletedUser = await YTModule.LogoutUser(tokenData);

    res.json({
      status: true,
      message: "User Deleted",
      deletedToken: deletedUser.id,
    });
  } catch (error: any) {
    console.log("[server] Error deleting user");
    res.status(400).json({ error: true, message: error.message });
  }
});

router.get("/docs", async (req, res) => {
  const docs = {
    title: "Authenmication Routes",
    description: "Routes for authenticating users",
    Routes: [
      {
        path: "/",
        method: "GET",
        description: "Redirects to the google authentication page",
        response: {
          200: {
            description: "Redirects to the google authentication page",
            type: "redirect",
          },
        },
      },
      {
        path: "/login",
        method: "GET",
        description: "Gets the code from google and sets the user",
        response: {
          200: {
            description: "Sets the user",
            type: "object",
            properties: {
              token: {
                type: "string",
                description: "The token of the user",
              },
            },
          },
        },
      },
      {
        path: "/account",
        method: "GET",
        auth: true,
        description: "Gets the account information of the user",
        autherization: true,
        response: {
          200: {
            description: "Gets the account information of the user",
            type: "object",
            properties: {
              data: {
                type: "object",
                description: "The account information of the user",
                properties: {
                  name: {
                    type: "string",
                    description: "The name of the user",
                  },
                  photo: {
                    type: "Array",
                    description: "The photo of the user",
                    properties: {
                      url: {
                        type: "string",
                        description: "The url of the photo",
                      },
                      width: {
                        type: "number",
                        description: "The width of the photo",
                      },
                      height: {
                        type: "number",
                        description: "The height of the photo",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        path: "/logout",
        method: "GET",
        description: "Deletes the user",
        response: {
          200: {
            description: "Deletes the user",
            type: "object",
            properties: {
              status: {
                type: "boolean",
                description: "If the user was deleted",
              },
              message: {
                type: "string",
                description: "The message of the response",
              },
              deletedToken: {
                type: "string",
                description: "The token of the deleted user",
              },
            },
          },
        },
      },
    ],
  };

  res.json(docs);
});

export default router;
