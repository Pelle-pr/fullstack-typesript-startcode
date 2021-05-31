import FriendFacade from '../facade/friendFacade';
import { IFriend } from '../interfaces/IFriend';
import { ApiError } from '../errors/apiError';
import { Request } from "express";
import fetch from "node-fetch"
import PositionFacade from '../facade/positionFacade';




let friendFacade: FriendFacade;
let positionFacade: PositionFacade;

interface IPositionInput {
    email: string
    password: string
    longitude: number
    latitude: number
}
/*
We don't have access to app or the Router so we need to set up the facade in another way
In www.ts IMPORT and CALL the method below, like so: 
      setupFacade(db);
Just before the line where you start the server
*/
export function setupFacade(db: any) {
    if (!friendFacade) {
        friendFacade = new FriendFacade(db)
    }
    if (!positionFacade) {
        positionFacade = new PositionFacade(db)
    }
}

// resolver map
export const resolvers = {
    Query: {

        getAllFriends: (root: any, _: any, context: any) => {

            if (!context.credentials) {
                throw new ApiError("Not Authorized", 401)
            }

            return friendFacade.getAllFriends()

        },

        getFriend: async (root: any, _: any, context: any) => {
            if (!context.credentials) {
                throw new ApiError("Not Authorized", 401)
            }

            return friendFacade.getFriendFromEmail(context.credentials.email)
        },

        // Errors with GraphQL

        getFriendByEmail: async (_: object, { email }: { email: string }, context: any) => {

            if (!context.credentials || context.credentials.role !== "admin") {
                return { __typename: "Error", msg: "Not authorized", code: 401 }
            }
            try {
                const friend: IFriend = await friendFacade.getFriendFromEmail(email)

                return { __typename: "Friend", ...friend }

            } catch (error) {
                if (error instanceof ApiError) {
                    return { __typename: "Error", msg: "Friend not found", code: 404 }
                }
            }
        },
        getFriendById: async (_: object, { id }: { id: string }, context: any) => {

            if (!context.credentials || context.credentials.role !== "admin") {
                throw new ApiError("Not Authorized", 401)
            }

            return friendFacade.getFriendFromId(id)
        },
        getGameArea: async (root: object, _: any, context: any) => {
            return positionFacade.getGameArea()
        },



        getAllFriendsProxy: async (root: object, _: any, context: Request) => {

            let options: any = { method: "GET" }

            //This part only required if authentication is required
            const auth = context.get("authorization");
            if (auth) {
                options.headers = { 'authorization': auth }
            }
            return fetch(`http://localhost:${process.env.PORT}/api/friends/all`, options).then(r => {
                if (r.status >= 400) { throw new Error(r.statusText) }
                return r.json()
            })
        }
    },
    Mutation: {
        createFriend: async (_: object, { input }: { input: IFriend }) => {
            return friendFacade.addFriend(input)
        },
        editFriend: async (_: object, { input }: { input: IFriend }, context: any) => {

            if (!context.credentials) {
                throw new ApiError("Not Authorized", 401)
            }

            return friendFacade.editFriend(context.credentials.email, input)
        },
        deleteFriend: async (_: object, { email }: { email: string }, context: any) => {
            if (!context.credentials || context.credentials.role !== "admin") {
                throw new ApiError("Not Authorized", 401)
            }

            return friendFacade.deleteFriend(email)
        },
        adminEditFriend: async (_: object, { input }: { email: string, input: IFriend }, context: any) => {

            if (!context.credentials || context.credentials.role !== "admin") {
                throw new ApiError("Not Authorized", 401)
            }

            return friendFacade.editFriend(input.email, input)
        },
        addPosition: async (_: object, { input }: { input: IPositionInput }, context: any) => {

            // if (!context.credentials) {
            //     throw new ApiError("Not Authorized", 401)
            // }
            try {
                positionFacade.addOrUpdatePosition(input.email, input.longitude, input.latitude)
                return true
            } catch (err) {
                return false
            }
        },
        nearbyFriends: async (_: object, { input, distance }: { input: IPositionInput, distance: number }) => {

            const res = await positionFacade.findNearbyFriends(input.email, input.password, input.longitude, input.latitude, distance)

            return res
        }
    }
};