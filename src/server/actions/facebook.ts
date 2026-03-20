"use server";

import { graphApiFetch } from "@/lib/meta-api";
import { getSocialAccount } from "./social-accounts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getFbToken() {
  const account = await getSocialAccount("facebook");
  if (!account) throw new Error("Facebook no esta conectado. Ve a Configuracion.");
  return { token: account.accessToken, pageId: account.platformAccountId };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FbPost {
  id: string;
  message?: string;
  created_time: string;
  full_picture?: string;
  permalink_url?: string;
  likes?: { summary: { total_count: number } };
  comments?: { summary: { total_count: number }; data: FbComment[] };
}

interface FbComment {
  id: string;
  message: string;
  from?: { name: string; id: string };
  created_time: string;
}

interface FbInsight {
  name: string;
  period: string;
  values: { value: number | Record<string, number>; end_time: string }[];
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export async function getFbPosts(limit = 10) {
  const { token, pageId } = await getFbToken();
  const data = await graphApiFetch<{ data: FbPost[] }>(
    `/${pageId}/posts`,
    token,
    {
      params: {
        fields:
          "id,message,created_time,full_picture,permalink_url,likes.summary(true),comments.summary(true).limit(5){id,message,from,created_time}",
        limit: String(limit),
      },
    },
  );
  return data.data;
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

export async function publishFbPost(message: string, link?: string) {
  const { token, pageId } = await getFbToken();
  const body: Record<string, unknown> = { message };
  if (link) body.link = link;

  return graphApiFetch<{ id: string }>(
    `/${pageId}/feed`,
    token,
    { method: "POST", body },
  );
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export async function getFbPostComments(postId: string) {
  const { token } = await getFbToken();
  const data = await graphApiFetch<{ data: FbComment[] }>(
    `/${postId}/comments`,
    token,
    {
      params: { fields: "id,message,from,created_time", limit: "50" },
    },
  );
  return data.data;
}

export async function replyToFbComment(commentId: string, message: string) {
  const { token } = await getFbToken();
  return graphApiFetch<{ id: string }>(
    `/${commentId}/comments`,
    token,
    { method: "POST", body: { message } },
  );
}

/** Post a new comment on a post (not a reply to an existing comment) */
export async function commentOnFbPost(postId: string, message: string) {
  const { token } = await getFbToken();
  return graphApiFetch<{ id: string }>(
    `/${postId}/comments`,
    token,
    { method: "POST", body: { message } },
  );
}

// ---------------------------------------------------------------------------
// Page Insights
// ---------------------------------------------------------------------------

export async function getFbPageInsights() {
  const { token, pageId } = await getFbToken();
  const data = await graphApiFetch<{ data: FbInsight[] }>(
    `/${pageId}/insights`,
    token,
    {
      params: {
        metric:
          "page_impressions,page_engaged_users,page_fans,page_views_total",
        period: "day",
      },
    },
  );
  return data.data;
}
