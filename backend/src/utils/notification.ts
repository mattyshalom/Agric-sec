import prisma from '../config/database';

interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: string;
  refId?: string;
  refType?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({ data: input });
}
