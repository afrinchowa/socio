import prisma from "@/lib/client";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";

const ProfileCard = async () => {
  const { userId } = auth(); // Get the userId from Clerk authentication

  // If there's no userId, return null to avoid errors
  if (!userId) return null;

  // Fetch the user from Prisma with their followers count
  const user = await prisma.user.findFirst({
    where: {
      id: userId, // Use the userId as a string directly in Prisma
    },
    include: {
      _count: {
        select: {
          followers: true, // Select the count of followers for the user
        },
      },
    },
  });

  // If no user is found, return null
  if (!user) return null;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md text-sm flex flex-col gap-6">
      {/* Cover Image Section */}
      <div className="h-20 relative">
        <Image
          src={user.cover || "/noCover.png"} // Use fallback image if no cover is set
          alt="Cover"
          fill
          className="rounded-md object-cover"
        />
        {/* Avatar Image Section */}
        <Image
          src={user.avatar || "/noAvatar.png"} // Use fallback avatar if no avatar is set
          alt="Avatar"
          width={48}
          height={48}
          className="rounded-full object-cover w-12 h-12 absolute left-0 right-0 m-auto -bottom-6 ring-1 ring-white z-10"
        />
      </div>

      {/* User Info Section */}
      <div className="h-20 flex flex-col gap-2 items-center">
        {/* Name or Username Display */}
        <span className="font-semibold">
          {user.name && user.surname
            ? user.name + " " + user.surname
            : user.username}
        </span>

        {/* Followers Section */}
        <div className="flex items-center gap-4">
          <div className="flex">
            {/* Placeholder for dynamic follower images */}
            {Array.from({ length: 3 }).map((_, index) => (
              <Image
                key={index}
                src="https://images.pexels.com/photos/19578755/pexels-photo-19578755/free-photo-of-woman-watching-birds-and-landscape.jpeg?auto=compress&cs=tinysrgb&w=800&lazy=load"
                alt={`Follower ${index + 1}`}
                width={12}
                height={12}
                className="rounded-full object-cover w-3 h-3"
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {user._count.followers} Followers
          </span>
        </div>

        {/* Link to the user's profile */}
        <Link href={`/profile/${user.username}`}>
          <button className="bg-blue-500 text-white text-xs p-2 rounded-md">
            My Profile
          </button>
        </Link>
      </div>
    </div>
  );
};

export default ProfileCard;
