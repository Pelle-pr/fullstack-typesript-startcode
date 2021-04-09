import { Router } from "express";
const router = Router();
import { ApiError } from "../errors/apiError";
import FriendFacade from "../facade/friendFacade";
import d from "debug";
const debug = d("friend-routes");

let facade: FriendFacade;

// Initialize facade using the database set on the application object
router.use(async (req, res, next) => {
  if (!facade) {
    const db = req.app.get("db");
    debug("Database used: " + req.app.get("db-type"));
    facade = new FriendFacade(db);
  }
  next();
});

// This does NOT require authentication in order to let new users create themself
router.post("/", async function (req, res, next) {
  try {
    let newFriend = req.body;
    const status = await facade.addFriend(newFriend);
    res.json({ status });
  } catch (err) {
    debug(err);
    if (err instanceof ApiError) {
      next(err);
    } else {
      next(new ApiError(err.message, 400));
    }
  }
});

// ALL ENDPOINTS BELOW REQUIRES AUTHENTICATION

import authMiddleware from "../middleware/basic-auth";
router.use(authMiddleware);

router.get("/all", async (req: any, res) => {
  const friends = await facade.getAllFriends();

  const friendsDTO = friends.map((friend) => {
    const { firstName, lastName } = friend;
    return { firstName, lastName };
  });
  res.json(friendsDTO);
});

/**
 * authenticated users can edit himself
 */
router.put("/editme", async function (req: any, res, next) {
  try {
    const email = req.credentials.email;
    const editFriend = req.body;
    const status = await facade.editFriend(email, editFriend);
    res.json(status);
  } catch (err) {
    debug(err);
    if (err instanceof ApiError) {
      return next(err);
    }
    next(new ApiError(err.message, 400));
  }
});

router.get("/me", async (req: any, res, next) => {
  try {
    const email = req.credentials.email;
    const friend = await facade.getFriend(email);

    res.json(friend);
  } catch (err) {
    if (err instanceof ApiError) {
      return next(err);
    }
    next(new ApiError(err.message, 400));
  }
});

//These endpoint requires admin rights

//An admin user can fetch everyone
router.get("/find-user/:email", async (req: any, res, next) => {
  try {
    if (req.credentials.role !== "admin") {
      throw new ApiError("Not Authorized", 401);
    }
    const email_ = req.params.email;
    const friend = await facade.getFriend(email_);
    if (friend == null) {
      throw new ApiError("user not found", 404);
    }
    const { firstName, lastName, email, role } = friend;
    const friendForAdminDTO = { firstName, lastName, email, role };
    res.json(friendForAdminDTO);
  } catch (err) {
    if (err instanceof ApiError) {
      return next(err);
    }
    next(new ApiError(err.message, 400));
  }
});

//An admin user can edit everyone
router.put("/:email", async function (req: any, res, next) {
  try {
    if (req.credentials.role !== "admin") {
      throw new ApiError("Not Authorized", 401);
    }
    const email = req.params.email;
    let newFriend = req.body;

    const status = await facade.editFriend(email, newFriend);
    res.json(status);
  } catch (err) {
    if (err instanceof ApiError) {
      return next(err);
    }
    next(new ApiError(err.message, 400));
  }
});

router.delete("/:email", async function (req: any, res, next) {
  try {
    if (req.credentials.role !== "admin") {
      throw new ApiError("Not Authorized", 401);
    }
    const email = req.params.email;
    const status = await facade.deleteFriend(email);
    res.json(status);
  } catch (err) {
    if (err instanceof ApiError) {
      return next(err);
    }
    next(new ApiError(err.message, 400));
  }
});

export default router;
