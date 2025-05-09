import { User } from "@prisma/client";
import Ad from "../Ad";
import Birthdays from "./Birthdays";
import UserInfoCard from "./UserInfoCard";
import UserMediaCard from "./UserMediaCard";
import { Suspense } from "react";
import FriendRequests from "./FriendRequest";

const RightMenu = ({ user }: { user?: User }) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Only render UserInfoCard and UserMediaCard if user exists */}
      {user ? (
        <>
          <Suspense fallback={<div>Loading User Info...</div>}>
            <UserInfoCard user={user} />
          </Suspense>
          <Suspense fallback={<div>Loading Media...</div>}>
            <UserMediaCard user={user} />
          </Suspense>
        </>
      ) : (
        <div>No user data available.</div>
      )}
      
      {/* Friend Requests and Birthdays are displayed regardless of user */}
      <FriendRequests />
      <Birthdays />
      
      {/* Ad Component */}
      <Ad size="md" />
    </div>
  );
};

export default RightMenu;
