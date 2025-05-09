import prisma from "@/lib/client";
import { auth } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";

import Image from "next/image";
import Link from "next/link";
import UserInfoCardInteraction from "./UserInfoCardInteraction";
import UpdateUser from "./UpdateUser";

const UserInfoCard = async ({ user }: { user: User }) => {
  const { userId: currentUserId } = auth();

  // Format Join Date
  const formattedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Initialize interaction flags
  let isUserBlocked = false;
  let isFollowing = false;
  let isFollowingSent = false;

  if (currentUserId && currentUserId !== user.id.toString()) {
    const [blockRes, followRes, followReqRes] = await Promise.all([
      prisma.block.findFirst({
        where: { blockerId: currentUserId, blockedId: user.id.toString() },
      }),
      prisma.follower.findFirst({
        where: { followerId: currentUserId, followingId: user.id.toString() },
      }),
      prisma.followRequest.findFirst({
        where: { senderId: currentUserId, receiverId: user.id.toString() },
      }),
    ]);

    isUserBlocked = !!blockRes;
    isFollowing = !!followRes;
    isFollowingSent = !!followReqRes;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-md text-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center font-medium">
        <span className="text-gray-500">User Information</span>
        {currentUserId === user.id.toString() ? (
          <UpdateUser user={user} />
        ) : (
          <Link href="/" className="text-blue-500 text-xs">
            See all
          </Link>
        )}
      </div>

      {/* User Details */}
      <div className="flex flex-col gap-4 text-gray-600">
        {/* Name and Username */}
        <div className="flex items-center gap-2">
          <span className="text-xl text-black font-semibold">
            {user.name && user.surname
              ? `${user.name} ${user.surname}`
              : user.username}
          </span>
          <span className="text-sm text-gray-500">@{user.username}</span>
        </div>

        {/* Description */}
        {user.description && <p>{user.description}</p>}

        {/* Location */}
        {user.city && (
          <div className="flex items-center gap-2">
            <Image src="/map.png" alt="City Icon" width={16} height={16} />
            <span>
              Living in <b>{user.city}</b>
            </span>
          </div>
        )}

        {/* Education */}
        {user.school && (
          <div className="flex items-center gap-2">
            <Image src="/school.png" alt="School Icon" width={16} height={16} />
            <span>
              Went to <b>{user.school}</b>
            </span>
          </div>
        )}

        {/* Work */}
        {user.work && (
          <div className="flex items-center gap-2">
            <Image src="/work.png" alt="Work Icon" width={16} height={16} />
            <span>
              Works at <b>{user.work}</b>
            </span>
          </div>
        )}

        {/* Website and Join Date */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          {user.website && (
            <div className="flex items-center gap-1">
              <Image src="/link.png" alt="Website Icon" width={16} height={16} />
              <Link
                href={
                  user.website.startsWith("http")
                    ? user.website
                    : `https://${user.website}`
                }
                className="text-blue-500 font-medium truncate"
                target="_blank"
                rel="noopener noreferrer"
              >
                {user.website}
              </Link>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Image src="/date.png" alt="Join Date Icon" width={16} height={16} />
            <span>Joined {formattedDate}</span>
          </div>
        </div>

        {/* Interaction Buttons */}
        {currentUserId && currentUserId !== user.id.toString() && (
          <UserInfoCardInteraction
            userId={user.id.toString()}
            isUserBlocked={isUserBlocked}
            isFollowing={isFollowing}
            isFollowingSent={isFollowingSent}
          />
        )}
      </div>
    </div>
  );
};

export default UserInfoCard;
