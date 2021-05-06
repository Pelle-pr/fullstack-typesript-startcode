import path from "path"
require('dotenv').config({ path: path.join(__dirname, "..", "..", '.env') })
import { Db, Collection, ObjectID } from "mongodb";
import IPosition from '../interfaces/IPosition'
import FriendsFacade from './friendFacade';
import { DbConnector } from "../config/dbConnector"
import { ApiError } from "../errors/apiError";
import { number } from "joi";

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
        const newLocation = { type: "Point", coordinates: [longitude, latitude] }

        const res = await this.positionCollection.findOneAndUpdate(
            { email },
            { $set: { location: newLocation } },
            {
                returnOriginal: false
            })
        if (!res.value) {
            throw new ApiError("User email not found", 404)
        }

        return res.value
    }

    async findNearbyFriends(email: string, password: string, longitude: number, latitude: number, distance: number): Promise<Array<IPosition>> {

        const res = await this.positionCollection.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [longitude, latitude] },
                    distanceField: "dist.calculated",
                    maxDistance: distance,
                    includeLocs: "dist.location",
                    spherical: true
                }
            }
        ]).toArray()

        return res.filter(user => user.email !== email)

    }

    async getAllPositions(): Promise<Array<IPosition>> {
        return this.positionCollection.find({}).toArray();
    }


}

export default PositionFacade;

async function tester() {
    const client = await DbConnector.connect()
    const db = client.db(process.env.DB_NAME)
    const positionFacade = new PositionFacade(db)
    await positionFacade.addOrUpdatePosition("pp@b.dk", 5, 5)
    process.exit(0)
}

//tester()