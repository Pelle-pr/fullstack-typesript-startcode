import auth from "basic-auth";

import { Request, Response } from "express";
import Friendfacade from "../facade/friendFacade";

let facade: Friendfacade;

const authMiddleware = async function (
  req: Request,
  res: Response,
  next: Function
) {
  if (!facade) {
    facade = new Friendfacade(req.app.get("db"));
  }

  var credentials = auth(req);

  if (credentials && (await check(credentials.name, credentials.pass, req))) {
    next();
  } else {
    res.statusCode = 401;
    res.setHeader("WWW-Authenticate", 'Basic realm="example"');
    res.json({ errors: [{ message: 'Access denied' }] })

  }
};

async function check(email: string, pass: string, req: any) {
  const verifiedUser = await facade.getVerifiedUser(email, pass);
  if (verifiedUser) {
    req.credentials = { email: verifiedUser.email, role: verifiedUser.role };
    return true;
  }
  return false;
}
export default authMiddleware;
