import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import * as EmailValidator from "email-validator";
import bcrypt from "bcrypt";
import { EntityRepository, getCustomRepository, Repository } from "typeorm";
import { UserEntity } from "../entity/user.entity";

dotenv.config();
@EntityRepository(UserEntity)
export class UserRepository extends Repository<UserEntity> {
  //!Create a new user
  async signUp(req: Request, res: Response) {
    let { userName, userEmail, userPassword } = req.body;
    const jwt_secret = process.env.JWT_SECRET_KEY as string;
    let isValidated = EmailValidator.validate(userEmail);

    if (!isValidated) {
      return res.send({
        authentication: false,
        message: "Invalid Email",
      });
    }

    //!Check if userName exists in DB

    let nameExists =
      (await this.createQueryBuilder("scUsers")
        .where("scUsers.userName = :userName", { userName: userName })
        .getCount()) > 0;
    if (nameExists) {
      return res.send({
        authentication: false,
        message: "UserName already exists.Try another one",
      });
    }

    //!Check if user is in DB

    let emailExists =
      (await this.createQueryBuilder("scUsers")
        .where("scUsers.userEmail = :userEmail", { userEmail: userEmail })
        .getCount()) > 0;
    if (emailExists) {
      return res.send({
        authentication: false,
        message: "Email already exists.Try another one",
      });
    } else {
      const salt = await bcrypt.genSalt(10);
      bcrypt.hash(
        userPassword,
        salt,
        async (error: any, hashedpassword: any) => {
          if (error) {
            return res.send({
              authentication: false,
              message: "error",
            });
          } else {
            //!creating new user
            let user = new UserEntity();
            user.userName = userName;
            user.userPassword = hashedpassword; //!adding hashed password
            user.userEmail = userEmail;
            //!saving the user
            await this.save(user);
            //!create JWT => sign jwt
            let userData = await this.createQueryBuilder("scUsers")
              .select("scUsers.id")
              .addSelect("scUsers.userEmail")
              .addSelect("scUsers.userName")
              .addSelect("scUsers.userPassword")
              .where("scUsers.userEmail = :query", { query: userEmail })
              .getOne();

            jwt.sign(
              {
                userData: userData,
              },
              jwt_secret,
              {
                expiresIn: "10h",
              },
              async (error: any, authData: any) => {
                if (error) {
                  return res.send({
                    authentication: false,
                    message: error,
                  });
                } else {
                  return res.send({
                    authentication: true,
                    message: authData,
                  });
                }
              }
            );
          }
        }
      );
    }
  }

  //!login registered user
  async login(req: Request, res: Response) {
    let { userEmail, userPassword } = req.body;
    const jwt_secret = process.env.JWT_SECRET_KEY as string;
    let isValidated = EmailValidator.validate(userEmail);

    if (!isValidated) {
      return res.send({
        authentication: false,
        message: "Invalid Email",
      });
    }

    let findUserPassword = await this.createQueryBuilder("scUsers")
      .select("scUsers.userPassword")
      .where("scUsers.userEmail = :userEmail", { userEmail: userEmail })
      .getOne();

    let userData = await this.createQueryBuilder("scUsers")
      .select("scUsers.id")
      .addSelect("scUsers.userEmail")
      .addSelect("scUsers.userName")
      .addSelect("scUsers.userPassword")
      .where("scUsers.userEmail = :query", { query: userEmail })
      .getOne();


    bcrypt.compare(
      userPassword,
      findUserPassword?.userPassword as string,
      (error: any, isPasswordMatched) => {
        if (error) {
          res.send({
            authentication: false,
            message: error,
          });
        }

        if (!isPasswordMatched) {
          res.send({
            authentication: false,
            message: "Password not matched",
          });
        }
        if (isPasswordMatched) {
          jwt.sign(
            {
              userData: userData,
            },
            jwt_secret,
            {
              expiresIn: "10h",
            },
            async (error: any, authdata: any) => {
              if (error) {
                return res.send({
                  authentication: false,
                  message: error,
                });
              } else {
                return res.send({
                  authentication: true,
                  message: authdata,
                });
              }
            }
          );
        }
      }
    );
  }

  //!fetch all users
  async fetchAllUsers(req: Request, res: Response) {
    let token = req.headers.authorization as string;
    const jwt_secret = process.env.JWT_SECRET_KEY as string;
    jwt.verify(token, jwt_secret, async (error: any, authdata: any) => {
      if (error) {
        return res.send({
          data: error,
        });
      } else {
        let data = await this.createQueryBuilder("scUsers").select().getMany();
        return res.send({
          confidentialData: data,
          authdata: authdata,
        });
      }
    });
  }
  
  //! Decoding users JWT
  async decodeUserData(req: Request, res: Response) {
    let tokenData = req.headers.authorization as string;
    const jwt_secret = process.env.JWT_SECRET_KEY as string;
    jwt.verify(tokenData, jwt_secret, async (error: any, userData: any) => {
      if (error) {
        return res.send({
          received: false,
          data: null,
        });
      } else {
        return res.send({
          received: true,
          data: userData,
        });
      }
    });
  }

  async getSearchResults(req: Request, res: Response) {
    let token = req.headers.authorization as string;
    let searchQuery = req.params.searchQuery;
    let userName = req.params.userName;
    const jwt_secret = process.env.JWT_SECRET_KEY as string;
    jwt.verify(token, jwt_secret, async (error: any, authdata: any) => {
      if (error) {
        return res.send({
          success:false,
          data: error,
        });
      } else {
        let data = await this.createQueryBuilder("scUsers")
          .select('scUsers.id')
          .addSelect('scUsers.userName')
          .addSelect('scUsers.userEmail')
          .leftJoin("scUsers.info","info")
          .addSelect('info.userDp')
          .addSelect('info.name')
          .addSelect('info.userBio')
          .where('scUsers.userName ILIKE :searchQuery', { searchQuery: `%${searchQuery}%` })
          .andWhere('scUsers.userName != :userName', { userName: userName })
          .getMany();
        return res.send({
          success:true,
          data: data,
        });
      }
    });
  }
}
