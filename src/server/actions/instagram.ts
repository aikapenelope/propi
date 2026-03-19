"use server";

import { graphApiFetch } from "@/lib/meta-api";
import { getSocialAccount } from "./social-accounts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getIgToken() {
  const account = await getSocialAccount("instagram");
  if (!account) throw new Error("Instagram no esta conectado. Ve a Configuracion.");
  return { token: account.accessToken, igId: account.platformAccountId };
}

// ---------------------------------------------------------------------------
// Types from Instagram Graph API
// ---------------------------------------------------------------------------

interface IgMedia {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  permalink?: string;
}

interface IgComment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
}

interface IgConversation {
  id: string;
  participants: { data: { id: string; username: string }[] };
  messages?: { data: IgMessage[] };
}

interface IgMessage {
  id: string;
  message?: string;
  from: { id: string; username?: string };
  created_time: string;
}

interface IgInsight {
  name: string;
  period: string;
  values: { value: number }[];
  title: string;
}

// ---------------------------------------------------------------------------
// Media (posts)
// ---------------------------------------------------------------------------

export async function getIgMedia(limit = 12) {
  const { token, igId } = await getIgToken();
  const data = await graphApiFetch<{ data: IgMedia[] }>(
    `/${igId}/media`,
    token,
    {
      params: {
        fields:
          "id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink",
        limit: String(limit),
      },
    },
  );
  return data.data;
}

export async function getIgMediaInsights(mediaId: string) {
  const { token } = await getIgToken();
  const data = await graphApiFetch<{ data: IgInsight[] }>(
    `/${mediaId}/insights`,
    token,
    {
      params: {
        metric: "impressions,reach,engagement,saved",
      },
    },
  );
  return data.data;
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export async function getIgComments(mediaId: string) {
  const { token } = await getIgToken();
  const data = await graphApiFetch<{ data: IgComment[] }>(
    `/${mediaId}/comments`,
    token,
    {
      params: { fields: "id,text,username,timestamp", limit: "50" },
    },
  );
  return data.data;
}

export async function replyToIgComment(commentId: string, message: string) {
  const { token } = await getIgToken();
  return graphApiFetch<{ id: string }>(
    `/${commentId}/replies`,
    token,
    {
      method: "POST",
      body: { message },
    },
  );
}

// ---------------------------------------------------------------------------
// DMs (Instagram Messaging API)
// ---------------------------------------------------------------------------

export async function getIgConversations(limit = 20) {
  const { token, igId } = await getIgToken();
  const data = await graphApiFetch<{ data: IgConversation[] }>(
    `/${igId}/conversations`,
    token,
    {
      params: {
        fields: "id,participants,messages{id,message,from,created_time}",
        limit: String(limit),
      },
    },
  );
  return data.data;
}

export async function sendIgMessage(recipientId: string, message: string) {
  const { token, igId } = await getIgToken();
  return graphApiFetch<{ id: string }>(
    `/${igId}/messages`,
    token,
    {
      method: "POST",
      body: {
        recipient: { id: recipientId },
        message: { text: message },
      },
    },
  );
}

// ---------------------------------------------------------------------------
// Publish (Content Publishing API)
// ---------------------------------------------------------------------------

export async function publishIgPhoto(imageUrl: string, caption: string) {
  const { token, igId } = await getIgToken();

  // Step 1: Create media container
  const container = await graphApiFetch<{ id: string }>(
    `/${igId}/media`,
    token,
    {
      method: "POST",
      body: { image_url: imageUrl, caption },
    },
  );

  // Step 2: Publish the container
  const result = await graphApiFetch<{ id: string }>(
    `/${igId}/media_publish`,
    token,
    {
      method: "POST",
      body: { creation_id: container.id },
    },
  );

  return result;
}

// ---------------------------------------------------------------------------
// Account Insights
// ---------------------------------------------------------------------------

export async function getIgAccountInsights() {
  const { token, igId } = await getIgToken();
  const data = await graphApiFetch<{ data: IgInsight[] }>(
    `/${igId}/insights`,
    token,
    {
      params: {
        metric: "impressions,reach,profile_views",
        period: "day",
      },
    },
  );
  return data.data;
}
