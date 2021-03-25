import { Request, response, Response } from "express";

export default function myCors(req: Request, res: Response, next: Function) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header(
    "Access-Control-Allow-Headers,Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
}
