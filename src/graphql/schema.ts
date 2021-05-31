import { makeExecutableSchema } from 'graphql-tools';
import { resolvers } from './resolvers';

const typeDefs = `#graphql
    type Friend {
        id: ID
        firstName: String
        lastName: String
        email: String
        password: String
        role: String
    }
    type Position {
        lastUpdated: String
        email: String
        name: String
        location: Point
    }
    type Point {
        type: String!
        coordinates: [Float]
    }

    type GameArea {
        type: String!
        coordinates: [[[Float]]]
    }

    union FoundUserByEmail = Friend | Error
        
    type Error {
        msg: String!
        code: Int!
    } 

 
    """
    Queries available for Friends
    """
 
    type Query {
        """
        Returns all details for all Friends (Requires admin role)
        
        """
        getAllFriends : [Friend]!
        
        
        """
        Returns the logged in user (Login is required)
        """
        getFriend : Friend

        
        """
        This fetch the data from my own REST API
        """
        getAllFriendsProxy: [Friend]!

        
        """
        Get Friend by Email (Requires admin role)
        """
        getFriendByEmail (email : String!) : FoundUserByEmail

        """
        Get Friend by ID (Requires admin role)
        """
        getFriendById (id : String!) : Friend

        """
        Get Game Area
        """
        getGameArea: GameArea
        
    }

    input FriendInput {
        ID: String
        firstName: String!
        lastName: String!
        password: String!
        email: String!
    }
    input FriendEditInput {
        firstName: String
        lastName: String
        email: String
        password: String
    }
    input PositionInput {
        email: String!
        password: String!
        longitude: Float!
        latitude: Float!
    }
  
   
   
 

  
   
    """
    Mutations available for Friends
    """

    type Mutation {
        """
        Allows anyone (non authenticated users) to create a new friend
        """
        createFriend(input: FriendInput): Friend

        
        """
        Edits a friend (Edits the logged in user/admin)
        """
        editFriend(input: FriendEditInput): Friend


        """
        Delete a friend(Requires admin Role)
        """
        deleteFriend(email : String) : Boolean


        """
        Admin can edit everyone (Requires admin Role)
        """
        adminEditFriend(input: FriendEditInput): Friend
       

       """
       Adds the users position
       """
       addPosition(input: PositionInput): Boolean!


        """
        Find friends nearby
        """
        nearbyFriends(input: PositionInput, distance:Float):[Position]!

       
    }
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });

export { schema };