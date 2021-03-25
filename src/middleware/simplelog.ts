import { Request, Response } from "express";
import d from "debug";
const debug = d("simplelog");

export default function simpleLog(req: Request, res: Response, next: Function) {
  const { method, ip, originalUrl } = req;
  debug(new Date().toLocaleDateString(), method, ip, originalUrl);
  next();
}
