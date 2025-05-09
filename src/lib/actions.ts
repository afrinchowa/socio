'use server';

import { auth } from "@clerk/nextjs/server";
import prisma from "./client";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const ObjectIdSchema = z.string().length(24, "Invalid ObjectId format");

export const switchFollow = async (userId: string) => {
  const { userId: currentUserId } = auth();
  if (!currentUserId) throw new Error("User is not authenticated!");

  if (!ObjectIdSchema.safeParse(userId).success) throw new Error("Invalid user ID");

  try {
    const existingFollow = await prisma.follower.findFirst({
      where: {
        followerId: currentUserId,
        followingId: userId,
      },
    });

    if (existingFollow) {
      await prisma.follower.delete({ where: { id: existingFollow.id } });
    } else {
      const existingRequest = await prisma.followRequest.findFirst({
        where: {
          senderId: currentUserId,
          receiverId: userId,
        },
      });

      if (existingRequest) {
        await prisma.followRequest.delete({ where: { id: existingRequest.id } });
      } else {
        await prisma.followRequest.create({
          data: {
            senderId: currentUserId,
            receiverId: userId,
          },
        });
      }
    }
  } catch (err) {
    console.error(err);
    throw new Error("Failed to switch follow state.");
  }
};

export const switchBlock = async (userId: string) => {
  const { userId: currentUserId } = auth();
  if (!currentUserId) throw new Error("User is not authenticated!");

  if (!ObjectIdSchema.safeParse(userId).success) throw new Error("Invalid user ID");

  try {
    const existingBlock = await prisma.block.findFirst({
      where: {
        blockerId: currentUserId,
        blockedId: userId,
      },
    });

    if (existingBlock) {
      await prisma.block.delete({ where: { id: existingBlock.id } });
    } else {
      await prisma.block.create({
        data: {
          blockerId: currentUserId,
          blockedId: userId,
        },
      });
    }
  } catch (err) {
    console.error(err);
    throw new Error("Failed to switch block state.");
  }
};

export const acceptFollowRequest = async (userId: string) => {
  const { userId: currentUserId } = auth();
  if (!currentUserId) throw new Error("User is not authenticated!");

  if (!ObjectIdSchema.safeParse(userId).success) throw new Error("Invalid user ID");

  try {
    const request = await prisma.followRequest.findFirst({
      where: {
        senderId: userId,
        receiverId: currentUserId,
      },
    });

    if (request) {
      await prisma.followRequest.delete({ where: { id: request.id } });
      await prisma.follower.create({
        data: {
          followerId: userId,
          followingId: currentUserId,
        },
      });
    }
  } catch (err) {
    console.error(err);
    throw new Error("Failed to accept follow request.");
  }
};

export const declineFollowRequest = async (userId: string) => {
  const { userId: currentUserId } = auth();
  if (!currentUserId) throw new Error("User is not authenticated!");

  if (!ObjectIdSchema.safeParse(userId).success) throw new Error("Invalid user ID");

  try {
    const request = await prisma.followRequest.findFirst({
      where: {
        senderId: userId,
        receiverId: currentUserId,
      },
    });

    if (request) {
      await prisma.followRequest.delete({ where: { id: request.id } });
    }
  } catch (err) {
    console.error(err);
    throw new Error("Failed to decline follow request.");
  }
};

export const updateProfile = async (
  prevState: { success: boolean; error: boolean },
  payload: { formData: FormData; cover: string }
) => {
  const { formData, cover } = payload;
  const fields = Object.fromEntries(formData.entries());

  const filteredFields = Object.fromEntries(
    Object.entries(fields).filter(([_, value]) => value !== "")
  );

  const ProfileSchema = z.object({
    cover: z.string().optional(),
    name: z.string().max(60).optional(),
    surname: z.string().max(60).optional(),
    description: z.string().max(255).optional(),
    city: z.string().max(60).optional(),
    school: z.string().max(60).optional(),
    work: z.string().max(60).optional(),
    website: z.string().url().max(100).optional(),
  });

  const validated = ProfileSchema.safeParse({ cover, ...filteredFields });

  if (!validated.success) {
    console.error(validated.error.flatten().fieldErrors);
    return { success: false, error: true };
  }

  const { userId } = auth();
  if (!userId) return { success: false, error: true };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: validated.data,
    });

    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const switchLike = async (postId: string) => {
  const { userId } = auth();
  if (!userId) throw new Error("User is not authenticated!");
  if (!ObjectIdSchema.safeParse(postId).success) throw new Error("Invalid post ID");

  try {
    const like = await prisma.like.findFirst({
      where: { postId, userId },
    });

    if (like) {
      await prisma.like.delete({ where: { id: like.id } });
    } else {
      await prisma.like.create({
        data: {
          postId,
          userId,
        },
      });
    }
  } catch (err) {
    console.error(err);
    throw new Error("Failed to toggle like.");
  }
};

export const addComment = async (postId: string, desc: string) => {
  const { userId } = auth();
  if (!userId) throw new Error("User is not authenticated!");
  if (!ObjectIdSchema.safeParse(postId).success) throw new Error("Invalid post ID");

  try {
    const comment = await prisma.comment.create({
      data: {
        desc,
        postId,
        userId,
      },
      include: {
        user: true,
      },
    });

    return comment;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to add comment.");
  }
};

export const addPost = async (formData: FormData, img: string) => {
  const desc = formData.get("desc") as string;
  const DescSchema = z.string().min(1).max(255);
  const validated = DescSchema.safeParse(desc);

  if (!validated.success) {
    console.log("Invalid description.");
    return;
  }

  const { userId } = auth();
  if (!userId) throw new Error("User is not authenticated!");

  try {
    await prisma.post.create({
      data: {
        desc: validated.data,
        userId,
        img,
      },
    });

    revalidatePath("/");
  } catch (err) {
    console.error(err);
    throw new Error("Failed to add post.");
  }
};

export const addStory = async (img: string) => {
  const { userId } = auth();
  if (!userId) throw new Error("User is not authenticated!");

  try {
    const existing = await prisma.story.findFirst({ where: { userId } });

    if (existing) {
      await prisma.story.delete({ where: { id: existing.id } });
    }

    const newStory = await prisma.story.create({
      data: {
        userId,
        img,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      include: {
        user: true,
      },
    });

    return newStory;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to add story.");
  }
};

export const deletePost = async (postId: string) => {
  const { userId } = auth();
  if (!userId) throw new Error("User is not authenticated!");
  if (!ObjectIdSchema.safeParse(postId).success) throw new Error("Invalid post ID");

  try {
    await prisma.post.delete({
      where: {
        id: postId,
        userId,
      },
    });

    revalidatePath("/");
  } catch (err) {
    console.error(err);
    throw new Error("Failed to delete post.");
  }
};
