import express from "express";
import facade from "../facade/dummyDB-Facade";
import { IFriend } from "../interfaces/IFriend";
import Joi from "joi";
import { ApiError } from "../errors/apiError";
const router = express.Router();
import authMiddleware from "../middleware/basic-auth";

router.use("/", authMiddleware);
router
  .get("/", async (req, res, next) => {
    const allFriends = await facade.getAllFriends();

    const friendsDTO = allFriends.map((friend) => {
      return makeFriendDTO(friend);
    });

    res.status(200);
    res.send(friendsDTO);
  })
  .post("/", async (req, res, next) => {
    const { error } = validateFriend(req.body);

    if (error) {
      return res.status(400).send(error.details[0].message);
    }
    const addFriend = await facade.addFriend(req.body);

    if (!addFriend) {
      return new ApiError("Internal server error", 500);
    }
    const friendDTO = makeFriendDTO(addFriend);

    res.send(friendDTO);
  });

router
  .get("/:email", async (req, res, next) => {
    const email = req.params.email;
    const friend = await facade.getFriend(email);

    try {
      if (!friend) {
        throw new ApiError("User not found", 404);
      }
      const friendDTO = makeFriendDTO(friend);

      res.send(friendDTO);
    } catch (err) {
      next(err);
    }
  })
  .delete("/:email", async (req, res, next) => {
    let email = req.params.email;

    const deletedFriend = await facade.deleteFriend(email);
    if (!deletedFriend) {
      return new ApiError("Internal server error", 500);
    }
    const friendDTO = makeFriendDTO(deletedFriend);
    res.send(friendDTO);
  })
  .get("/info/me", async (req: any, res, next) => {
    const email_ = req.credentials.userName;
    const friend = await facade.getFriend(email_);

    try {
      if (!friend) {
        throw new ApiError("User not found", 404);
      }

      const friendDTO = makeFriendDTO(friend);
      res.send(friendDTO);
    } catch (err) {
      next(err);
    }
  });

function validateFriend(friend: IFriend): Joi.ValidationResult {
  const schema = Joi.object({
    id: Joi.string().required(),
    firstName: Joi.string().min(2).required(),
    lastName: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(friend);
}

function makeFriendDTO(friend: IFriend) {
  const { firstName, lastName, email } = friend;
  const friendDTO = { firstName, lastName, email };
  return friendDTO;
}

export default router;
