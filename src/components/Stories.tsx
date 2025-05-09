import prisma from "@/lib/client";
import { auth } from "@clerk/nextjs/server";
import StoryList from "./StoryList";

const Stories = async () => {
  const { userId: currentUserId } = auth();

  if (!currentUserId) return null;

  // Clean the currentUserId to remove the prefix 'user_' if present
  const cleanedUserId = currentUserId.replace("user_", "");

  // Ensure the cleanedUserId is a valid 24-character hex string
  if (cleanedUserId.length !== 24 || !/^[a-fA-F0-9]{24}$/.test(cleanedUserId)) {
    console.error("Invalid UserId format:", cleanedUserId);
    return null;
  }

  // Convert cleaned userId to a string
  const userIdString = cleanedUserId; // You can use `userIdString` directly here

  // Fetch following users for the current user
  const followings = await prisma.follower.findMany({
    where: {
      followerId: userIdString,  // Use the string directly
    },
    select: {
      followingId: true,
    },
  });

  // Convert followingIds to string
  const followingIds = followings.map((f) => f.followingId.toString()); // Ensure all IDs are strings

  // Fetch active stories for followed users and the current user
  const stories = await prisma.story.findMany({
    where: {
      expiresAt: {
        gt: new Date(),
      },
      userId: {
        in: [...followingIds, userIdString], // Use strings for userId
      },
    },
    include: {
      user: true,
    },
  });

  return (
    <div className="p-4 bg-white rounded-lg shadow-md overflow-scroll text-xs scrollbar-hide">
      <div className="flex gap-8 w-max">
        <StoryList stories={stories} userId={userIdString} />
      </div>
    </div>
  );
};

export default Stories;
