"use client";

import { acceptFollowRequest, declineFollowRequest } from "@/lib/actions";
import { FollowRequest, User } from "@prisma/client";
import Image from "next/image";
import { useOptimistic, useState } from "react";

type RequestWithUser = FollowRequest & {
  sender: User;
};

const FriendRequestList = ({ requests }: { requests: RequestWithUser[] }) => {
  const [requestState, setRequestState] = useState(requests);

  const accept = async (requestId: string, userId: string) => {
    removeOptimisticRequest(requestId);
    try {
      await acceptFollowRequest(userId);
      setRequestState((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {}
  };

  const decline = async (requestId: string, userId: string) => {
    removeOptimisticRequest(requestId);
    try {
      await declineFollowRequest(userId);
      setRequestState((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {}
  };

  const [optimisticRequests, removeOptimisticRequest] = useOptimistic(
    requestState,
    (state, value: string) => state.filter((req) => req.id !== value)
  );

  return (
    <div className="">
      {optimisticRequests.map((request) => (
        <div className="flex items-center justify-between" key={request.id}>
          <div className="flex items-center gap-4">
            <Image
              src={request.sender.avatar || "/noAvatar.png"}
              alt="Profile picture"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className="font-semibold">
              {request.sender.name && request.sender.surname
                ? request.sender.name + " " + request.sender.surname
                : request.sender.username}
            </span>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => accept(request.id, request.sender.id)}
              className="cursor-pointer"
            >
              <Image
                src="/accept.png"
                alt="Accept"
                width={20}
                height={20}
              />
            </button>
            <button
              onClick={() => decline(request.id, request.sender.id)}
              className="cursor-pointer"
            >
              <Image
                src="/reject.png"
                alt="Reject"
                width={20}
                height={20}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FriendRequestList;
