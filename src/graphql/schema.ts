import { makeExecutableSchema } from 'graphql-tools';
import { resolvers } from './resolvers';

const typeDefs = `
    type Friend {
        id: ID
        firstName: String
        lastName: String
        email: String
        role: String
    }
    type AdminFriend {
        id: ID
        firstName: String
        lastName: String
        email: String
        role: String
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
        getFriendByEmail (email : String!) : AdminFriend
        
    }
    input FriendInput {
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
    input AdminFriendEditInput {
        firstName: String
        lastName: String
        email: String
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
        adminEditFriend(input: AdminFriendEditInput): AdminFriend
       
    }
`;

const schema = makeExecutableSchema({ typeDefs, resolvers });

export { schema };