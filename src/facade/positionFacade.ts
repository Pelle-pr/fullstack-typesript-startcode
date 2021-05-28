import path from "path"
require('dotenv').config({ path: path.join(__dirname, "..", "..", '.env') })
import { Db, Collection, ObjectID } from "mongodb";
import IPosition from '../interfaces/IPosition'
import FriendsFacade from './friendFacade';
import { ApiError } from "../errors/apiError";
import { IFriend } from "../interfaces/IFriend";
import { IGeoPolygon } from "../interfaces/IGeo";
import { gameArea } from "../utils/gameArea"


class PositionFacade {
    db: Db
    positionCollection: Collection
    friendFacade: FriendsFacade;

    constructor(db: Db) {
        this.db = db;
        this.positionCollection = db.collection("positions");
        this.friendFacade = new FriendsFacade(db);
    }

    async addOrUpdatePosition(email: string, longitude: number, latitude: number): Promise<IPosition> {
        try {
            const findFriend: IFriend = await this.friendFacade.getFriendFromEmail(email)
            const fullName = findFriend.firstName + " " + findFriend.lastName

            const newPosition: IPosition = { lastUpdated: new Date(), email, name: fullName, location: { type: "Point", coordinates: [longitude, latitude] } }

            const query = { email }
            const update = { $set: { ...newPosition } }
            const options = { upsert: true, returnOriginal: false }

            const res = await this.positionCollection.findOneAndUpdate(query, update, options)

            return res.value
        } catch (err) {
            throw new ApiError(err)
        }
    }

    async findNearbyFriends(email: string, password: string, longitude: number, latitude: number, distance: number): Promise<Array<IPosition>> {

        const verifyFriend = await this.friendFacade.getFriendFromEmail(email)

        if (verifyFriend === null) {
            throw new ApiError("Not authorized", 401)
        }

        await this.addOrUpdatePosition(email, longitude, latitude)

        const res = await this.positionCollection.find({
            email: { $ne: email },
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: distance
                }
            }
        }).toArray()

        return res

    }

    async findFriendPositionByEmail(email: string) {

        const res = await this.positionCollection.findOne({ email })

        if (res === null) {
            throw new ApiError("Not found", 404)
        }

        return res

    }

    async getGameArea(): Promise<IGeoPolygon> {
        return gameArea
    }

    async getAllPositions(): Promise<Array<IPosition>> {
        return this.positionCollection.find({}).toArray();
    }


}

export default PositionFacade;

