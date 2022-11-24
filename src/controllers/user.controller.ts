import { Request, Response } from "express";
import { getManager } from "typeorm";
import { UserRepository } from "../database/user/repository/user.repository";

export class UserController {
  static async signUp(req: Request, res: Response) {
    let connectionmanager = getManager().getCustomRepository(UserRepository);
    await connectionmanager.signUp(req, res);
  }

  static async login(req: Request, res: Response) {
    let connectionmanager = getManager().getCustomRepository(UserRepository);
    await connectionmanager.login(req, res);
  }

  static async fetchAllUsers(req: Request, res: Response) {
    let connectionmanager = getManager().getCustomRepository(UserRepository);
    await connectionmanager.fetchAllUsers(req, res);
  }

  static async decodeUserData(req: Request, res: Response) {
    let connectionmanager = getManager().getCustomRepository(UserRepository);
    await connectionmanager.decodeUserData(req, res);
  }

  static async getSearchedResults(req: Request, res: Response) {
    let connectionmanager = getManager().getCustomRepository(UserRepository);
    await connectionmanager.getSearchResults(req, res);
  }
}
